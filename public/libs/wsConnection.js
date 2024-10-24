// wsConnection.js
class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.listeners = [];
    }

    // Initialize and connect to the WebSocket server
    connect() {
        this.ws = new WebSocket(this.url);

        // Handle connection open
        this.ws.addEventListener('open', () => {
            console.log(`Connected to WebSocket server at ${this.url}`);
        });

        // Handle incoming messages
        this.ws.addEventListener('message', (message) => {
            console.log('Received message:', message);

            // Notify listeners of the new message
            this.listeners.forEach(listener => listener(message));
        });

        // Handle connection close
        this.ws.addEventListener('close', () => {
            console.log('Disconnected from WebSocket server');
        });

        // Handle errors
        this.ws.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    // Send a message to the WebSocket server
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. Cannot send message.');
        }
    }

    // Add a listener for incoming messages
    addMessageListener(listener) {
        this.listeners.push(listener);
    }

    // Remove a listener for incoming messages
    removeMessageListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    // Close the WebSocket connection
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
