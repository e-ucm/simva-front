const logger = require('../../logger');
const SimvaAsync  = require('./simvaAsync');

module.exports = {
    getActivities(studyid, testid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getTestActivities(studyid, testid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    async getCompleteActivity(studyid, testid, activityid, sessionid) {
        let act=await this.getActivity(activityid, sessionid);
        act.data = {};
        try {
            act.data.completion=await SimvaAsync.getActivityCompletion(activityid, sessionid);
        } catch(e) {
            logger.warning(e);
        }
        try {
            act.data.progress=await SimvaAsync.getActivityProgress(activityid, sessionid);
        } catch(e) {
            logger.warning(e);
        }
        try {
            act.data.openable=(await SimvaAsync.isActivityOpenable(activityid, sessionid)).openable;
        } catch(e) {
            logger.warning(e);
        }
        if(act.data.openable) {
            try {
                act.data.target=await SimvaAsync.getActivityTarget(activityid, sessionid);
            } catch(e) {
                logger.warning(e);
            }
        }
        if(act.type == "limesurvey") {
            try {
                act.data.result=await SimvaAsync.getActivityResult(activityid, sessionid);
            } catch(e) {
                logger.warning(e);
            }
            try {
                act.data.languages=await SimvaAsync.getSurveyLanguages(activityid, sessionid);
            } catch(e) {
                logger.warning(e);
            } 
        } else {
            try {
                act.data.hasresult=await SimvaAsync.hasActivityResult(activityid, sessionid);
            } catch(e) {
                logger.warning(e);
            }
        }
        return act;
    },

    async exportCompleteActivity(studyid, testid, activityid, complete, sessionid) {
        let act=await SimvaAsync.exportActivity(activityid, complete, sessionid);
        return act;
    },

    async importActivity(studyid, testid, activity, sessionid) {
        let act=await SimvaAsync.addActivityToTest(studyid, testid, activity, sessionid);
        return act;
    },
}