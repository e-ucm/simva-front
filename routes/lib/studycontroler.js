const logger = require('../../logger');
const SimvaAsync = require('./simvaAsync');
const testcontroler = require('./testscontroler');
const groupcontroler = require('./groupcontroler');

module.exports = {
    async getCompleteStudy(studyid, sessionid) {
        let study=await SimvaAsync.getStudy(studyid, sessionid);
        try {
            study.participants = await SimvaAsync.getStudyParticipants(studyid, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        try {
            study.allgroups = await SimvaAsync.getGroups(sessionid);
        } catch(e) {
            logger.warn(e);
        }
        try {
            study.completeGroups = await SimvaAsync.getStudyGroups(studyid, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        try {
            study.completeAllocator = await SimvaAsync.getAllocator(studyid, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        try {
            study.direct_permissions = (await SimvaAsync.getStudyDirectPermissions(studyid, sessionid)).permissions;
        } catch(e) {
            logger.warn(e);
        }
        study.completeTests=[];
        logger.info({study}, "Study data before fetching complete tests");
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