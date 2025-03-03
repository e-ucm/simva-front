const logger = require("../../logger");

var jwt = require('jsonwebtoken');

class UserClientsListManager {
    constructor() {
        this.sessionClients = new Map();
        this.sessions = new Map();
    }

    addUserSession(session) {
        var obj = { session: session};
        if(session.user && session.user.jwt) {
            obj.jwtdecoded = jwt.decode(session.user.jwt);
        }
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

    getJWT(sessionId) {
        let result = this.sessions.get(sessionId);
        if(result && result.session && result.session.user && result.session.user.jwt) {
            return result.session.user.jwt;
        }
    }

    getSession(sessionId) {
        let result = this.sessions.get(sessionId);
        if(result && result.session) {
            return result.session;
        } else {
            result = { id : sessionId };
        }
    }

    refreshAuth(sessionId, access_token, refresh_token) {
        var clientData = this.sessions.get(sessionId);
        clientData.session.user.jwt = access_token;
        clientData.jwtdecoded = jwt.decode(access_token);
        //clientData.session.user.refreshToken = refresh_token;
        this.sessions.set(sessionId, clientData);
    }

    getRefreshClientList(sessions) {
        let clientsToSend = [];
        for (let i = 0; i < sessions.length; i++) {
            let sessionId = sessions[i];
            var clients = this.sessionClients.get(sessionId);
                for(let j = 0; j < clients.length; j++) {
                    clientsToSend.push(clients[j]);
                }
        }
        return clientsToSend;
    }

    removeSession(sessionId) {
        this.sessionClients.delete(sessionId);
        this.sessions.delete(sessionId);
        this.displayClients();
        this.displaySessions();
    }

    addClient(sessionId, clientId) {
        var clients = this.sessionClients.get(sessionId);
        if(clients) {
            clients.push(clientId);
            this.sessionClients.set(sessionId, clients);
        } else {
            this.sessionClients.set(sessionId, [ clientId ]);
        }
        this.displayClients();
    }
    
    removeClient(sessionId, clientId) {
        var clients = this.sessionClients.get(sessionId);
        if(clients) {
            var clientsFiltered = clients.filter(item => item !== clientId);
            if(clientsFiltered.length == 0) {
                this.sessionClients.delete(sessionId);
            } else {
                this.sessionClients.set(sessionId, clientsFiltered);
            }
        }
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