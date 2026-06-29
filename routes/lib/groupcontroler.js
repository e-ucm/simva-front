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

    async exportGroups(simlet_id, group_ids, sessionid) {
        const groups = [];
        for (const group_id of group_ids) {
            try {
                const group = await this.exportGroup(simlet_id, group_id, true, sessionid);
                if(!Boolean(group.group_sandbox)) {
                    groups.push(group);
                }
            } catch (e) {
                logger.warn(e);
            }
        }
        return groups;
    },

    async exportGroup(simlet_id, group_id, complete, sessionid) {
        let group = await SimvaAsync.getGroup(simlet_id, group_id, sessionid);
        group.participants = await SimvaAsync.getGroupParticipants(simlet_id, group_id, sessionid);
        if(complete) {
            try {
                group.direct_permissions = [];
            } catch(e) {
                logger.warn(e);
            } 
        }
        return group;
    },

    async importGroups(simlet_id, groupsData, sessionid) {
        for (const groupData of groupsData) {
            try {
                await this.importGroup(simlet_id, groupData, sessionid);
            } catch (e) {
                logger.warn(e);
            }
        }
    },

    async importGroup(simlet_id, groupData, sessionid) {
        let group = await SimvaAsync.addGroup(simlet_id, { group_name: groupData.group_name, group_use_new_generation: true, group_sandbox: false }, sessionid);
        if (groupData.participants && Array.isArray(groupData.participants)) {
            for (const participant of groupData.participants) {
                    if(Boolean(participant.isToken)) {
                        try {
                            let user = await SimvaAsync.registerGeneratedUser(simlet_id, group.group_id, participant.token, sessionid);
                            await SimvaAsync.addGroupParticipant(simlet_id, group.group_id, user.user_id, sessionid);
                        } catch (e) {
                            logger.warn(e);
                        }
                    } else {
                        try {
                            let user = await SimvaAsync.getUser(participant.username, sessionid);
                            if(user.username) {
                                await SimvaAsync.addGroupParticipant(simlet_id, group.group_id, user.user_id, sessionid);
                            } else {
                                logger.warn(`User ${participant.username} not found for group ${group.group_name}`);
                            }
                        } catch (e) {
                            logger.warn(e);
                        }
                    }
            }
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
    },

    async setTesterGroup(studyid, testid, userId, username, sessionid) {
        // 1. Find or create sandbox group for user
       let groups = await SimvaAsync.getSimletGroups(studyid, {}, sessionid);
       const groupName = `tester_${studyid}_${userId}_${username}`;
       let myGroup = groups.find(g => g.group_sandbox === true && g.group_name === groupName);
       if (!myGroup) {
           myGroup = await SimvaAsync.addGroup(studyid, { group_name: groupName, group_use_new_generation: false, group_sandbox: true }, sessionid);
       }
       // 2. Add user as participant if not already
       let participants = await SimvaAsync.getGroupParticipants(studyid, myGroup.group_id, sessionid);
       let alreadyParticipant = participants.some(p => p.user_id === userId);
       if (!alreadyParticipant) {
           await SimvaAsync.addGroupParticipant(studyid, myGroup.group_id, userId, sessionid);
       }
       // 3. Allocate/move user to selected session
       await SimvaAsync.allocateToSession(studyid, myGroup.group_id, testid, {}, sessionid);
       return myGroup;
    },

    async unsetTesterGroup(studyid, testid, userId, username, sessionid) {
        // Find sandbox group for user
        let groups = await SimvaAsync.getSimletGroups(studyid, {}, sessionid);
        const groupName = `tester_${studyid}_${userId}_${username}`;
        let myGroup = groups.find(g => g.group_sandbox === true && g.group_name === groupName);
        if (!myGroup) {
            throw new Error('Tester group not found');
        }
        // Remove from group
        await SimvaAsync.deleteGroupParticipant(studyid, myGroup.group_id, userId, false, sessionid);
        // Delete group if sandbox
        await SimvaAsync.deleteGroup(studyid, myGroup.group_id, sessionid);
        return;
    },

    async resetTesterGroup(studyid, testid, userId, username, sessionid) {
        await this.unsetTesterGroup(studyid, testid, userId, username, sessionid);
        return await this.setTesterGroup(studyid, testid, userId, username, sessionid);
    }
}