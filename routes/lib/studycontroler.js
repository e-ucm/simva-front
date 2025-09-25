const logger = require('../../logger');
const SimvaAsync = require('./simvaAsync');
const testcontroler = require('./testscontroler');
const groupcontroler = require('./groupcontroler');

module.exports = {
    async getCompleteStudy(studyid, sessionid) {
        let study=await SimvaAsync.getStudy(studyid, sessionid);
        study.participants = await SimvaAsync.getStudyParticipants(studyid, sessionid);
        study.allgroups = await SimvaAsync.getGroups(sessionid);
        study.completeGroups = await SimvaAsync.getStudyGroups(studyid, sessionid);
        study.completeAllocator = await SimvaAsync.getStudyAllocator(studyid, sessionid);
        study.completeTests=[];
        for(let i=0;i<study.tests.length;i++) {
            study.completeTests.push(await testcontroler.getCompleteTest(studyid, study.tests[i], sessionid));
        }
        return study;
    },

    async exportStudy(studyid, complete, sessionid) {
        let study=await SimvaAsync.getStudy(studyid, sessionid);
        study.allocator = await SimvaAsync.getStudyAllocator(studyid, sessionid);
        let testsid = study.tests;
        study.tests=[];
        for(let i=0;i<testsid.length;i++) {
            study.tests.push(await testcontroler.exportTest(studyid, testsid[i], complete, sessionid));
        }
        return study;
    },

    async importStudy(newstudy, sessionid) {
        let study=await SimvaAsync.addStudy(newstudy.name, sessionid);
        for(let i=0;i<newstudy.tests.length;i++) {
            await testcontroler.importTest(study._id, newstudy.tests[i], sessionid);
        }
        return study;
    }
}