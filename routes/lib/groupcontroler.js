const logger = require('../../logger');
const Simva  = require('./simva');

module.exports = {
    async getCompleteGroup(groupid, sessionid) {
        let group=await this.getGroup(groupid, sessionid);
        group.completeParticipants=await this.getGroupParticipants(groupid, sessionid);
        return group;
    },

    getGroups(sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getGroups(sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getGroup(groupid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getGroup(groupid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getGroupParticipants(groupid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getGroupParticipants(groupid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },
}