const logger = require('../../logger');
const Simva  = require('./simva');
const activitiescontroler = require('./activitiescontroler');
module.exports = {
    async getCompleteTest(studyid, testid, sessionid) {
        let test=await this.getStudyTest(studyid, testid, sessionid);
        test.completeActivities = [];
        for(let i=0;i<test.activities.length;i++) {
            test.completeActivities.push(await activitiescontroler.getCompleteActivity(studyid, testid, test.activities[i], sessionid));
        }
        return test;
    },

    async exportTest(studyid, testid, complete, sessionid) {
        let test=await this.getStudyTest(studyid, testid, sessionid);
        let activitiesid = test.activities;
        test.activities = [];
        for(let i=0;i<activitiesid.length;i++) {
            test.activities.push(await activitiescontroler.exportCompleteActivity(studyid, testid,activitiesid[i], complete, sessionid));
        }
        return test;
    },

    async importTest(studyid, newtest, sessionid) {
        let test=await this.addTestToStudy(studyid, newtest.name, sessionid);
        test.activities = [];
        for(let i=0;i<newtest.activities.length;i++) {
            let act=await activitiescontroler.importActivity(studyid, test._id, newtest.activities[i], sessionid);
            test.activities.push(act._id);
        }
        return test;
    },

    addTestToStudy(studyid, testname, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.addTestToStudy(studyid, testname, sessionid, (error, test) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(test);
                }
            });
        });
    },

    getStudyTests(studyid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getStudyTests(studyid, sessionid, (error, tests) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(tests);
                }
            });
        });
    },

    getStudyTest(studyid, testid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getStudyTest(studyid, testid, sessionid, (error, test) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(test);
                }
            });
        });
    },
}