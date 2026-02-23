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
        let act=await SimvaAsync.getActivity(activityid, sessionid);
        act.data = {};
        try {
            act.data.completion=await SimvaAsync.getActivityCompletion(activityid, sessionid);
        } catch(e) {
            logger.warn(e);
            throw e;
        }
        try {
            act.data.progress=await SimvaAsync.getActivityProgress(activityid, sessionid);
        } catch(e) {
            logger.warn(e);
            throw e;
        }
        try {
            act.data.init=await SimvaAsync.getActivityInitialized(activityid, sessionid);
        } catch(e) {
            logger.warn(e);
        }
        try {
            act.data.openable=Boolean((await SimvaAsync.isActivityOpenable(activityid, sessionid)).openable);
        } catch(e) {
            logger.warn(e);
            throw e;
        }
        if(act.data.openable) {
            try {
                act.data.target=await SimvaAsync.getActivityTarget(activityid, sessionid);
            } catch(e) {
                logger.warn(e);
            }
        }
        if(act.type == "limesurvey") {
            try {
                act.data.result=await SimvaAsync.getActivityResult(activityid, sessionid);
            } catch(e) {
                logger.warn(e);
            }
            try {
                act.data.languages=await SimvaAsync.getSurveyLanguages(activityid, sessionid);
            } catch(e) {
                logger.warn(e);
            } 
        } else {
            try {
                act.data.hasresult=await SimvaAsync.hasActivityResult(activityid, sessionid);
            } catch(e) {
                logger.warn(e);
            }
        }
        //try {
        //    var activityCompletionTask={
		//    	task: 'getCompletion',
		//    	params: '',
		//    	object: 'Activity',
		//    	objectEvent: 'true',
		//    	objectLoad: 'true',
		//    	objectId: activityid
		//    };
		//    SimvaAsync.addToTaskList(activityCompletionTask, sessionid);
        //} catch(e) {
        //    logger.warn(e);
        //}
        //try {
		//    var activityProgressTask={
		//    	task: 'getProgress',
		//    	params: '',
		//    	object: 'Activity',
		//    	objectEvent: 'true',
		//    	objectLoad: 'true',
		//    	objectId: activityid
		//    };
		//    SimvaAsync.addToTaskList(activityProgressTask, sessionid);
        //} catch(e) {
        //    logger.warn(e);
        //}
        //try {
		//    var activityCanBeOpenedTask={
		//    	task: 'canBeOpened',
		//    	params: '',
		//    	object: 'Activity',
		//    	objectEvent: 'true',
		//    	objectLoad: 'true',
		//    	objectId: activityid
		//    };
		//    SimvaAsync.addToTaskList(activityCanBeOpenedTask, sessionid);
        //} catch(e) {
        //    logger.warn(e);
        //}
        //try {
		//    var activityTargetTask={
		//    	task: 'target',
		//    	params: '',
		//    	object: 'Activity',
		//    	objectEvent: 'true',
		//    	objectLoad: 'true',
		//    	objectId: activityid
		//    };
		//    SimvaAsync.addToTaskList(activityTargetTask, sessionid);
        //} catch(e) {
        //    logger.warn(e);
        //}
        //if(act.type == "limesurvey") {
        //    try {
        //        var activityResultTask={
        //            task: 'getResults',
        //            params: '',
        //            object: 'Activity',
        //            objectEvent: 'true',
        //            objectLoad: 'true',
        //            objectId: activityid
        //        };
        //        SimvaAsync.addToTaskList(activityResultTask, sessionid);
        //    } catch(e) {
        //        logger.warn(e);
        //    }
        //    try {
        //        var activitySurveyLanguagesTask={
        //            task: 'getSurveyLanguages',
        //            params: '',
        //            object: 'Activity',
        //            objectEvent: 'true',
        //            objectLoad: 'true',
        //            objectId: activityid
        //        };
        //        SimvaAsync.addToTaskList(activitySurveyLanguagesTask, sessionid);
        //    } catch(e) {
        //        logger.warn(e);
        //    }
        //} else {
        //    try {
        //        var activityResultTask={
        //            task: 'hasResults',
        //            params: '',
        //            object: 'Activity',
        //            objectEvent: 'true',
        //            objectLoad: 'true',
        //            objectId: activityid
        //        };
        //        SimvaAsync.addToTaskList(activityResultTask, sessionid);
        //    } catch(e) {
        //        logger.warn(e);
        //    }
        //}
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