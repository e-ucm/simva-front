(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){(function (){
let config = {}

let default_protocol_ports = {
	"http": 80,
	"https": 443
};

config.simva = {}
config.simva.port  = parseInt(process.env.SIMVA_PORT || 3050);
config.simva.host = process.env.SIMVA_HOST || 'simva.external.test'
config.simva.protocol = process.env.SIMVA_PROTOCOL || 'https'
let simvaPort = ((default_protocol_ports[config.simva.protocol] !== config.simva.port) ? `:${config.simva.port}` : '')
config.simva.url = process.env.SIMVA_URL || `${config.simva.protocol}://${config.simva.host}${simvaPort}`;

config.mongo = {}
config.mongo.host = process.env.MONGO_HOST || 'localhost:27017'
config.mongo.db = process.env.MONGO_DB || '/simva-front'
config.mongo.url = `mongodb://${config.mongo.host}${config.mongo.db}`
config.mongo.test = config.mongo.url

config.sso = {}
config.sso.host = process.env.SSO_HOST || 'sso.external.test'
config.sso.protocol = process.env.SSO_PROTOCOL || 'https'
config.sso.port = process.env.SSO_PORT || '443'
config.sso.url = `${config.sso.protocol}://${config.sso.host}:${config.sso.port}`

config.sso.realm = process.env.SSO_REALM || 'simva'
config.sso.clientId = process.env.SSO_CLIENT_ID || 'simva'
config.sso.clientSecret = process.env.SSO_CLIENT_SECRET || 'th1s_1s_th3_s3cr3t'
config.sso.sslRequired = process.env.SSO_SSL_REQUIRED || 'external'
config.sso.publicClient = process.env.SSO_PUBLIC_CLIENT || 'false'

config.sso.accountPath = process.env.SSO_ACCOUNT_PATH || '/account'
config.sso.accountUrl = `${config.sso.url}/realms/${config.sso.realm}${config.sso.accountPath}?referrer=${config.sso.clientId}&referrer_uri=${config.simva.url}`
config.sso.userCanSelectRole=process.env.SSO_USER_CAN_SELECT_ROLE || "true"
config.sso.administratorContact= process.env.SSO_ADMINISTRATOR_CONTACT || "contact@administrator.com"
config.sso.studentAllowedRole = (process.env.SSO_STUDENT_ALLOWED_ROLE === "true") ? "student" : null
config.sso.teachingAssistantAllowedRole = (process.env.SSO_TEACHING_ASSISTANT_ALLOWED_ROLE === "true") ? "teaching-assistant" :  null
config.sso.teacherAllowedRole = (process.env.SSO_TEACHER_ALLOWED_ROLE === "true") ? "teacher" :  null
config.sso.researcherAllowedRole = (process.env.SSO_RESEARCHER_ALLOWED_ROLE === "true") ? "researcher" :  null
config.sso.allowedRoles = [config.sso.researcherAllowedRole, config.sso.teacherAllowedRole, config.sso.teachingAssistantAllowedRole, config.sso.studentAllowedRole ]
	.filter(role => role !== null)
	.join(',');

config.api = {}
config.api.host = process.env.SIMVA_API_HOST || 'simva-api.external.test'
config.api.protocol = process.env.SIMVA_API_PROTOCOL || 'https'
config.api.wss_protocol = process.env.SIMVA_API_PROTOCOL || 'wss'
config.api.port = process.env.SIMVA_API_PORT || '443'
config.api.url = `${config.api.protocol}://${config.api.host}:${config.api.port}`;
config.api.wss_url = `${config.api.wss_protocol}://${config.api.host}:${config.api.port}/update`;

config.limesurvey = {}
config.limesurvey.host = process.env.LIMESURVEY_HOST || 'limesurvey.external.test'
config.limesurvey.protocol = process.env.LIMESURVEY_PROTOCOL || 'https'
config.limesurvey.port = process.env.LIMESURVEY_PORT || '443'
config.limesurvey.url =  `${config.limesurvey.protocol}://${config.limesurvey.host}:${config.limesurvey.port}`
config.limesurvey.adminUser =  process.env.LIMESURVEY_ADMIN_USER || 'admin'
config.limesurvey.adminPassword = process.env.LIMESURVEY_ADMIN_PASSWORD || 'password'

config.lti = {}
config.lti.enabled = process.env.LTI_ENABLED || 'false'

config.hmac = {}
config.hmac.password = process.env.HMAC_PASSWORD || 'password'
config.hmac.salt = process.env.HMAC_SALT || 'mysalt'
config.hmac.key = process.env.HMAC_KEY || 'mykey'

module.exports = config;
}).call(this)}).call(this,require('_process'))
},{"_process":6}],2:[function(require,module,exports){
var { signMessage, createHMACKey, importKey } = require("./hMacKey/crypto.js");
var config = require("../../config.js");

class SSEClientManager {
    constructor(url, mapParameters = {}) {
        this.url = url; // SSE server URL
        this.mapParameters = mapParameters;
        this.eventSource = null; // The EventSource instance
        this.listeners = {}; // Store custom event listeners
        this.reconnectInterval = 5000; // Time to wait before attempting to reconnect (in ms)
        this.isConnected = false;
        this.init(); // Initialize connection
    }

    async createUrl() {
        const buffer = new Uint8Array(8);
        crypto.getRandomValues(buffer);

        this.mapParameters.ts = (new Date()).toISOString();
        var map = new Map();
        Object.entries(this.mapParameters)
            .map(([key, value]) => map.set(key, value));
        var toSign=Object.entries(this.mapParameters)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by keys
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');
        toSign=this.url + '\n' + toSign;
        var signature;
        try {
            if(config.hmac.hmacKey == null) {
                console.log("initializing hmackey");
                config.hmac.hmacKey = (await createHMACKey(config.hmac.password)).key;
            }
            signature = await signMessage(toSign, config.hmac.hmacKey);
        } catch(e) {
            console.log(e);
            signature = "TODO";
        }
        const queryString = Object.entries(this.mapParameters)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by keys
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        this.url = this.url + `?${queryString}&signature=${signature}`;
    }

    // Initialize EventSource connection
    async init() {
        await this.createUrl();
        this.eventSource = new EventSource(this.url);

        // Handle standard message event
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if(data.type) {
                this.triggerEvent(data.type, data); // Trigger custom listeners for other data.type
            } else  {
                this.triggerEvent("message", data); // Trigger custom listeners for 'message'
            }
            console.log('Received message:', data);
        };

        // Handle errors and reconnection
        this.eventSource.onerror = (event) => {
            console.error('SSE Error:', event);
            if (this.eventSource.readyState === EventSource.CLOSED) {
                console.log('Connection closed. Attempting to reconnect...');
                this.isConnected = false;
                this.reconnect();
            }
        };

        // Handle successful connection
        this.eventSource.onopen = () => {
            this.isConnected = true;
            console.log('Connected to SSE server');
            this.triggerEvent('open'); // Trigger 'open' event
        };
    }

    // Reconnect in case of connection failure
    reconnect() {
        if (!this.isConnected) {
            setTimeout(() => {
                console.log('Reconnecting to SSE server...');
                this.init(); // Attempt to reconnect
            }, this.reconnectInterval);
        }
    }

    // Close the SSE connection manually
    closeConnection() {
        if (this.eventSource) {
            this.eventSource.close();
            console.log('SSE connection closed');
        }
    }

    // Add a custom event listener
    on(eventType, callback) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push(callback);
    }

    // Trigger custom event listeners
    triggerEvent(eventType, data = null) {
        const eventListeners = this.listeners[eventType];
        if (eventListeners) {
            eventListeners.forEach((callback) => callback(data));
        }
    }

    // Remove all listeners for a specific event type
    removeListeners(eventType) {
        if (this.listeners[eventType]) {
            delete this.listeners[eventType];
        }
    }

    // Check if the client is connected
    isConnected() {
        return this.isConnected;
    }
}

