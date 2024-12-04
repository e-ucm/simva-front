const logger = require("../../logger");
var StudyManager = require("./studyManager"); 

// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients = new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId) {
        var obj = { user : user, userRole : userRole, id : id};
        this.clients.set(clientId, obj);
    }

    displayClients() {
        logger.info("{");
        for (let [clientId, clientData] of this.clients) {
            logger.info("   " + clientId + ":" + JSON.stringify(clientData)+ ",");
        }
        logger.info("}");
    }

    async getClientList(message) {
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            if (client.userRole === 'teacher') {
                // Check if the client's study includes the studyId
                if (client.id == message.studyId) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                }
            } else if (client.userRole === 'student') {
                if(client.user == message.participant) {
                    if (client.id == message.studyId) {
                        clientsToSend.push(clientId); // Add to the list if conditions are met
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