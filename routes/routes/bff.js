module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();
    const logger = require('../../logger');
    const Simva = require('../lib/simva');
    const studycontroler = require('../lib/studycontroler');
    const groupcontroler = require('../lib/groupcontroler');
    const testscontroler = require('../lib/testscontroler');
    const axios = require('axios');

    /**
    * USERS
    * 
    */
    router.post('/shlink', auth, async (req, res, next) => {
        Simva.generateURL(req.body.url, req.body.tag, req.body.title, req.body.customSlug, req.body.length, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/shlink/:shortcode', auth, async (req, res, next) => {
        Simva.deleteShLink(req.params["shortcode"], (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send({ message : "Short Link deleted" });
            }
        });
    });
    
    /**
    * USERS
    * 
    */
    router.post('/users', auth, async (req, res, next) => {
        Simva.register(req.body.groupid, req.body.username, req.body.email, req.body.password, req.body.role, req.body.isToken, req.body.useNewGeneration, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/users/:username', auth, async (req, res, next) => {
        Simva.setRole(req.body.username, req.body.role, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });
  
    router.get('/users/me', auth, async (req, res, next) => {
        Simva.getCurrentUser(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
      
    router.get('/users/islimesurveyadmin', auth, async (req, res, next) => {
        Simva.islimesurveyadmin(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    /**
    * GROUPS
    * 
    */
    router.get('/groups', auth, async (req, res, next) => {
        Simva.getGroups(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/groups', auth, async (req, res, next) => {
        Simva.addGroup(req.body.name, req.body.version, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.put('/groups/:groupid', auth, async (req, res, next) => {
        Simva.updateGroup(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/groups/:groupid', auth, async (req, res, next) => {
        let groupid = req.params['groupid'];
        let sessionid = req.session.id;
        try {
            let group = await groupcontroler.getCompleteGroup(groupid, sessionid);
            res.status(200).send(group);
        } catch(error) {
            next(error.response.data);
        }
    });

    router.delete('/groups/:groupid', auth, async (req, res, next) => {
        Simva.deleteGroup(req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * GROUP PARTICIPANTS
    * 
    */
    router.get('/groups/:groupid/participants', auth, async (req, res, next) => {
        Simva.getGroupParticipants(req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * STUDIES
    * 
    */
    router.get('/studies', auth, async (req, res, next) => {
        Simva.getStudies(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/studies', auth, async (req, res, next) => {
        Simva.addStudy(req.body.name, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid', auth, async (req, res, next) => {
        let studyId = req.params['studyid'];
        let sessionid = req.session.id;
        try {
            let study = await studycontroler.getCompleteStudy(studyId, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error.response.data);
        }
    });
                                
    router.put('/studies/:studyid', auth, async (req, res, next) => {
        Simva.updateStudy(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/studies/:studyid', auth, async (req, res, next) => {
        Simva.deleteStudy(req.params['studyid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * TESTS
    * 
    */
    router.post('/studies/:studyid/tests', auth, async (req, res, next) => {
        if(req.body.from) {
            try {
                let testToDuplicate=await testscontroler.exportTest(req.params["studyid"], req.body.from, false, req.session.id);
                testToDuplicate.name = req.body.name;
                let newTest=await testscontroler.importTest(req.params["studyid"], testToDuplicate, req.session.id);
                res.status(200).send(newTest);
            } catch {
                next(error.response.data);
            }
        } else {
            Simva.addTestToStudy(req.params["studyid"], req.body.name, req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    router.patch('/studies/:studyid/tests/:testid', auth, async (req, res, next) => {
        Simva.updateTest(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

   
    router.patch('/activities/:activityid', auth, async (req, res, next) => {
        Simva.updateActivity(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/studies/:studyid', auth, async (req, res, next) => {
        Simva.deleteStudy(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * ALLOCATORS
    * 
    */
    router.get('/studies/:studyid/allocator', auth, async (req, res, next) => {
        Simva.getAllocator(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.put('/studies/:studyid/allocator', auth, async (req, res, next) => {
        Simva.updateAllocator(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * TESTS
    * 
    */
    router.get('/studies/:studyid/tests', auth, async (req, res, next) => {
        Simva.getStudyTests(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/export', auth, async (req, res, next) => {
        let studyId = req.params['studyid'];
        let sessionid = req.session.id;
        try {
            let study = await studycontroler.exportStudy(studyId, true, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error.response.data);
        }
    });

    router.post('/studies/import', auth, async (req, res, next) => {
        let newstudy = JSON.parse(atob(req.body.file));
        let sessionid = req.session.id;
        try {
            let study = await studycontroler.importStudy(newstudy, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error.response.data);
        }
    });

    router.get('/studies/:studyid/tests/:testid', auth, async (req, res, next) => {
        Simva.getStudyTest(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/groups', auth, async (req, res, next) => {
        Simva.getStudyGroups(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/tests/:testid/activities', auth, async (req, res, next) => {
        Simva.getTestActivities(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/participants', auth, async (req, res, next) => {
        Simva.getStudyParticipants(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/schedule', auth, async (req, res, next) => {
        Simva.getStudySchedule(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * ACTIVITIES
    * 
    */
    router.post('/studies/:studyid/tests/:testid/activities', auth, async (req, res, next) => {
        Simva.addActivityToTest(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid', auth, async (req, res, next) => {
        Simva.getActivity(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/activities/:activityid/surveyowner', auth, async (req, res, next) => {
        Simva.setSurveyOwner(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/usersurveylist', auth, async (req, res, next) => {
        Simva.getSurveyList(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/progress', auth, async (req, res, next) => {
        Simva.getActivityProgress(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/completion', auth, async (req, res, next) => {
        Simva.getActivityCompletion(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/completion', auth, async (req, res, next) => {
        Simva.setActivityCompletion(req.params["activityid"], req.query.user, req.body.status, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/result', auth, async (req, res, next) => {
        if(req.query.type) {
            if(req.query.users) {
                Simva.getActivityResultWithTypeForUser(req.params["activityid"], req.query.type, req.query.users, req.session.id, (error, result) => {
                    if(error) {
                        next(error.response.data);
                    } else {
                        res.status(200).send(result);
                    }
                });
            } else {
                Simva.getActivityResultWithType(req.params["activityid"], req.query.type, req.session.id, (error, result) => {
                    if(error) {
                        next(error.response.data);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        } else {
            if(req.query.users) {
                Simva.getActivityResultForUser(req.params["activityid"], req.query.users, req.session.id, (error, result) => {
                    if(error) {
                        next(error.response.data);
                    } else {
                        res.status(200).send(result);
                    }
                });
            } else {
                Simva.getActivityResult(req.params["activityid"], req.session.id, (error, result) => {
                    if(error) {
                        next(error.response.data);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        }
        
    });

    router.get('/activities/:activityid/hasresult', auth, async (req, res, next) => {
        Simva.getActivityHasResult(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/target', auth, async (req, res, next) => {
        Simva.getActivityTarget(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/openable', auth, async (req, res, next) => {
        Simva.isActivityOpenable(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/presignedurl', auth, async (req, res, next) => {
        Simva.getMinioDataUrl(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                let url = result.url;
                logger.info(url);
                // Fetch the file from the pre-signed URL
                axios.get(url, { responseType: 'arraybuffer' }) // Use 'arraybuffer' for binary data
                    .then(response => {
                        // Modify the file content. This example assumes it's a text file.
                        // For binary files, you might need to handle it differently.
                        let fileContent = Buffer.from(response.data, 'binary').toString(); // Assuming text file
                        let result={};
                        if(req.query.as_array) {
                            let array=fileContent.split('\n');
                            if (array[array.length - 1].trim() === '') {
                               array.pop();
                            }
                            array = array.map(line => JSON.parse(line));
                            result.data=JSON.stringify(array, null, 2);
                        } else {
                            result.data=fileContent;
                        }
                        res.status(200).send(result);
                    })
                    .catch(fetchError => {
                        next(fetchError.response.data);
                    });
            }
        });
    });

    router.delete('/activities/:activityid', auth, async (req, res, next) => {
        Simva.deleteActivity(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activitytypes', auth, async (req, res, next) => {
        Simva.getActivityTypes(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/allocatortypes', auth, async (req, res, next) => {
        Simva.getAllocatorTypes(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * LTI
    * 
    */
    router.get('/lti/tools', auth, async (req, res, next) => {
        Simva.getLtiTools(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/lti/tools', auth, async (req, res, next) => {
        Simva.addLtiTool(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/lti/tools/:toolid', auth, async (req, res, next) => {
        Simva.deleteLtiTool(req.params["toolid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/lti/platforms', auth, async (req, res, next) => {
        let studyid = null;
        if(req.query.searchString) {
            studyid = JSON.parse(req.query.searchString).studyId;
        }
        Simva.getLtiPlatforms(studyid, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/lti/platforms', auth, async (req, res, next) => {
        Simva.addLtiPlatform(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/lti/platforms/:platformid', auth, async (req, res, next) => {
        Simva.removePlatform(req.params["platformid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    return router;
  }