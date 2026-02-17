const logger = require('../../logger');
const SimvaAsync  = require('./simvaAsync');
const usertools = require('./usertools');

module.exports = {
    async getCompleteGroup(groupid, sessionid) {
        let group=await SimvaAsync.getGroup(groupid, sessionid);
        try {
            group.completeParticipants=await SimvaAsync.getGroupParticipants(groupid, sessionid);
        } catch(e) {
           logger.warn(e);
        }
        return group;
    },

    async generateStudentUser(params, sessionid) {
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
        user = await SimvaAsync.registerGeneratedUser(params.groupid, username, sessionid);
        return user;
    },

    async generateStudentUserWithRetry(params, sessionid, maxRetries, retryCount = 0) {
        try {
            const student = await this.generateStudentUser(params, sessionid);
            return student;
        } catch (e) {
            if (retryCount < maxRetries) {
                logger.debug(`Retry ${retryCount + 1}: failed to generate user →`, e);
                return this.generateStudentUserWithRetry(params, sessionid, maxRetries, retryCount + 1);
            } else {
                throw new Error(`Failed after ${maxRetries} retries: ${e.message}`);
            }
        }
    }
}