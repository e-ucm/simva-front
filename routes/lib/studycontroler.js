const logger = require('../../logger');
const SimvaAsync = require('./simvaAsync');
const testcontroler = require('./testscontroler');

module.exports = {
    async getCompleteStudy(studyid, sessionid) {
        let study=await SimvaAsync.getStudy(studyid, sessionid);
        study.completeTests=[];
        logger.info({study}, "Study data before fetching complete tests");
        try {
            study.allgroups = await SimvaAsync.getGroups(sessionid);
            study.completeGroups = await SimvaAsync.getStudyGroups(studyid, sessionid);
            study.direct_permissions = await SimvaAsync.getStudyDirectPermissions(studyid, sessionid);
            study.participants = await SimvaAsync.getStudyParticipants(studyid, sessionid);
        } catch(e) {
            logger.warn(e);
        }

        // Fallback for setups where allocator-based participant endpoints are empty.
        // In that case, build the participant list from the members of study groups.
        if (!Array.isArray(study.participants) || study.participants.length === 0) {
            const mergedParticipants = new Map();
            const groups = Array.isArray(study.completeGroups) ? study.completeGroups : [];

            for (const group of groups) {
                try {
                    const groupParticipants = await SimvaAsync.getGroupParticipants(studyid, group.group_id, sessionid);
                    if (Array.isArray(groupParticipants)) {
                        for (const participant of groupParticipants) {
                            if (participant && participant.user_id !== undefined && participant.user_id !== null) {
                                mergedParticipants.set(participant.user_id, participant);
                            }
                        }
                    }
                } catch (e) {
                    logger.warn(e);
                }
            }

            study.participants = Array.from(mergedParticipants.values());
        }
        for(let i=0;i<study.sessions.length;i++) {
            try {
                let test=await testcontroler.getCompleteTest(studyid, study.sessions[i], sessionid);
                study.completeTests.push(test);
            } catch(e) {
                logger.warn(e);
                throw e;
            }
        }

        return study;
    },

    async exportStudy(studyid, complete, sessionid) {
        let study=await SimvaAsync.getStudy(studyid, sessionid);
        try {
            study.allocator = await SimvaAsync.getAllocator(studyid, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        let testsid = study.tests;
        study.tests=[];
        for(let i=0;i<testsid.length;i++) {
            try {
                study.tests.push(await testcontroler.exportTest(studyid, testsid[i], complete, sessionid));
            } catch(e) {
                logger.warn(e);
            }
        }
        return study;
    },

    async importStudy(newstudy, sessionid) {
        let study=await SimvaAsync.addStudy(newstudy.name, sessionid);
        for(let i=0;i<newstudy.tests.length;i++) {
            try {
                await testcontroler.importTest(study.simlet_id, newstudy.tests[i], sessionid);
            } catch(e) {
                logger.warn(e);
            }
        }
        return study;
    },
}