module.exports = SSEClientManager;
// Expose to the global scope
window.SSEClientManager = SSEClientManager;
},{"../../config.js":1,"./hMacKey/crypto.js":5}],3:[function(require,module,exports){
/**
 * Base-N/Base-X encoding/decoding functions.
 *
 * Original implementation from base-x:
 * https://github.com/cryptocoinjs/base-x
 *
 * Which is MIT licensed:
 *
 * The MIT License (MIT)
 *
 * Copyright base-x contributors (c) 2016
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
// baseN alphabet indexes
const _reverseAlphabets = {};

/**
 * BaseN-encodes a Uint8Array using the given alphabet.
 *
 * @param {Uint8Array} input - The bytes to encode in a Uint8Array.
 * @param {string} alphabet - The alphabet to use for encoding.
 * @param {number} maxline - The maximum number of encoded characters per line
 *          to use, defaults to none.
 *
 * @returns {string} The baseN-encoded output string.
 */
function encode(input, alphabet, maxline) {
    if (!(input instanceof Uint8Array)) {
        throw new TypeError('"input" must be a Uint8Array.');
    }
    if (typeof alphabet !== 'string') {
        throw new TypeError('"alphabet" must be a string.');
    }
    if (maxline !== undefined && typeof maxline !== 'number') {
        throw new TypeError('"maxline" must be a number.');
    }
    if (input.length === 0) {
        return '';
    }

    let output = '';

    let i = 0;
    const base = alphabet.length;
    const first = alphabet.charAt(0);
    const digits = [0];
    for (i = 0; i < input.length; ++i) {
        let carry = input[i];
        for (let j = 0; j < digits.length; ++j) {
            carry += digits[j] << 8;
            digits[j] = carry % base;
            carry = (carry / base) | 0;
        }

        while (carry > 0) {
            digits.push(carry % base);
            carry = (carry / base) | 0;
        }
    }

    // deal with leading zeros
    for (i = 0; input[i] === 0 && i < input.length - 1; ++i) {
        output += first;
    }
    // convert digits to a string
    for (i = digits.length - 1; i >= 0; --i) {
        output += alphabet[digits[i]];
    }

    if (maxline) {
        const regex = new RegExp('.{1,' + maxline + '}', 'g');
        output = output.match(regex).join('\r\n');
    }

    return output;
}

/**
 * Decodes a baseN-encoded (using the given alphabet) string to a
 * Uint8Array.
 *
 * @param {string} input - The baseN-encoded input string.
 * @param {string} alphabet - The alphabet to use for decoding.
 *
 * @returns {Uint8Array} The decoded bytes in a Uint8Array.
 */
function decode(input, alphabet) {
    if (typeof input !== 'string') {
        throw new TypeError('"input" must be a string.');
    }
    if (typeof alphabet !== 'string') {
        throw new TypeError('"alphabet" must be a string.');
    }
    if (input.length === 0) {
        return new Uint8Array();
    }

    let table = _reverseAlphabets[alphabet];
    if (!table) {
        // compute reverse alphabet
        table = _reverseAlphabets[alphabet] = [];
        for (let i = 0; i < alphabet.length; ++i) {
            table[alphabet.charCodeAt(i)] = i;
        }
    }

    // remove whitespace characters
    input = input.replace(/\s/g, '');

    const base = alphabet.length;
    const first = alphabet.charAt(0);
    const bytes = [0];
    for (let i = 0; i < input.length; i++) {
        const value = table[input.charCodeAt(i)];
        if (value === undefined) {
            return;
        }

        let carry = value;
        for (let j = 0; j < bytes.length; ++j) {
            carry += bytes[j] * base;
            bytes[j] = carry & 0xff;
            carry >>= 8;
        }

        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }

    // deal with leading zeros
    for (let k = 0; input[k] === first && k < input.length - 1; ++k) {
        bytes.push(0);
    }

    return new Uint8Array(bytes.reverse());
}

module.exports = { encode, decode };
},{}],4:[function(require,module,exports){
/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
const {
    encode : _encode,
    decode : _decode
} = require('./baseN.js');

// base58 characters (Bitcoin alphabet)
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * 
 * @param {Uint8Array} input 
 * @returns {string}
 */

function encode(input, maxline) {
    return _encode(input, alphabet, maxline);
}

/**
 * 
 * @param {string} input 
 * @returns {Uint8Array}
 */
function decode(input) {
    return _decode(input, alphabet);
}

module.exports = {decode, encode};
},{"./baseN.js":3}],5:[function(require,module,exports){
const { decode, encode } = require('./base58-universal/index.js');

/**
 * 
 * @param {string} message 
 * @returns 
 */
function getMessageEncoding(message) {
    let enc = new TextEncoder();
    return enc.encode(message);
}

/**
 * 
 * @param {string} message
 * @param {CryptoKey} key 
 * 
 * @returns {Promise<string>}
 */
async function signMessage(message, key) {
    const encoded = getMessageEncoding(message);
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoded
    );

    const value = encode(new Uint8Array(signature));
    return value;
}

/**
 * 
 * @param {string} message
 * @param {string} signature
 * @param {CryptoKey} key 
 * 
 * @returns {Promise<boolean>}
 */
async function verifyMessage(message, signature, key) {
    const decodedSignature = decode(signature);
    const encoded = getMessageEncoding(message);
    const result = await crypto.subtle.verify(
        "HMAC",
        key,
        decodedSignature,
        encoded
    );

    return result;
}

/** @type {HmacKeyGenParams} */
const ALGORITHM = {
    name: "HMAC",
    hash: { name: "SHA-1" }
};

/**
 * @returns {Promise<CryptoKey>}
 */
async function generateRandomHMACKey() {
    const key = await crypto.subtle.generateKey(
        ALGORITHM,
        true,
        ["sign", "verify"]
    );
    return key;
}

/**
 * @param {string} textKey
 *
 * @returns {Promise<CryptoKey>}
 */
async function importKey(textKey, format) {
    const encoded = getMessageEncoding(textKey);

    const key = await crypto.subtle.importKey(
        format, // raw format of the key - should be Uint8Array
        encoded,
        ALGORITHM,
        false, // = false
        ["sign", "verify"] // what this key can do
    );

    return key;
}

/**
 * @param {CryptoKey} textKey
 *
 * @returns {Promise<string>} textKey
 */
async function exportKey(key, format) {
    const textKey = await crypto.subtle.exportKey(format, key);
    return textKey;
}

/**
 * 
 * @param {Uint8Array | string} password 
 * @returns {Promise<CryptoKey>}
 */
async function getKeyMaterial(password) {
    let encodedPassword;

    if (typeof password === 'string') {
        encodedPassword = getMessageEncoding(password);
    } else {
        encodedPassword = password;
    }

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encodedPassword,
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"],
    );

    return keyMaterial;
}

