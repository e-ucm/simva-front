const logger = require('../../logger');
const Simva  = require('./simva');
const testcontroler = require('./testscontroler');
const groupcontroler = require('./groupcontroler');

module.exports = {
    async getCompleteStudy(studyid, sessionid) {
        let study=await this.getStudy(studyid, sessionid);
        study.participants = await this.getStudyParticipants(studyid, sessionid);
        study.allgroups = await groupcontroler.getGroups(sessionid);
        study.completeGroups = await this.getStudyGroups(studyid, sessionid);
        study.completeAllocator = await this.getStudyAllocator(studyid, sessionid);
        study.completeTests=[];
        for(let i=0;i<study.tests.length;i++) {
            study.completeTests.push(await testcontroler.getCompleteTest(studyid, study.tests[i], sessionid));
        }
        return study;
    },

    async exportStudy(studyid, complete, sessionid) {
        let study=await this.getStudy(studyid, sessionid);
        study.allocator = await this.getStudyAllocator(studyid, sessionid);
        let testsid = study.tests;
        study.tests=[];
        for(let i=0;i<testsid.length;i++) {
            study.tests.push(await testcontroler.exportTest(studyid, testsid[i], complete, sessionid));
        }
        return study;
    },

    async importStudy(newstudy, sessionid) {
        let study=await this.addStudy(newstudy.name, sessionid);
        for(let i=0;i<newstudy.tests.length;i++) {
            await testcontroler.importTest(study._id, newstudy.tests[i], sessionid);
        }
        return study;
    },
    
    
    getStudies(sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getStudies(sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },

    refreshStudy(study, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.updateStudy(study, sessionid, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    },


    addStudy(studyname, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.addStudy(studyname, sessionid, (error, study) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(study);
                }
            });
        });
    },

    getStudy(studyid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getStudy(studyid, sessionid, (error, study) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(study);
                }
            });
        });
    },

    getStudyParticipants(studyid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getStudyParticipants(studyid, sessionid, (error, participants) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(participants);
                }
            });
        });
    },

    getStudyGroups(studyid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getStudyGroups(studyid, sessionid, (error, groups) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(groups);
                }
            });
        });
    },

    getStudyAllocator(studyid, sessionid) {
        return new Promise((resolve, reject) => {
            Simva.getAllocator(studyid, sessionid, (error, allocator) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(allocator);
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
}