var { signMessage, createHMACKey, importKey } = require("./hMacKey/crypto.js");
var { config } = require("../../config.js");

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
            let hmacKey=null;
            hmacKey = (await createHMACKey(//config.hmac.password
                //, {
                //  encodedSalt: config.hmac.salt,
                //  encodedKey: config.hmac.key
                //}
            )).key;
            signature = await signMessage(toSign, hmacKey);
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