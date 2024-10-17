/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {
    encode as _encode,
    decode as _decode
} from './baseN.js';

// base58 characters (Bitcoin alphabet)
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * 
 * @param {Uint8Array} input 
 * @returns {string}
 */

export function encode(input, maxline) {
    return _encode(input, alphabet, maxline);
}

/**
 * 
 * @param {string} input 
 * @returns {Uint8Array}
 */
export function decode(input) {
    return _decode(input, alphabet);
}