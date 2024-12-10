const logger = require("../../logger");

// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients = new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId) {
        var obj = { user : user, userRole : userRole, id : id};
        obj.lastTime= Date.now();
        this.clients.set(clientId, obj);
    }

    displayClients() {
        logger.info("{");
        for (let [clientId, clientData] of this.clients) {
            logger.info("   " + clientId + ":" + JSON.stringify(clientData)+ ",");
        }
        logger.info("}");
    }

    getTimeSuperiorTo5MinClientList() {
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            let fiveMinutesLater = new Date(client.lastTime).getTime() + 5 * 60 * 1000; // Add 5 minutes in milliseconds

            if (fiveMinutesLater <= Date.now()) { // Check if 5 minutes have passed
                clientsToSend.push(clientId);
                client.lastTime= Date.now();
                this.clients.set(clientId, client);
            }
        }
        return clientsToSend;
    }

    getClientList(message) {
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            if (client.userRole === 'teacher') {
                // Check if the client's study includes the studyId
                if (client.id == message.studyId) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                    client.lastTime= Date.now();
                    this.clients.set(clientId, client);
                }
            } else if (client.userRole === 'student') {
                if(client.user == message.user) {
                    if (client.id == message.studyId) {
                        clientsToSend.push(clientId); // Add to the list if conditions are met
                        client.lastTime= Date.now();
                        this.clients.set(clientId, client);
                    }
                }
            } else {
                logger.info(`Client ${clientId} is not authorized.`);
            }
        }
        return clientsToSend;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        this.displayClients();
    }
}

module.exports = new SSEClientsListManager();