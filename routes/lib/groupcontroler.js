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
        try {
            const groupTask={
                task: 'toObject',
                params: '',
                object: 'Group',
                objectLoad: 'true',
                objectEvent: 'true',
                objectId: groupid
            };
            SimvaAsync.addToTaskList(groupTask,sessionid);
        } catch(e) {
            logger.warn(e);
        }
        try {
			const participantTask={
				task: 'getParticipants',
				params: '',
				object: 'Group',
				objectLoad: 'true',
				objectEvent: 'true',
				objectId: groupid
			};
			SimvaAsync.addToTaskList(participantTask, sessionid);
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
        let password = username;
        let email = `${username}@example.com`
        if(params.useNewGeneration) {
            email=`${params.groupid}.${email}`;
        }
        let user;
        if(params.checkIfExists) {
            user = await SimvaAsync.getUser(username, sessionid);
            if(user.username) {
                return user;
            }
        } 
        user = await SimvaAsync.register(params.groupid, username, email, password, 'student', true, params.useNewGeneration, sessionid);
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