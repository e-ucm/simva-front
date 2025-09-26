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
        study.completeTests=[];
        for(let i=0;i<study.tests.length;i++) {
            try {
                study.completeTests.push(await testcontroler.getCompleteTest(studyid, study.tests[i], sessionid));
            } catch(e) {
                logger.warn(e);
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
                await testcontroler.importTest(study._id, newstudy.tests[i], sessionid);
            } catch(e) {
                logger.warn(e);
            }
        }
        return study;
    },

    async addSandboxToTest(studyId, testId, useNewGeneration, sessionid) {
        logger.info(`Sandbox: ${studyId}.${testId}`);
        let study = await SimvaAsync.getStudy(studyId, sessionid);
        let test = await SimvaAsync.getStudyTest(studyId, testId, sessionid);
        let studyGroups = await SimvaAsync.getStudyGroups(studyId, sessionid);
        let sandboxGroup=`sandbox_${studyId}`;
        logger.info(sandboxGroup);
        let studyGroup = studyGroups.find(g => g.name === sandboxGroup);
        let params = {
            username : 'sandbox',
            groupid: studyGroup._id,
            useNewGeneration : useNewGeneration,
            checkIfExists : true
        }
        if (!studyGroup) {
            studyGroup = await SimvaAsync.addGroup(sandboxGroup, useNewGeneration, sessionid);
            logger.info(studyGroup);
            let student = await groupcontroler.generateStudentUser(params, sessionid);
            studyGroup.participants.push(student.username);
            studyGroup.sandbox=true;
            await SimvaAsync.updateGroup(studyGroup, sessionid);
            study.groups.push(studyGroup._id);
            study.sandboxGroup=studyGroup._id;
        }
        study.sandbox=testId;
        await SimvaAsync.updateStudy(study, sessionid);
        let allocator = await SimvaAsync.getAllocator(studyId, sessionid);
        if(!allocator.extra_data) {
            allocator.extra_data={};
        }
        if(!allocator.extra_data.allocations) {
            allocator.extra_data.allocations={};
        }
        if(allocator.type == "default") {
            if(useNewGeneration) {
                allocator.extra_data.allocations[`${params.groupid}_${params.username}`]=testId;
            } else {
                allocator.extra_data.allocations[`${params.username}`]=testId;
            }
        } else {
            allocator.extra_data.allocations[`${params.groupid}`]=testId;
        }
        logger.info(allocator);
        await SimvaAsync.updateAllocator(studyId, allocator, sessionid);
        return studyGroup;
    }
}