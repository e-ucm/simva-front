const logger = require('../../logger');
const SimvaAsync  = require('./simvaAsync');
const usertools = require('./usertools');

module.exports = {
    async getCompleteGroup(simlet_id, group_id, sessionid) {
        let group = await SimvaAsync.getGroup(simlet_id, group_id, sessionid);
        try {
            group.completeParticipants = await SimvaAsync.getGroupParticipants(simlet_id, group_id, sessionid);
        } catch(e) {
           logger.warn(e);
        }
        try {
            group.direct_permissions = [];
        } catch(e) {
           logger.warn(e);
        }
        return group;
    },

    async generateStudentUser(simlet_id, params, sessionid) {
        let username;
        if(params.username) {
            username=params.username;
        } else {
            username=usertools.generateUsername(params.algorithm, params.length);
        }
        logger.info(`Generated username ${username} for group ID ${params.groupid} using algorithm ${params.algorithm} with length ${params.length}`);
        if(params.checkIfExists) {
            user = await SimvaAsync.getUser(username, sessionid);
            if(user.username) {
                return user;
            }
        } 
        user = await SimvaAsync.registerGeneratedUser(simlet_id, params.groupid, username, sessionid);
        return user;
    },

    async generateStudentUserWithRetry(simlet_id, params, sessionid, maxRetries, retryCount = 0) {
        try {
            const student = await this.generateStudentUser(simlet_id, params, sessionid);
            return student;
        } catch (e) {
            if (retryCount < maxRetries) {
                logger.debug(`Retry ${retryCount + 1}: failed to generate user →`, e);
                return this.generateStudentUserWithRetry(simlet_id, params, sessionid, maxRetries, retryCount + 1);
            } else {
                throw new Error(`Failed after ${maxRetries} retries: ${e.message}`);
            }
        }
    }
}