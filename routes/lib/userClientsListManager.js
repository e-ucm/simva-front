const logger = require("../../logger");
const config = require("../../config");
let usertools = require('./usertools');

class UserClientsListManager {
    constructor() {
        this.clients = new Map();
    }

    addUser(session) {
        var cliendId = this.generateClientId();
        var obj = { session: session , jwtdecoded : usertools.decodeJWT(session.user.jwt)};
        this.clients.set(cliendId, obj);
        return cliendId;
    }

    // Generate a unique client ID
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
    }

    displayClients() {
        logger.debug("{");
        for (let [clientId, clientData] of this.clients) {
            logger.debug("   " + clientId + ":" + JSON.stringify(clientData, null, 2)+ ",");
        }
        logger.debug("}");
    }

    refreshAuth(clientIds) {
        for(let i=0; i < clientIds.length; i++) {
            var clientId = clientIds[i];
            var clientData = this.clients.get(clientId);
            usertools.refreshAuth(clientData.session, config, (error, result) => {
                if(!error) {
                    logger.debug(result);
                    clientData.session.user.jwt = result.access_token;
                    clientData.jwtdecoded = usertools.decodeJWT(result.access_token);
                    clientData.session.user.refreshToken = result.refresh_token;
                    this.clients.set(clientId, clientData);
                } else {
                    logger.debug(error);
                }
            });
        }
    }

    getRefreshClientList() {
        let clientsToSend = [];
        for (let [clientId, clientData] of this.clients) {
            let client = clientData; // Parse the stored client data
            let expirationTimeSubxMin = clientData.jwtdecoded.exp; // substract x minutes in milliseconds
            let now = Date.now() / 1000;
            if (now > expirationTimeSubxMin) { // Check if practicly expired
                clientsToSend.push(clientId);
                this.clients.set(clientId, client);
            }
        }
        return clientsToSend;
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
        this.displayClients();
    }
}

module.exports = new UserClientsListManager();