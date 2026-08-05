const logger = require('../../logger');
const groupcontroler = require('./groupcontroler');
const SimvaAsync = require('./simvaAsync');
const testcontroler = require('./testscontroler');

module.exports = {
    async exportStudy(studyid, complete, sessionid) {
        let study=await SimvaAsync.getSimlet(studyid, sessionid);
        let testsid = study.sessions;
        study.sessions=[];
        for(let i=0;i<testsid.length;i++) {
            try {
                study.sessions.push(await testcontroler.exportSession(studyid, testsid[i], complete, sessionid));
            } catch(e) {
                logger.warn(e);
            }
        }
        let groupsid = study.groups;
        study.groups=await groupcontroler.exportGroups(studyid, groupsid, sessionid);
        return study;
    },

    async importStudy(newstudy, sessionid) {
        let study=await SimvaAsync.addSimlet({simlet_name: newstudy.simlet_name, simlet_description: newstudy.simlet_description}, sessionid);
        for(let i=0;i<newstudy.sessions.length;i++) {
            try {
                await testcontroler.importTest(study.simlet_id, newstudy.sessions[i], sessionid);
            } catch(e) {
                logger.warn(e);
            }
        }
        try {
            await groupcontroler.importGroups(study.simlet_id, newstudy.groups, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        return study;
    }
}