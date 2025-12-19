const usertools = require('../lib/usertools');

module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();
    const defaultLanguage=config.i18n.defaultLanguage;
    
    const logger = require('../../logger');
    const Simva = require('../lib/simva');
    const studycontroler = require('../lib/studycontroler');
    const groupcontroler = require('../lib/groupcontroler');
    const testscontroler = require('../lib/testscontroler');
    const axios = require('axios');
    
    router.get('/languages/:lng', function(req, res, next) {
        const lng = req.params["lng"];  // Get the new language from query parameters
        res.cookie('i18next', lng, { maxAge: 900000, httpOnly: true });  // Set the new language in a cookie
        res.status(200).send({ message : "Language updated" });
    });

    router.get('/languages/', function(req, res, next) {
        const displayNames = new Intl.DisplayNames([req.cookies.i18next], { type: 'language' });
        res.status(200).send({ current : req.cookies.i18next, default: defaultLanguage, languages : 
            config.i18n.languages.map(
                code => ({
                    name: displayNames.of(code),
                    code
                })
            )
        });
    });

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

    router.post('/groups/:groupid/users', auth, async (req, res, next) => {
        let groupid = req.params['groupid'];
        let users=[];
        let params = {
            algorithm: req.body.algorithm,
            length : req.body.length,
            groupid: groupid,
            useNewGeneration:req.body.useNewGeneration,
        }
        let batchLength=req.body.batchLength;
        while (users.length < batchLength) {
            // Fire off remaining promises in parallel
            const remaining = batchLength - users.length;
            const promises = Array.from({ length: remaining }, () => groupcontroler.generateStudentUserWithRetry(params, req.session.id, 5));
            logger.info("Test");
            try {
                const results = await Promise.all(promises);
                logger.info(results);
                users.push(...results.map(student => student.username));
                logger.info(users.length);
                logger.info(users);
            } catch (err) {
                logger.error("Error generating some users:", err);
                // continue loop → it will retry failed ones
            }
        }

        res.status(200).send(users);
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
                let name={username : result.username};
                if(result.isToken == 'true') {
                    name={token : result.token};
                }
                res.status(200).send(name);
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
            next(error);
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
            next(error);
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
     * SANDBOX
     */
    router.post('/studies/:studyid/tests/:testid/sandbox', auth, async (req, res, next) => {
        let studyId=req.params["studyid"];
        let testId=req.params["testid"];
        let use_new_generation = req.query["new"] ? req.query["new"] == "true" : true;
        try {
            let result = await studycontroler.addSandboxToTest(studyId, testId, use_new_generation, req.session.id);
            res.status(200).send(result);
        } catch(error) {
            next(error);
        }
    });

    router.patch('/studies/:studyid/tests/:testid/sandbox', auth, async (req, res, next) => {
        Simva.resetSandbox(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/studies/:studyid/tests/:testid/sandbox', auth, async (req, res, next) => {
        let studyId=req.params["studyid"];
        let testId=req.params["testid"];
        try {
            let result = await studycontroler.deleteSandboxFromTest(studyId, testId, req.session.id);
            res.status(200).send(result);
        } catch(error) {
            next(error);
        }
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
            next(error);
        }
    });

    router.post('/studies/import', auth, async (req, res, next) => {
        let newstudy = JSON.parse(atob(req.body.file));
        let sessionid = req.session.id;
        try {
            let study = await studycontroler.importStudy(newstudy, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error);
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

    router.get('/studies/:studyid/schedule/sandbox', auth, async (req, res, next) => {
        Simva.getStudySchedule(req.params["studyid"], `${req.params["studyid"]}_sandbox_user`, (error, result) => {
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

    router.post('/activities/:activityid/multicompletion', auth, async (req, res, next) => {
        Simva.setMultiActivityCompletion(req.params["activityid"], req.body.status, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/suspend', auth, async (req, res, next) => {
        Simva.setActivitySuspend(req.params["activityid"], req.body.user, req.body.status, req.body.reason, req.session.id, (error, result) => {
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
                res.status(200).send(result);
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
                commun={};
                commun['completed_title'] = req.t(`completed.title`, { ns : 'activities' } );
                commun['completed_error'] = req.t(`completed.error.message`, { ns : 'activities' } );
                commun['completed_all_set'] = req.t(`completed.all.set`, { ns : 'activities' } );
                commun['completed_all_unset'] = req.t(`completed.all.unset`, { ns : 'activities' } );
                commun['completed_on'] = req.t(`completed.on`, { ns : 'activities' } );
                commun['completed_off'] = req.t(`completed.off`, { ns : 'activities' } );
                commun['result_title'] = req.t(`result.title`, { ns : 'activities' } );
                commun['result_disabled'] = req.t(`result.disabled`, { ns : 'activities' } );
                commun['result_error_loading'] = req.t(`result.error.loading`, { ns : 'activities' } );
                commun['result_error_downloading'] = req.t(`result.error.downloading`, { ns : 'activities' } );
                commun['storage_title'] = req.t(`storage.title`, { ns : 'activities' } );
                commun['storage_disabled'] = req.t(`storage.disabled`, { ns : 'activities' } );
                commun['storage_file_title'] = req.t(`storage.file.title`, { ns : 'activities' } );
                commun['storage_file_array_title'] = req.t(`storage.file.array.title`, { ns : 'activities' } );
                commun['storage_file_one_per_line_title'] = req.t(`storage.file.one_per_line.title`, { ns : 'activities' } );
                commun['storage_error_downloading'] = req.t(`storage.error.downloading`, { ns : 'activities' } );
                commun['progress_title'] = req.t(`progress.title`, { ns : 'activities' } );
                commun['user_title'] = req.t(`participant.title`, { ns : 'activities' } );
                commun['tmon_title'] = req.t(`tmon.title`, { ns : 'activities' } );

                result.forEach(element => {
                    element['description'] = req.t(`${element.type}.description`, { ns : 'activities' } );
                    element['name'] = req.t(`${element.type}.name`, { ns : 'activities' } );
                    element['commun']=commun;
                    communSpecific={};
                    switch(element.type){
						case 'limesurvey':
						case 'gameplay':
						case 'activity':
                        case 'manual':
							communSpecific['result_file_prefix'] = req.t(`${element.type}.result.file.prefix`, { ns : 'activities' } );
                            communSpecific['result_title'] = req.t(`${element.type}.result.title`, { ns : 'activities' } );
                            communSpecific['result_zero'] = req.t(`${element.type}.result.zero`, { ns : 'activities' } );
                            communSpecific['result_view_partial_value'] = req.t(`${element.type}.result.view.partial`, { ns : 'activities' } );
                            communSpecific['result_view_final_value'] = req.t(`${element.type}.result.view.final`, { ns : 'activities' } );
                            communSpecific['storage_title'] = req.t(`${element.type}.storage.title`, { ns : 'activities' } );
                            communSpecific['storage_file_suffix_array'] = req.t(`${element.type}.storage.file.array.suffix`, { ns : 'activities' } );
                            communSpecific['storage_file_suffix_one_per_line'] = req.t(`${element.type}.storage.file.one_per_line.suffix`, { ns : 'activities' } );
                            break;
						default:
							break; 
                    }
                    element['communSpecific']=communSpecific;
                    specific={};
                    switch(element.type){
						case 'limesurvey':
                            specific['surveyid_title'] = req.t(`${element.type}.surveyid.title`, { ns : 'activities' } );
							specific['surveyid_placeholder'] = req.t(`${element.type}.surveyid.placeholder`, { ns : 'activities' } );
                            specific['existing_title'] = req.t(`${element.type}.existing.title`, { ns : 'activities' } );
                            specific['new_title'] = req.t(`${element.type}.new.title`, { ns : 'activities' } );
                            specific['new_message'] = req.t(`${element.type}.new.message`, { ns : 'activities' } );
                            specific['upload_title'] = req.t(`${element.type}.upload.title`, { ns : 'activities' } );
                            specific['upload_message'] = req.t(`${element.type}.upload.message`, { ns : 'activities' } );
                            specific['language_title'] = req.t(`${element.type}.language.title`, { ns : 'activities' } );
                            specific['survey_title'] = req.t(`${element.type}.survey.title`, { ns : 'activities' } );
                            specific['edit_title'] = req.t(`${element.type}.edit.title`, { ns : 'activities' } );
                            specific['short_url_title'] = req.t(`${element.type}.short_url.title`, { ns : 'activities' } );
                            specific['backup_full_title'] = req.t(`${element.type}.backup.full.title`, { ns : 'activities' } );
                            specific['backup_code_title'] = req.t(`${element.type}.backup.code.title`, { ns : 'activities' } );
							break;
						case 'gameplay':
                            specific['xapi_by_game_title'] = req.t(`${element.type}.xapi_by_game.title`, { ns : 'activities' } );
                            specific['game_uri_title'] = req.t(`${element.type}.game_uri.title`, { ns : 'activities' } );
                            specific['game_uri_explication'] = req.t(`${element.type}.game_uri.explication`, { ns : 'activities' } );
                            specific['xasu_title'] = req.t(`${element.type}.xasu.title`, { ns : 'activities' } );
							break;
                        case 'manual':
                            specific['student_complete_title'] = req.t(`${element.type}.student_complete.title`, { ns : 'activities' } );
                            specific['student_complete_ok'] = req.t(`${element.type}.student_complete.ok`, { ns : 'activities' } );
                            specific['student_complete_nok'] = req.t(`${element.type}.student_complete.nok`, { ns : 'activities' } );
                            specific['uri_title'] = req.t(`${element.type}.uri.title`, { ns : 'activities' } );
                            specific['uri_explication'] = req.t(`${element.type}.uri.explication`, { ns : 'activities' } );
							break;
                        case 'imspackage':
                            specific['package_title'] = req.t(`${element.type}.package.title`, { ns : 'activities' } );
							break;
						default:
							break; 
                    }
                    element['specific']=specific;
                });
                res.status(200).send(result);
            }
        });
    });

    router.get('/allocatortypes', auth, async (req, res, next) => {
        Simva.getAllocatorTypes(req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                result.forEach(element => {
                    element['description'] = req.t(`allocator.${element.type}.description`, { ns : 'SIMLETs' } );
                    element['name'] = req.t(`allocator.${element.type}.title`, { ns : 'SIMLETs' } );
                    element['type_t'] = req.t(`allocator.${element.type}.type`, { ns : 'SIMLETs' } );
                    element['type_title'] = req.t(`allocator.type.title`, { ns : 'SIMLETs' } );
                    element['test_title'] = req.t(`allocator.sessions.title`, { ns : 'SIMLETs' } );
                    element['participant_title'] = req.t(`allocator.participants.title`, { ns : 'SIMLETs' } );
                    element['add_error'] = req.t(`allocator.add.error`, { ns : 'SIMLETs' } );
                    element['add_message'] = req.t(`allocator.add.message`, { ns : 'SIMLETs' } );
                    element['add_title'] = req.t(`allocator.add.title`, { ns : 'SIMLETs' } );
                });
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