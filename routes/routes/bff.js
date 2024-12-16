module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();
    const logger = require('../../logger');
    const Simva = require('../lib/simva');
    
    /**
    * USERS
    * 
    */
    router.post('/shlink', async (req, res, next) => {
        Simva.generateURL(req.body.url, req.body.tag, req.body.title, req.body.customSlug, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    /**
    * USERS
    * 
    */
    router.post('/users', async (req, res, next) => {
        Simva.register(req.body.groupid, req.body.username, req.body.email, req.body.password, req.body.role, req.body.isToken, req.body.useNewGeneration, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/users/:username', async (req, res, next) => {
        Simva.setRole(req.body.username, req.body.role, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });
  
    router.get('/users/me', async (req, res, next) => {
        Simva.getCurrentUser(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    /**
    * GROUPS
    * 
    */
    router.get('/groups', async (req, res, next) => {
        Simva.getGroups(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/groups', async (req, res, next) => {
        Simva.addGroup(req.body.name, req.body.newversion, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.put('/groups/:groupid', async (req, res, next) => {
        Simva.updateGroup(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/groups/:groupid', async (req, res, next) => {
        Simva.getGroup(req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/groups/:groupid', async (req, res, next) => {
        Simva.deleteGroup(req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * GROUP PARTICIPANTS
    * 
    */
    router.get('/groups/:groupid/participants', async (req, res, next) => {
        Simva.getGroupParticipants(req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * STUDIES
    * 
    */
    router.get('/studies', async (req, res, next) => {
        Simva.getStudies(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/studies', async (req, res, next) => {
        Simva.addStudy(req.body.name, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid', async (req, res, next) => {
        Simva.getStudy(req.params['studyid'], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.put('/studies/:studyid', async (req, res, next) => {
        Simva.updateStudy(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * TESTS
    * 
    */
    router.post('/studies/:studyid/tests', async (req, res, next) => {
        if(req.body.from) {
            Simva.duplicateTestFromStudy(req.params["studyid"], req.body.name, req.body.from, req.session.id, (error, result) => {
                if(error) {
                    next(error);
                } else {
                    res.status(200).send(result);
                }
            });
        } else {
            Simva.addTestToStudy(req.params["studyid"], req.body.name, req.session.id, (error, result) => {
                if(error) {
                    next(error);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    router.patch('/studies/:studyid/test/:testid', async (req, res, next) => {
        Simva.updateTest(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

   
    router.patch('/activities/:activityid', async (req, res, next) => {
        Simva.updateActivity(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/studies/:studyid', async (req, res, next) => {
        Simva.deleteStudy(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * ALLOCATORS
    * 
    */
    router.get('/studies/:studyid/allocator', async (req, res, next) => {
        Simva.getAllocator(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.put('/studies/:studyid/allocator', async (req, res, next) => {
        Simva.updateAllocator(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * TESTS
    * 
    */
    router.get('/studies/:studyid/tests', async (req, res, next) => {
        Simva.getStudyTests(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/export', async (req, res, next) => {
        Simva.exportStudyConfig(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/studies/import', async (req, res, next) => {
        Simva.importStudyConfig(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/tests/:testid', async (req, res, next) => {
        Simva.getStudyTest(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/groups', async (req, res, next) => {
        Simva.getStudyGroups(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/tests/:testid/activities', async (req, res, next) => {
        Simva.getTestActivities(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/participants', async (req, res, next) => {
        Simva.getStudyParticipants(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/schedule', async (req, res, next) => {
        Simva.getStudySchedule(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * ACTIVITIES
    * 
    */
    router.post('/studies/:studyid/tests/:testid/activities', async (req, res, next) => {
        Simva.addActivityToTest(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid', async (req, res, next) => {
        Simva.getActivity(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/activities/:activityid/surveyowner', async (req, res, next) => {
        Simva.setSurveyOwner(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/usersurveylist', async (req, res, next) => {
        Simva.getSurveyList(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/progress', async (req, res, next) => {
        Simva.getActivityProgress(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/completion', async (req, res, next) => {
        Simva.getActivityCompletion(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/completion', async (req, res, next) => {
        Simva.setActivityCompletion(req.params["activityid"], req.query.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/result', async (req, res, next) => {
        if(req.query.type) {
            if(req.query.users) {
                Simva.getActivityResultWithTypeForUser(req.params["activityid"], req.query.type, req.query.users, req.session.id, (error, result) => {
                    if(error) {
                        next(error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            } else {
                Simva.getActivityResultWithType(req.params["activityid"], req.query.type, req.session.id, (error, result) => {
                    if(error) {
                        next(error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        } else {
            if(req.query.users) {
                Simva.getActivityResultForUser(req.params["activityid"], req.query.users, req.session.id, (error, result) => {
                    if(error) {
                        next(error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            } else {
                Simva.getActivityResult(req.params["activityid"], req.session.id, (error, result) => {
                    if(error) {
                        next(error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        }
        
    });

    router.get('/activities/:activityid/hasresult', async (req, res, next) => {
        Simva.getActivityHasResult(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/target', async (req, res, next) => {
        Simva.getActivityTarget(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/openable', async (req, res, next) => {
        Simva.isActivityOpenable(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/presignedurl', async (req, res, next) => {
        Simva.getMinioDataUrl(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/activities/:activityid', async (req, res, next) => {
        Simva.deleteActivity(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activitytypes', async (req, res, next) => {
        Simva.getActivityTypes(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/allocatortypes', async (req, res, next) => {
        Simva.getAllocatorTypes(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
    * LTI
    * 
    */
    router.get('/lti/tools', async (req, res, next) => {
        Simva.getLtiTools(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/lti/tools', async (req, res, next) => {
        Simva.addLtiTool(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/lti/tools/:toolid', async (req, res, next) => {
        Simva.deleteLtiTool(req.params["toolid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/lti/platforms', async (req, res, next) => {
        let studyid = null;
        if(req.query.searchString) {
            studyid = JSON.parse(req.query.searchString).studyId;
        }
        Simva.getLtiPlatforms(studyid, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/lti/platforms', async (req, res, next) => {
        Simva.addLtiPlatform(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/lti/platforms/:platformid', async (req, res, next) => {
        Simva.removePlatform(req.params["platformid"], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    return router;
  }