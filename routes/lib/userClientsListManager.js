const logger = require("../../logger");
const config = require("../../config");
let usertools = require('./usertools');

class UserClientsListManager {
    constructor() {
        this.sessionClients = new Map();
        this.sessions = new Map();
    }

    addUserSession(session) {
        var obj = { session: session , jwtdecoded : usertools.decodeJWT(session.user.jwt)};
        this.sessions.set(session.id, obj);
        this.displaySessions();
    }

    displaySessions() {
        logger.info("Sessions : {");
        for (let [sessionId, sessionData] of this.sessions) {
            logger.info("   " + sessionId + ":" + JSON.stringify(sessionData, null)+ ",");
        }
        logger.info("}");
    }

    refreshAuth(sessionId, access_token, refresh_token) {
        var clientData = this.sessions.get(sessionId);
        clientData.session.user.jwt = access_token;
        clientData.jwtdecoded = usertools.decodeJWT(access_token);
        clientData.session.user.refreshToken = refresh_token;
        this.sessions.set(sessionId, clientData);
    }

    getRefreshClientList() {
        let clientsToSend = [];
        for (let [sessionId, sessionData] of this.sessions) {
            let expirationTimeSubxMin = sessionData.jwtdecoded.exp; // substract x minutes in milliseconds
            let now = Date.now() / 1000;
            if (now > expirationTimeSubxMin) { // Check if practicly expired
                clientsToSend.push(this.sessionClients.get(sessionId));
            }
        }
        return clientsToSend;
    }
    
    removeSession(sessionId) {
        this.sessions.delete(sessionId);
        this.sessionClients.delete(sessionId);
        this.displayClients();
        this.displaySessions();
    }

    addClient(sessionId, clientId) {
        this.sessionClients.set(sessionId, clientId);
        this.displayClients();
    }

    displayClients() {
        logger.info("Clients : {");
        for (let [sessionId, clientId] of this.sessionClients) {
            logger.info("   " + sessionId + ":" + clientId+ ",");
        }
        logger.info("}");
    }
}

module.exports = new UserClientsListManager();