/**
 * 
 * @param {CryptoKey} keyMaterial 
 * @param {Uint8Array} salt 
 * @returns 
 */
async function getWrapKey(keyMaterial, salt) {
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-KW", length: 256 },
        true,
        ["wrapKey", "unwrapKey"],
    );
}

/**
 * 
 * @param {CryptoKey} keyToWrap 
 * @param {CryptoKey} keyMaterial 
 * @param {Uint8Array} salt
 * 
 * @returns {Promise<string>}
 */
async function wrapCryptoKey(keyToWrap, keyMaterial, salt) {
    const wrappingKey = await getWrapKey(keyMaterial, salt);

    const wrappedKey = await crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, "AES-KW");
    const encodedWrappedKey = encode(new Uint8Array(wrappedKey));
    return encodedWrappedKey;
}

/**
 * 
 * @param {number} size
 * 
 * @returns {Uint8Array} 
 */
function generateSalt(size = 16) {
    return crypto.getRandomValues(new Uint8Array(size));
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/wrapKey#examples
/*
window.crypto.subtle
  .generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  )
  .then((secretKey) => wrapCryptoKey(secretKey))
  .then((wrappedKey) => console.log(wrappedKey));
  */

/**
 * 
 * @param {Uint8Array} wrappedKey 
 * @param {CryptoKey} keyMaterial 
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function unwrapHmacKey(wrappedKey, keyMaterial, salt) {
    const unwrappingKey = await getWrapKey(keyMaterial, salt);

    const unwrappedKey = await crypto.subtle.unwrapKey(
        "raw", // import format
        wrappedKey, // ArrayBuffer representing key to unwrap
        unwrappingKey, // CryptoKey representing key encryption key
        "AES-KW", // algorithm identifier for key encryption key
        ALGORITHM, // algorithm identifier for key to unwrap
        true, // extractability of key to unwrap
        ["sign", "verify"], // key usages for key to unwrap
    );
    return unwrappedKey;
}


const DEFAULT_PASSWORD='12345';

/**
 * @param {string} [encodedPassword]
 * @param {HMACKey} [hmacKey]
 *
 * @returns {Promise<CreateHMACKey>}
 */
async function createHMACKey(encodedPassword = DEFAULT_PASSWORD, hmacKey) {
    let encodedSalt = '';
    let encodedKey = '';
    if (hmacKey) {
        encodedKey = hmacKey.encodedKey;
        encodedSalt = hmacKey.encodedSalt;
    }

    let salt;
    if (encodedSalt && encodedSalt.length > 0) {
        salt = decode(encodedSalt);
    } else {
        salt = generateSalt();
        encodedSalt = encode(salt)
    }

    let keyMaterial;
    if (encodedPassword && encodedPassword.length > 0) {
        const password = decode(encodedPassword);
        keyMaterial = await getKeyMaterial(password);
    } else {
        const password = generateSalt();
        encodedPassword = encode(password);
        keyMaterial = await getKeyMaterial(password);
    }

    let key;
    if (encodedKey && encodedKey.length > 0) {
        const keyBytes = decode(encodedKey);
        key = await unwrapHmacKey(keyBytes, keyMaterial, salt);
    } else {
        key = await generateRandomHMACKey();
        encodedKey = await wrapCryptoKey(key, keyMaterial, salt);
    }


    return {
        key,
        salt,
        encodedKey,
        encodedSalt,
        encodedPassword
    };
}

module.exports = {createHMACKey, importKey,  exportKey, signMessage, verifyMessage };
},{"./base58-universal/index.js":4}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[2]);
