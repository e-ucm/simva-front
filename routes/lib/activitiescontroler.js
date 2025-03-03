const logger = require('../../logger');
const Simva  = require('./simva');

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
        act.data.completion=await this.getActivityCompletion(activityid, sessionid);
        act.data.progress=await this.getActivityProgress(activityid, sessionid);
        act.data.openable=await this.isActivityOpenable(activityid, sessionid);
        if(act.data.openable) {
            act.data.target=await this.getActivityTarget(activityid, sessionid);
        }
        if(act.type == "limesurvey") {
            act.data.result=await this.getActivityResult(activityid, sessionid);
            act.data.languages=await this.getSurveyLanguages(activityid, sessionid);
        } else {
            act.data.hasresult=await this.hasActivityResult(activityid, sessionid);
        }
        return act;
    },

    async exportCompleteActivity(studyid, testid, activityid, complete, sessionid) {
        let act=await this.exportActivity(activityid, complete, sessionid);
        return act;
    },

    async importActivity(studyid, testid, activity, sessionid) {
        let act=await this.addActivityToTest(studyid, testid, activity, sessionid);
        return act;
    },

    exportActivity(activityid, complete, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.exportActivity(activityid, complete, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    addActivityToTest(studyid, testid, activity, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.addActivityToTest(studyid, testid, activity, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getActivity(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getActivity(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getSurveyLanguages(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getSurveyLanguages(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getActivityCompletion(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getActivityCompletion(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    hasActivityResult(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.hasActivityResult(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getActivityResult(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getActivityResult(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getActivityProgress(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getActivityProgress(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    getActivityTarget(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getActivityTarget(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    isActivityOpenable(activityid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.isActivityOpenable(activityid, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result.openable);
                }
            });
        });
    },
}