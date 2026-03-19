const logger = require('../../logger');
const SimvaAsync  = require('./simvaAsync');
const activitiescontroler = require('./activitiescontroler');
const groupcontroler = require('./groupcontroler');

module.exports = {
    async getCompleteTest(studyid, testid, sessionid) {
        let test=await SimvaAsync.getStudyTest(studyid, testid, sessionid);
        test.completeActivities = [];
        for(let i=0;i<test.activities.length;i++) {
            try {
                test.completeActivities.push(await activitiescontroler.getCompleteActivity(studyid, testid, test.activities[i], sessionid));
            } catch(e) {
               logger.warn(e);
            }
        }
        try {
            test.completeParticipants = await SimvaAsync.getSessionParticipants(studyid, testid, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        return test;
    },

    async exportTest(studyid, testid, complete, sessionid) {
        let test=await SimvaAsync.getStudyTest(studyid, testid, sessionid);
        let activitiesid = test.activities;
        test.activities = [];
        for(let i=0;i<activitiesid.length;i++) {
            try {
                test.activities.push(await activitiescontroler.exportCompleteActivity(studyid, testid,activitiesid[i], complete, sessionid));
            } catch(e) {
                logger.warn(e);
            }
        }
        return test;
    },

    async importTest(studyid, newtest, sessionid) {
        let test=await SimvaAsync.addTestToStudy(studyid, newtest.name, sessionid);
        test.activities = [];
        for(let i=0;i<newtest.activities.length;i++) {
            try {
                let act=await activitiescontroler.importActivity(studyid, test.session_id, newtest.activities[i], sessionid);
                test.activities.push(act.activity_id);
            } catch(e) {
                logger.warn(e);
            }
        }
        return test;
    }
}