const SimvaAsync = require('../lib/simvaAsync');
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

    router.post('/simlets/:simletid/shlink', auth, async (req, res, next) => {
        Simva.generateURL(req.params['simletid'], req.body.customSlug, req.body.length, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    router.get('/simlets/:simletid/shlink', auth, async (req, res, next) => {
        Simva.getShLink(req.params['simletid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/simlets/:simletid/shlink', auth, async (req, res, next) => {
        Simva.updateShLink(req.params['simletid'], req.body.customSlug, req.body.length, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/simlets/:simletid/shlink', auth, async (req, res, next) => {
        Simva.deleteShLink(req.params["simletid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send({ message : "Short Link deleted" });
            }
        });
    });
    
    /**
    * USERS
    * 
    */
    router.post('/simlets/:simletid/groups/:groupid/participants/:participantid', auth, async (req, res, next) => {
        let simletid = req.params['simletid'];
        let groupid = req.params['groupid'];
        let participantid = req.params['participantid'];
        Simva.addGroupParticipant(simletid, groupid, participantid, req.session.id, (error, result) => {
            if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
    });

    router.post('/simlets/:simletid/groups/:groupid/users', auth, async (req, res, next) => {
        let simletid = req.params['simletid'];
        let groupid = req.params['groupid'];
        if(req.body.algorithm && req.body.length && req.body.batchLength) {    
            let users=[];
            let params = {
                algorithm: req.body.algorithm,
                length : req.body.length,
                groupid: groupid,
                checkIfExists: req.body.checkIfExists || false,
            }
            let batchLength=req.body.batchLength;
            while (users.length < batchLength) {
                // Fire off remaining promises in parallel
                const remaining = batchLength - users.length;
                const promises = Array.from({ length: remaining }, () => groupcontroler.generateStudentUserWithRetry(simletid, params, req.session.id, 5));
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
        } else {
            Simva.register(simletid, groupid, req.body.username, req.body.email, req.body.password, req.body.role, req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    router.get('/users', auth, async (req, res, next) => {
        if(req.query.username) {
            Simva.getUser(req.query.username, req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        } else {
            Simva.getUsers(req.query.search, req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    router.patch('/users/:username', auth, async (req, res, next) => {
        Simva.setRole(req.body, req.session.id, (error, result) => {
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
                let name={username : result.username, user_id : result.user_id};
                if(result.isToken) {
                    name={token : result.token, user_id : result.user_id};
                }
                res.status(200).send(name);
            }
        });
    });

    router.post('/users/link', auth, async (req, res, next) => {
        Simva.linkUserAccount(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/users/events', auth, async (req, res, next) => {
        Simva.processUserEvents(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
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
    * Add to Task List
    * 
    */
    router.get('/tasklist', auth, async (req, res, next) => {
        Simva.addToTaskList(req.body, req.session.id, (error, result) => {
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
        if(req.query.use_new_generation) {
            Simva.getGroupsWithVersion(req.query.use_new_generation === 'true', req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        } else {
            Simva.getGroups(req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        }
        
    });


    /**
    * SIMLET GROUPS (with simlet_id)
    * 
    */
    router.post('/simlets/:simlet_id/groups/:groupid/users', auth, async (req, res, next) => {
        if(req.body.algorithm && req.body.length && req.body.batchLength) {
            let simlet_id = req.params['simlet_id'];
            let groupid = req.params['groupid'];
            let users=[];
            let params = {
                algorithm: req.body.algorithm,
                length : req.body.length,
                groupid: groupid,
                checkIfExists: req.body.checkIfExists || false,
            }
            let batchLength=req.body.batchLength;
            while (users.length < batchLength) {
                const remaining = batchLength - users.length;
                const promises = Array.from({ length: remaining }, () => groupcontroler.generateStudentUserWithRetry(simlet_id, params, req.session.id, 5));
                try {
                    const results = await Promise.all(promises);
                    users.push(...results.map(student => student.username));
                } catch (err) {
                    logger.error("Error generating some users:", err);
                }
            }
            res.status(200).send(users);
        } else {
            Simva.register(req.params["simlet_id"], req.params["groupid"], req.body.username, req.body.email, req.body.password, req.body.role, req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    router.post('/simlets/:simlet_id/groups', auth, async (req, res, next) => {
        Simva.addGroup(req.params['simlet_id'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/simlets/:simlet_id/groups/:groupid', auth, async (req, res, next) => {
        Simva.updateGroup(req.params['simlet_id'], req.params['groupid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/simlets/:simlet_id/groups/:groupid', auth, async (req, res, next) => {
        let simlet_id = req.params['simlet_id'];
        let groupid = req.params['groupid'];
        let sessionid = req.session.id;
        try {
            let group = await groupcontroler.getCompleteGroup(simlet_id, groupid, sessionid);
            res.status(200).send(group);
        } catch(error) {
            next(error);
        }
    });

    router.get('/simlets/:simlet_id/groups/count', auth, async (req, res, next) => {
        Simva.getGroupCount(req.params['simlet_id'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/simlets/:simlet_id/groups/:groupid/permissions', auth, async (req, res, next) => {
        Simva.getGroupDirectPermissions(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/simlets/:simlet_id/groups/:groupid/permissions', auth, async (req, res, next) => {
        Simva.createGroupPermissions(req.params['simlet_id'], req.params['groupid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/simlets/:simlet_id/groups/:groupid/permissions/:userid', auth, async (req, res, next) => {
        Simva.getGroupPermissionsForUser(req.params['simlet_id'], req.params['groupid'], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/simlets/:simlet_id/groups/:groupid/permissions/:userid', auth, async (req, res, next) => {
        Simva.patchGroupPermissionsForUser(req.params['simlet_id'], req.params['groupid'], req.params['userid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/simlets/:simlet_id/groups/:groupid/permissions/:userid', auth, async (req, res, next) => {
        Simva.deleteGroupPermissionsForUser(req.params['simlet_id'], req.params['groupid'], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/simlets/:simlet_id/groups/:groupid', auth, async (req, res, next) => {
        Simva.deleteGroup(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/simlets/:simlet_id/groups/:groupid/simlets', auth, async (req, res, next) => {
        Simva.getGroupSimlets(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/simlets/:simlet_id/groups/:groupid/participants', auth, async (req, res, next) => {
        Simva.getGroupParticipants(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/simlets/:simlet_id/groups/:groupid/participants/:participantid', auth, async (req, res, next) => {
        let simlet_id = req.params['simlet_id'];
        let groupid = req.params['groupid'];
        let participantid = req.params['participantid'];
        let removeKeycloak = req.query.keycloakDelete === 'true';
        Simva.deleteGroupParticipant(simlet_id, groupid, participantid, removeKeycloak, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    /**
     * TAGS
     */
    router.get('/tags', auth, async (req, res, next) => {
        Simva.getTags(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/tags', auth, async (req, res, next) => {
        Simva.createTag(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/tags/:tagid', auth, async (req, res, next) => {
        Simva.updateTag(req.params['tagid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/tags/:tagid', auth, async (req, res, next) => {
        Simva.deleteTag(req.params['tagid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
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
        Simva.addStudy(req.body, req.session.id, (error, result) => {
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
                                
    router.patch('/studies/:studyid', auth, async (req, res, next) => {
        Simva.updateStudy(req.params['studyid'], req.body, req.session.id, (error, result) => {
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
                testToDuplicate.name = req.body.session_name;
                let newTest=await testscontroler.importTest(req.params["studyid"], testToDuplicate, req.session.id);
                res.status(200).send(newTest);
            } catch(error) {
                next(error.response.data);
            }
        } else {
            Simva.addTestToStudy(req.params["studyid"], req.body, req.session.id, (error, result) => {
                if(error) {
                    next(error.response.data);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    router.patch('/studies/:studyid/tests/:testid', auth, async (req, res, next) => {
        Simva.updateTest(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/studies/:studyid/tests/:testid', auth, async (req, res, next) => {
        Simva.deleteTest(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/simlets/:studyid/tests/:testid/tags/:tag', auth, async (req, res, next) => {
        Simva.addTagToSession(req.params["studyid"], req.params["testid"], req.params["tag"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/simlets/:studyid/tests/:testid/tags/:tag', auth, async (req, res, next) => {
        Simva.deleteTagFromSession(req.params["studyid"], req.params["testid"], req.params["tag"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/activities/:activityid', auth, async (req, res, next) => {
        // Merge fields from multipart form
        Simva.updateActivity(req.params["activityid"], req, req.body, req.session.id, (error, result) => {
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

    router.get('/studies/:studyid/permissions', auth, async (req, res, next) => {
        Simva.getStudyDirectPermissions(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/studies/:studyid/permissions', auth, async (req, res, next) => {
        Simva.createStudyPermissions(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/permissions/:userid', auth, async (req, res, next) => {
        Simva.getStudyPermissionsForUser(req.params["studyid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/studies/:studyid/permissions/:userid', auth, async (req, res, next) => {
        Simva.patchStudyPermissionsForUser(req.params["studyid"], req.params['userid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/studies/:studyid/permissions/:userid', auth, async (req, res, next) => {
        Simva.deleteStudyPermissionsForUser(req.params["studyid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/studies/:studyid/allocator', auth, async (req, res, next) => {
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

    router.get('/studies/:studyid/tests/:testid/participants', auth, async (req, res, next) => {
        Simva.getSessionParticipants(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/studies/:studyid/groups/:groupid/allocate/:testid', auth, async (req, res, next) => {
        Simva.allocateToSession(req.params["studyid"], req.params["groupid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).json(result ?? {});
            }
        });
    });

    router.post('/studies/:studyid/groups/:groupid/allocate/random', auth, async (req, res, next) => {
        Simva.allocateRandomly(req.params["studyid"], req.params["groupid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).json(result ?? {});
            }
        });
    });

    router.get('/studies/:studyid/tests/:testid/permissions', auth, async (req, res, next) => {
        Simva.getSessionPermissions(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/studies/:studyid/tests/:testid/permissions', auth, async (req, res, next) => {
        Simva.createSessionPermissions(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid/tests/:testid/permissions/:userid', auth, async (req, res, next) => {
        Simva.getSessionPermissionsForUser(req.params["studyid"], req.params["testid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/studies/:studyid/tests/:testid/permissions/:userid', auth, async (req, res, next) => {
        Simva.patchSessionPermissionsForUser(req.params["studyid"], req.params["testid"], req.params['userid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/studies/:studyid/tests/:testid/permissions/:userid', auth, async (req, res, next) => {
        Simva.deleteSessionPermissionsForUser(req.params["studyid"], req.params["testid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
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

    router.post('/studies/:studyid/groups/:groupid', auth, async (req, res, next) => {
        Simva.addStudyGroup(req.params["studyid"], req.params["groupid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/studies/:studyid/groups/:groupid', auth, async (req, res, next) => {
        Simva.deleteStudyGroup(req.params["studyid"], req.params["groupid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
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

    router.post('/studies/:studyid/tests/:testid/activate', auth, async (req, res, next) => {
        Simva.activateSession(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
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
        Simva.addActivityToTest(req.params["studyid"], req.params["testid"], req, req.body, req.session.id, (error, result) => {
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

    router.get('/activities/:activityid/export', auth, async (req, res, next) => {
        Simva.exportActivity(req.params["activityid"], req.query.complete === 'true', req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.patch('/limesurvey/surveys/:surveyid/owner', auth, async (req, res, next) => {
        Simva.setSurveyOwner(req.params["surveyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/limesurvey/surveys/:surveyid/languages', auth, async (req, res, next) => {
        Simva.getSurveyLanguages(req.params["surveyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/open', auth, async (req, res, next) => {
        Simva.openActivity(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/initialized', auth, async (req, res, next) => {
        Simva.getActivityInitialized(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/initialized', auth, async (req, res, next) => {
        Simva.setActivityInitialized(req.params["activityid"], req.query.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/progress', auth, async (req, res, next) => {
        Simva.setActivityProgress(req.params["activityid"], req.query.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/limesurvey/surveys', auth, async (req, res, next) => {
        Simva.getSurveyList(req.session.id, (error, result) => {
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

    router.get('/activities/:activityid/suspension', auth, async (req, res, next) => {
        Simva.getActivitySuspension(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/completion', auth, async (req, res, next) => {
        Simva.setActivityCompletion(req.params["activityid"], req.query.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/completion/multi', auth, async (req, res, next) => {
        Simva.setMultiActivityCompletion(req.params["activityid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/multicompletion', auth, async (req, res, next) => {
        Simva.setMultiActivityCompletion(req.params["activityid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response.data);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/activities/:activityid/suspension', auth, async (req, res, next) => {
        Simva.setActivitySuspension(req.params["activityid"], req.body, req.session.id, (error, result) => {
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

    router.post('/activities/:activityid/test', auth, async (req, res, next) => {
        Simva.setActivityTest(req.params["activityid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
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

    router.get('/simlets/:simletid/sessions/:sessionid/lrs/statements', auth, async (req, res, next) => {
        try {
            let statements = [];
            let result = await SimvaAsync.getSessionLRSData(req.params["simletid"], req.params["sessionid"], req.session.id);
            for(let i=0; i<result.statements.length; i++) {
                statements.push(JSON.stringify(result.statements[i]));
            }
            while(result.more != '') {
                result = await SimvaAsync.getSessionMoreLRSData(req.params["simletid"], req.params["sessionid"], result.more, req.session.id);
                for(let i=0; i<result.statements.length; i++) {
                    statements.push(JSON.stringify(result.statements[i]));
                }
            }
            res.status(200).send({data : statements.join('\n')});
        } catch(error) {
            next(error.response.data);
        }
    });

    router.get('/activities/:activityid/lrs/statements', auth, async (req, res, next) => {
        try {
            let statements = [];
            let result = await SimvaAsync.getActivityLRSData(req.params["activityid"], req.session.id);
            for(let i=0; i<result.statements.length; i++) {
                statements.push(JSON.stringify(result.statements[i]));
            }
            while(result.more != '') {
                result = await SimvaAsync.getActivityMoreLRSData(req.params["activityid"], result.more, req.session.id);
                for(let i=0; i<result.statements.length; i++) {
                    statements.push(JSON.stringify(result.statements[i]));
                }
            }
            res.status(200).send({data : statements.join('\n')});
        } catch(error) {
            next(error.response.data);
        }
    });

    router.get('/activities/:activityid/lrs/statements/more', auth, async (req, res, next) => {
        SimvaAsync.getActivityMoreLRSData(req.params["activityid"], req.query.url, req.session.id, (error, result) => {
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
                commun['init_title'] = req.t(`init.title`, { ns : 'activities' } );
                commun['init_on'] = req.t(`init.on`, { ns : 'activities' } );
                commun['init_off'] = req.t(`init.off`, { ns : 'activities' } );

                result.forEach(element => {
                    element['description'] = req.t(`${element.activity_type}.description`, { ns : 'activities' } );
                    element['name'] = req.t(`${element.activity_type}.name`, { ns : 'activities' } );
                    element['commun']=commun;
                    communSpecific={};
                    switch(element.activity_type){
						case 'limesurvey':
						case 'gameplay':
						case 'activity':
                        case 'manual':
							communSpecific['result_file_prefix'] = req.t(`${element.activity_type}.result.file.prefix`, { ns : 'activities' } );
                            communSpecific['result_title'] = req.t(`${element.activity_type}.result.title`, { ns : 'activities' } );
                            communSpecific['result_zero'] = req.t(`${element.activity_type}.result.zero`, { ns : 'activities' } );
                            communSpecific['result_view_partial_value'] = req.t(`${element.activity_type}.result.view.partial`, { ns : 'activities' } );
                            communSpecific['result_view_final_value'] = req.t(`${element.activity_type}.result.view.final`, { ns : 'activities' } );
                            communSpecific['storage_title'] = req.t(`${element.activity_type}.storage.title`, { ns : 'activities' } );
                            communSpecific['storage_file_suffix_array'] = req.t(`${element.activity_type}.storage.file.array.suffix`, { ns : 'activities' } );
                            communSpecific['storage_file_suffix_one_per_line'] = req.t(`${element.activity_type}.storage.file.one_per_line.suffix`, { ns : 'activities' } );
                            break;
						default:
							break; 
                    }
                    element['communSpecific']=communSpecific;
                    specific={};
                    switch(element.activity_type){
						case 'limesurvey':
                            specific['surveyid_title'] = req.t(`${element.activity_type}.surveyid.title`, { ns : 'activities' } );
							specific['surveyid_placeholder'] = req.t(`${element.activity_type}.surveyid.placeholder`, { ns : 'activities' } );
                            specific['existing_title'] = req.t(`${element.activity_type}.existing.title`, { ns : 'activities' } );
                            specific['new_title'] = req.t(`${element.activity_type}.new.title`, { ns : 'activities' } );
                            specific['new_message'] = req.t(`${element.activity_type}.new.message`, { ns : 'activities' } );
                            specific['upload_title'] = req.t(`${element.activity_type}.upload.title`, { ns : 'activities' } );
                            specific['upload_message'] = req.t(`${element.activity_type}.upload.message`, { ns : 'activities' } );
                            specific['language_title'] = req.t(`${element.activity_type}.language.title`, { ns : 'activities' } );
                            specific['survey_title'] = req.t(`${element.activity_type}.survey.title`, { ns : 'activities' } );
                            specific['edit_title'] = req.t(`${element.activity_type}.edit.title`, { ns : 'activities' } );
                            specific['short_url_title'] = req.t(`${element.activity_type}.short_url.title`, { ns : 'activities' } );
                            specific['backup_full_title'] = req.t(`${element.activity_type}.backup.full.title`, { ns : 'activities' } );
                            specific['backup_code_title'] = req.t(`${element.activity_type}.backup.code.title`, { ns : 'activities' } );
							break;
						case 'gameplay':
                            specific['xapi_by_game_title'] = req.t(`${element.activity_type}.xapi_by_game.title`, { ns : 'activities' } );
                            specific['game_uri_title'] = req.t(`${element.activity_type}.game_uri.title`, { ns : 'activities' } );
                            specific['game_uri_explication'] = req.t(`${element.activity_type}.game_uri.explication`, { ns : 'activities' } );
                            specific['xasu_title'] = req.t(`${element.activity_type}.xasu.title`, { ns : 'activities' } );
							break;
                        case 'manual':
                            specific['student_complete_title'] = req.t(`${element.activity_type}.student_complete.title`, { ns : 'activities' } );
                            specific['student_complete_ok'] = req.t(`${element.activity_type}.student_complete.ok`, { ns : 'activities' } );
                            specific['student_complete_nok'] = req.t(`${element.activity_type}.student_complete.nok`, { ns : 'activities' } );
                            specific['uri_title'] = req.t(`${element.activity_type}.uri.title`, { ns : 'activities' } );
                            specific['uri_explication'] = req.t(`${element.activity_type}.uri.explication`, { ns : 'activities' } );
							break;
                        case 'imspackage':
                            specific['package_title'] = req.t(`${element.activity_type}.package.title`, { ns : 'activities' } );
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
                logger.info("Allocator types before i18n processing:", result);
                result.forEach(element => {
                    element['description'] = req.t(`allocator.${element.allocator_type}.description`, { ns : 'SIMLETs' } );
                    element['name'] = req.t(`allocator.${element.allocator_type}.title`, { ns : 'SIMLETs' } );
                    element['type_t'] = req.t(`allocator.${element.allocator_type}.type`, { ns : 'SIMLETs' } );
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