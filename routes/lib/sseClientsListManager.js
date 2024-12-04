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

    async getClientList(id, participant, type) {
        // If id is an ObjectID, convert it to a string
        var activityId = (id && typeof id.toHexString === 'function') ? id.toHexString() : id;
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            let activities = await StudyManager.getActivitiesInStudy(client.id);
            let activitiesId = [];
            for(var i =0; i < activities.length; i++) {
                activitiesId.push(activities[i].id);
            }
            if (client.userRole === 'teacher') {
                // Check if the client's study includes the activityId
                if (activitiesId.includes(activityId)) {
                    clientsToSend.push(clientId); // Add to the list if conditions are met
                }
            } else if (client.userRole === 'student') {
                if(client.user == participant) {
                    if (activitiesId.includes(activityId)) {
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