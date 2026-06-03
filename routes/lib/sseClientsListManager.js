const logger = require("../../logger");

// sseManager.js
class SSEClientsListManager {
    constructor() {
        this.clients = new Map();
    }

    addActivityAndUserToMap(id, user, userRole, clientId, userId) {
        var obj = { user : user, userRole : userRole, id : id, userId: userId };
        obj.lastTime= Date.now();
        this.clients.set(clientId, obj);
        this.displayClients();
    }

    addGroupAndUserToMap(id, user, userRole, clientId, userId) {
        var obj = { user : user, userRole : userRole, id : id, userId: userId };
        obj.lastTime= Date.now();
        this.clients.set(clientId, obj);
        this.displayClients();
    }

    displayClients() {
        logger.info("{");
        for (let [clientId, clientData] of this.clients) {
            logger.info("   " + clientId + ":" + JSON.stringify(clientData)+ ",");
        }
        logger.info("}");
    }

    getTimeSuperiorToXMinClientList(minutes) {
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            let fiveMinutesLater = new Date(client.lastTime).getTime() + minutes * 60 * 1000; // Add 5 minutes in milliseconds

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
        const studyId = message.studyId ?? message.simlet_id;
        const groupId = message.groupId ?? message.group_id;
        const messageUser = message.user ?? message.username;
        const messageUserId = message.userId ?? message.user_id ?? message.participant_id;

        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            if (client.userRole === 'teacher') {
                // Check if the client's study includes the studyId or the groupId
                if (client.id == studyId || client.id == groupId) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                    client.lastTime= Date.now();
                    this.clients.set(clientId, client);
                }
            } else if (client.userRole === 'student') {
                const sameStudy = client.id == studyId;
                const sameUserById = (client.userId !== undefined && client.userId !== null && messageUserId !== undefined && messageUserId !== null)
                    ? String(client.userId) === String(messageUserId)
                    : false;
                const sameUserByName = (client.user !== undefined && client.user !== null && messageUser !== undefined && messageUser !== null)
                    ? String(client.user) === String(messageUser)
                    : false;

                if(sameStudy && (sameUserById || sameUserByName)) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                    client.lastTime= Date.now();
                    this.clients.set(clientId, client);
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