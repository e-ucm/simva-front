const activitiescontroler = require('../lib/activitiescontroler');
const SimvaAsync = require('../lib/simvaAsync');
const usertools = require('../lib/usertools');

/**
 * Filter out empty strings, null, and undefined values
 * @param {object} req - object containing the parameters of the request, including the query 
 * @returns {object} - object containing the cleaned query parameters
 */
const getCleanQuery = function(req) {
    return Object.fromEntries(
        Object.entries(req.query).filter(([key, value]) => 
            // $.ajax GET cache parameter is set to false, even if there are no 
            // parameters, req.parameters will have an object with the _ property
            key !== '_' && value !== '' && value != null
        )
    );
}

module.exports = function(auth, redirectToLogin, config){
    var express = require('express'),
    router = express.Router();
    const defaultLanguage=config.i18n.defaultLanguage;
    
    const logger = require('../../logger');
    const Simva = require('../lib/simva');
    const studycontroler = require('../lib/studycontroler');
    const groupcontroler = require('../lib/groupcontroler');
    const testscontroler = require('../lib/testscontroler');
    const axios = require('axios');
    

    async function collectLrsStatements(fetchFirstPage, fetchNextPage) {
        const statements = [];
        let result = await fetchFirstPage();
        let previousFromCursor = null;
        while (result) {
            for (let i = 0; i < (result.statements || []).length; i++) {
                statements.push(JSON.stringify(result.statements[i]));
            }

            more = result.more;
            logger.info(`Fetched ${statements.length} statements so far...`);
            logger.info(`More statements available: ${more}`);
            
            // Break if no more link
            if (!more) {
                break;
            }

            // Extract the 'from' cursor value to detect infinite loops (parameter order may vary)
            const fromMatch = more.match(/[?&]from=([^&]+)/);
            const currentFromCursor = fromMatch ? fromMatch[1] : null;
            
            // Break if the cursor hasn't advanced (infinite loop detection)
            if (currentFromCursor && currentFromCursor === previousFromCursor) {
                logger.warn(`Pagination cursor stopped advancing at: ${currentFromCursor}`);
                break;
            }

            previousFromCursor = currentFromCursor;
            result = await fetchNextPage(more);
        }

        return statements.join('\n');
    }
    
    
    router.get('/languages/', (req, res, next) => {
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

    router.get('/languages/:lng', (req, res, next) => {
        const lng = req.params["lng"];  // Get the new language from query parameters
        res.cookie('i18next', lng, { maxAge: 900000, httpOnly: true });  // Set the new language in a cookie
        res.status(200).send({ message : "Language updated" });
    });


    // TAGS

    // Get the all the existing tags
    router.get('/tags', auth, redirectToLogin, async (req, res, next) => {
        Simva.getTags(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Add a new tag
    router.post('/tags', auth, redirectToLogin, async (req, res, next) => {
        Simva.createTag(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Update the specified tag
    router.patch('/tags/:tagid', auth, redirectToLogin, async (req, res, next) => {
        Simva.updateTag(req.params['tagid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Delete the specified tag
    router.delete('/tags/:tagid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteTag(req.params['tagid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    
    // SIMLETS + SCHEDULERS

    // Get all the SIMLETs matching the query search parameters
    router.get('/studies', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimlets(getCleanQuery(req), req.session.id, (error, result, cleanQuery) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the amount of SIMLETs matching the query search parameters
    router.get('/studies/count', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletsCount(getCleanQuery(req), req.session.id, (error, result, cleanQuery) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Add a new SIMLET
    router.post('/studies', auth, redirectToLogin, async (req, res, next) => {
        Simva.addSimlet(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Import a SIMLET
    router.post('/studies/import', auth, redirectToLogin, async (req, res, next) => {
        let newstudy = JSON.parse(atob(req.body.file));
        newstudy.simlet_name = req.body.simlet_name;
        let sessionid = req.session.id;
        try {
            let study = await studycontroler.importStudy(newstudy, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error);
        }
    });

    // Get the specified SIMLET
    router.get('/studies/:studyid', auth, redirectToLogin, async (req, res, next) => {
        let studyId = req.params['studyid'];
        let sessionid = req.session.id;
        try {
            let study = await SimvaAsync.getSimlet(studyId, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error);
        }
    });
    
    // Export the specified SIMLET
    router.get('/studies/:studyid/export', auth, redirectToLogin, async (req, res, next) => {
        let studyId = req.params['studyid'];
        let sessionid = req.session.id;
        try {
            let study = await studycontroler.exportStudy(studyId, true, sessionid);
            res.status(200).send(study);
        } catch(error) {
            next(error);
        }
    });
    
    // Update the specified SIMLET
    router.patch('/studies/:studyid', auth, redirectToLogin, async (req, res, next) => {
        Simva.updateSimlet(req.params['studyid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Delete the specified SIMLET
    router.delete('/studies/:studyid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteSimlet(req.params['studyid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });


    // Get all the scheduled SIMLETs matching the query search parameters
    router.get('/scheduler/studies', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSchedulerSimlets(getCleanQuery(req), req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the amount of scheduled SIMLETs matching the query search parameters
    router.get('/scheduler/studies/count', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSchedulerSimletsCount(getCleanQuery(req), req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the specified SIMLET scheduler 
    router.get('/studies/:studyid/schedule', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletScheduler(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });


    // SHLINK

    // Generate shlink for the specified SIMLET
    router.post('/simlets/:simletid/shlink', auth, redirectToLogin, async (req, res, next) => {
        Simva.generateShlink(req.params['simletid'], req.body.customSlug, req.body.length, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get shlink of the specified SIMLET
    router.get('/simlets/:simletid/shlink', auth, redirectToLogin, async (req, res, next) => {
        Simva.getShLink(req.params['simletid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Update shlink for the specified SIMLET
    router.patch('/simlets/:simletid/shlink', auth, redirectToLogin, async (req, res, next) => {
        Simva.updateShLink(req.params['simletid'], req.body.customSlug, req.body.length, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Delete shlink for the specified SIMLET
    router.delete('/simlets/:simletid/shlink', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteShLink(req.params["simletid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send({ message : "Short Link deleted" });
            }
        });
    });
    
    
    // SESSIONS
    
    // Get all the sessions matching the query search parameters 
    router.get('/studies/:studyid/tests', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletSessions(req.params["studyid"], getCleanQuery(req), req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Get the amount of sessions matching the query search parameters
    router.get('/studies/:studyid/tests/count', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletSessionsCount(req.params["studyid"], getCleanQuery(req), req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Add a new session
    router.post('/studies/:studyid/tests', auth, redirectToLogin, async (req, res, next) => {
        Simva.addSessionToSimlet(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Import a session
    router.post('/studies/:studyid/tests/import', auth, redirectToLogin, async (req, res, next) => {
        let newtest = JSON.parse(atob(req.body.file));
        newtest.session_name = req.body.session_name;
        let studyId = req.params['studyid'];
        let sessionid = req.session.id;
        try {
            let test = await testscontroler.importTest(studyId, newtest, sessionid);
            res.status(200).send(test);
        } catch(error) {
            next(error);
        }
    });
    
    // Get the specified session
    router.get('/studies/:studyid/tests/:testid', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletSession(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the complete info of the specified session
    router.get('/studies/:studyid/tests/:testid/complete', auth, redirectToLogin, async (req, res, next) => {
        let studyId = req.params['studyid'];
        let testId = req.params['testid'];
        let sessionid = req.session.id;
        try {
            let test = await testscontroler.getCompleteTest(studyId, testId, sessionid) 
            res.status(200).send(test);
        } catch(error) {
            next(error);
        }
    });

    // Export the specified session
    router.get('/studies/:studyid/tests/:testid/export', auth, redirectToLogin, async (req, res, next) => {
        try {
            let test = await testscontroler.exportSession(req.params["studyid"], req.params["testid"], true, req.session.id);
            res.status(200).send(test);
        } catch(error) {
            next(error.response?.data || error);
        }
    });

    // Update the specified session
    router.patch('/studies/:studyid/tests/:testid', auth, redirectToLogin, async (req, res, next) => {
        Simva.updateSession(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Delete the specified session
    router.delete('/studies/:studyid/tests/:testid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteSession(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    
    // Change the specified session status
    router.post('/studies/:studyid/tests/:testid/activate', auth, redirectToLogin, async (req, res, next) => {
        Simva.activateSession(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    

    // Add the specified tag to the specified session
    router.post('/simlets/:studyid/tests/:testid/tags/:tag', auth, redirectToLogin, async (req, res, next) => {
        Simva.addTagToSession(req.params["studyid"], req.params["testid"], req.params["tag"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Delete the specified tag from the specified session
    router.delete('/simlets/:studyid/tests/:testid/tags/:tag', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteTagFromSession(req.params["studyid"], req.params["testid"], req.params["tag"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });


    // Set current user as tester for the specified session (allocate to session, create sandbox group if needed)
    router.post('/studies/:studyid/tests/:testid/set-tester', auth, redirectToLogin, async (req, res, next) => {
        const studyid = req.params['studyid'];
        const testid = req.params['testid'];
        const user = await SimvaAsync.getCurrentUser(req.session.id);
        const userId = user.user_id;
        const username = user.username;
        try {
            const group = await groupcontroler.setTesterGroup(studyid, testid, userId, username, req.session.id);
            res.status(200).send({ message: 'Tester set', group_id: group.group_id });
        } catch (err) {
            next(err);
        }
    });

    // Remove the current user as tester from the specified session (remove from group, delete group if sandbox)
    router.post('/studies/:studyid/tests/:testid/unset-tester', auth, redirectToLogin, async (req, res, next) => {
        const studyid = req.params['studyid'];
        const testid = req.params['testid'];
        const user = await SimvaAsync.getCurrentUser(req.session.id);
        const userId = user.user_id;
        const username = user.username;
        try {
            await groupcontroler.unsetTesterGroup(studyid, testid, userId, username, req.session.id);
            res.status(200).send({ message: 'Tester removed' });
        } catch (err) {
            next(err);
        }
    });
    
    // Remove the current user as tester from the specified session and add it again
    router.post('/studies/:studyid/tests/:testid/reset-tester', auth, redirectToLogin, async (req, res, next) => {
        const studyid = req.params['studyid'];
        const testid = req.params['testid'];
        const user = await SimvaAsync.getCurrentUser(req.session.id);
        const userId = user.user_id;
        const username = user.username;
        try {
            const group = await groupcontroler.resetTesterGroup(studyid, testid, userId, username, req.session.id);
            res.status(200).send({ message: 'Tester reset', group_id: group.group_id });
        } catch (err) {
            next(err);
        }
    });
    

    // Get the LRS data of the specified session
    router.get('/simlets/:simletid/sessions/:sessionid/lrs/statements', auth, redirectToLogin, async (req, res, next) => {
        try {
            const data = await collectLrsStatements(
                () => SimvaAsync.getSessionLRSData(req.params["simletid"], req.params["sessionid"], req.session.id),
                (more) => SimvaAsync.getSessionMoreLRSData(req.params["simletid"], req.params["sessionid"], more, req.session.id)
            );
            res.status(200).send({ data });
        } catch(error) {
            next(error.response?.data || error);
        }
    });

    // Get the LRS data for the test users of the specified session
    router.get('/simlets/:simletid/sessions/:sessionid/lrs_test_statements', auth, redirectToLogin, async (req, res, next) => {
        try {
            const data = await collectLrsStatements(
                () => SimvaAsync.getSessionTestLRSData(req.params["simletid"], req.params["sessionid"], req.session.id),
                (more) => SimvaAsync.getSessionMoreTestLRSData(req.params["simletid"], req.params["sessionid"], more, req.session.id)
            );
            res.status(200).send({ data });
        } catch(error) {
            next(error.response?.data || error);
        }
    });
    

    // ACTIVITIES

    // Get all the activities in the specified session of the specified SIMLET
    router.get('/studies/:studyid/tests/:testid/activities', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSessionActivities(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get all the existing activity types
    router.get('/activitytypes', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivityTypes(req.session.id, (error, result) => {
            if (error) {
                next(error.response?.data || error);
            } else {
                let commun = {
                    completed_title: req.t(`completed.title`, { ns: 'activities' }),
                    completed_error: req.t(`completed.error.message`, { ns: 'activities' }),
                    completed_all_set: req.t(`completed.all.set`, { ns: 'activities' }),
                    completed_all_unset: req.t(`completed.all.unset`, { ns: 'activities' }),
                    completed_on: req.t(`completed.on`, { ns: 'activities' }),
                    completed_off: req.t(`completed.off`, { ns: 'activities' }),
                    result_title: req.t(`result.title`, { ns: 'activities' }),
                    result_disabled: req.t(`result.disabled`, { ns: 'activities' }),
                    result_error_loading: req.t(`result.error.loading`, { ns: 'activities' }),
                    result_error_downloading: req.t(`result.error.downloading`, { ns: 'activities' }),
                    storage_title: req.t(`storage.title`, { ns: 'activities' }),
                    storage_disabled: req.t(`storage.disabled`, { ns: 'activities' }),
                    storage_file_title: req.t(`storage.file.title`, { ns: 'activities' }),
                    storage_file_array_title: req.t(`storage.file.array.title`, { ns: 'activities' }),
                    storage_file_one_per_line_title: req.t(`storage.file.one_per_line.title`, { ns: 'activities' }),
                    storage_error_downloading: req.t(`storage.error.downloading`, { ns: 'activities' }),
                    progress_title: req.t(`progress.title`, { ns: 'activities' }),
                    user_title: req.t(`participant.title`, { ns: 'activities' }),
                    type_title: req.t(`type.title`, { ns: 'activities' }),
                    participant_tooltip: req.t(`participant.tooltip`, { ns: 'activities' }),
                    init_tooltip: req.t(`init.tooltip`, { ns: 'activities' }),
                    progress_tooltip: req.t(`progress.tooltip`, { ns: 'activities' }),
                    completed_tooltip: req.t(`completed.tooltip`, { ns: 'activities' }),
                    result_tooltip: req.t(`result.tooltip`, { ns: 'activities' }),
                    init_bar_tooltip: req.t(`init.bar.tooltip`, { ns: 'activities' }),
                    progress_bar_tooltip: req.t(`progress.bar.tooltip`, { ns: 'activities' }),
                    completed_bar_tooltip: req.t(`completed.bar.tooltip`, { ns: 'activities' }),
                    result_bar_tooltip: req.t(`result.bar.tooltip`, { ns: 'activities' }),
                    tmon_title: req.t(`tmon.title`, { ns: 'activities' }),
                    download_title: req.t(`download.title`, { ns: 'activities' }),
                    download_tooltip: req.t(`download.description`, { ns: 'activities' }),
                    test_download_title: req.t(`download.test.title`, { ns: 'activities' }),
                    test_download_tooltip: req.t(`download.test.description`, { ns: 'activities' }),
                    edit_title: req.t(`edit.title`, { ns: 'activities' }),
                    delete_title: req.t(`delete.title`, { ns: 'activities' }),
                    init_title: req.t(`init.title`, { ns: 'activities' }),
                    init_on: req.t(`init.on`, { ns: 'activities' }),
                    init_off: req.t(`init.off`, { ns: 'activities' }),
                    export_title: req.t(`export.title`, { ns: 'activities' }),
                    import_title: req.t(`import.tab`, { ns: 'activities' }),
                    import_message: req.t(`import.message`, { ns: 'activities' }),
                    import_error: req.t(`import.error`, { ns: 'activities' }),
                };

                result.forEach(element => {
                    element['description'] = req.t(`${element.activity_type}.description`, { ns: 'activities' });
                    element['name'] = req.t(`${element.activity_type}.name`, { ns: 'activities' });
                    element['commun'] = commun;
                    let communSpecific = {};
                    switch (element.activity_type) {
                        case 'limesurvey':
                        case 'gameplay':
                        case 'activity':
                        case 'manual':
                            communSpecific['result_file_prefix'] = req.t(`${element.activity_type}.result.file.prefix`, { ns: 'activities' });
                            communSpecific['result_title'] = req.t(`${element.activity_type}.result.title`, { ns: 'activities' });
                            communSpecific['result_description'] = req.t(`${element.activity_type}.result.description`, { ns: 'activities' });
                            communSpecific['result_zero'] = req.t(`${element.activity_type}.result.zero`, { ns: 'activities' });
                            communSpecific['result_view_partial_value'] = req.t(`${element.activity_type}.result.view.partial`, { ns: 'activities' });
                            communSpecific['result_view_final_value'] = req.t(`${element.activity_type}.result.view.final`, { ns: 'activities' });
                            communSpecific['storage_title'] = req.t(`${element.activity_type}.storage.title`, { ns: 'activities' });
                            communSpecific['storage_description'] = req.t(`${element.activity_type}.storage.description`, { ns: 'activities' });
                            communSpecific['storage_file_suffix_array'] = req.t(`${element.activity_type}.storage.file.array.suffix`, { ns: 'activities' });
                            communSpecific['storage_file_suffix_one_per_line'] = req.t(`${element.activity_type}.storage.file.one_per_line.suffix`, { ns: 'activities' });
                            communSpecific['restarted_title'] = req.t(`${element.activity_type}.restarted.title`, { ns: 'activities' });
                            communSpecific['restarted_description'] = req.t(`${element.activity_type}.restarted.description`, { ns: 'activities' });
                            break;
                        default:
                            break;
                    }
                    element['communSpecific'] = communSpecific;

                    let specific = {};
                    switch (element.activity_type) {
                        case 'limesurvey':
                            specific['surveyid_title'] = req.t(`${element.activity_type}.surveyid.title`, { ns: 'activities' });
                            specific['surveyid_placeholder'] = req.t(`${element.activity_type}.surveyid.placeholder`, { ns: 'activities' });
                            specific['existing_title'] = req.t(`${element.activity_type}.existing.title`, { ns: 'activities' });
                            specific['new_title'] = req.t(`${element.activity_type}.new.title`, { ns: 'activities' });
                            specific['new_description'] = req.t(`${element.activity_type}.new.description`, { ns: 'activities' });
                            specific['upload_title'] = req.t(`${element.activity_type}.upload.title`, { ns: 'activities' });
                            specific['upload_description'] = req.t(`${element.activity_type}.upload.description`, { ns: 'activities' });
                            specific['language_title'] = req.t(`${element.activity_type}.language.title`, { ns: 'activities' });
                            specific['survey_title'] = req.t(`${element.activity_type}.survey.title`, { ns: 'activities' });
                            specific['edit_title'] = req.t(`${element.activity_type}.edit.title`, { ns: 'activities' });
                            specific['short_url_title'] = req.t(`${element.activity_type}.short_url.title`, { ns: 'activities' });
                            specific['backup_full_title'] = req.t(`${element.activity_type}.backup.full.title`, { ns: 'activities' });
                            specific['backup_code_title'] = req.t(`${element.activity_type}.backup.code.title`, { ns: 'activities' });
                            break;
                        case 'gameplay':
                            specific['game_uri_title'] = req.t(`${element.activity_type}.game_uri.title`, { ns: 'activities' });
                            specific['game_uri_description'] = req.t(`${element.activity_type}.game_uri.description`, { ns: 'activities' });
                            specific['xasu_title'] = req.t(`${element.activity_type}.xasu.title`, { ns: 'activities' });
                            specific['upload_title'] = req.t(`${element.activity_type}.upload.title`, { ns: 'activities' });
                            specific['upload_description'] = req.t(`${element.activity_type}.upload.description`, { ns: 'activities' });
                            specific['xapi_by_game_title'] = req.t(`${element.activity_type}.xapi_by_game.title`, { ns: 'activities' });
                            specific['xapi_by_game_description'] = req.t(`${element.activity_type}.xapi_by_game.description`, { ns: 'activities' });
                            specific['platform_title'] = req.t(`${element.activity_type}.platform.title`, { ns: 'activities' });
                            specific['web_title'] = req.t(`${element.activity_type}.web.title`, { ns: 'activities' });
                            specific['web_description'] = req.t(`${element.activity_type}.web.description`, { ns: 'activities' });
                            specific['desktop_title'] = req.t(`${element.activity_type}.desktop.title`, { ns: 'activities' });
                            specific['desktop_description'] = req.t(`${element.activity_type}.desktop.description`, { ns: 'activities' });
                            break;
                        case 'manual':
                            specific['student_complete_title'] = req.t(`${element.activity_type}.student_complete.title`, { ns: 'activities' });
                            specific['student_complete_description'] = req.t(`${element.activity_type}.student_complete.description`, { ns: 'activities' });
                            specific['student_complete_ok'] = req.t(`${element.activity_type}.student_complete.ok`, { ns: 'activities' });
                            specific['student_complete_nok'] = req.t(`${element.activity_type}.student_complete.nok`, { ns: 'activities' });
                            specific['uri_title'] = req.t(`${element.activity_type}.uri.title`, { ns: 'activities' });
                            specific['uri_description'] = req.t(`${element.activity_type}.uri.description`, { ns: 'activities' });
                            specific['upload_title'] = req.t(`${element.activity_type}.upload.title`, { ns: 'activities' });
                            specific['upload_description'] = req.t(`${element.activity_type}.upload.description`, { ns: 'activities' });
                            specific['web_title'] = req.t(`${element.activity_type}.web.title`, { ns: 'activities' });
                            specific['web_description'] = req.t(`${element.activity_type}.web.description`, { ns: 'activities' });
                            specific['external_title'] = req.t(`${element.activity_type}.external.title`, { ns: 'activities' });
                            specific['external_description'] = req.t(`${element.activity_type}.external.description`, { ns: 'activities' });
                            break;
                        case 'imspackage':
                            specific['package_title'] = req.t(`${element.activity_type}.package.title`, { ns: 'activities' });
                            break;
                        default:
                            break;
                    }
                    element['specific'] = specific;
                });
                
                res.status(200).send(result);
            }
        });
    });

    // Add a new activity to the specified session of the specified SIMLET
    router.post('/studies/:studyid/tests/:testid/activities', auth, redirectToLogin, async (req, res, next) => {
        try {
            let activity = await SimvaAsync.addActivityToSession(req.params["studyid"], req.params["testid"], req, req.body, req.session.id);
            res.status(200).send(activity);
        } catch(error) {
            next(error.response?.data || error);
        }
    });
    
    // Import an activity to the specified session of the specified SIMLET
    router.post('/studies/:studyid/tests/:testid/activities/import', auth, redirectToLogin, async (req, res, next) => {
        let newactivity = JSON.parse(atob(req.body.file));
        newactivity.activity_name = req.body.activity_name;
        let studyId = req.params['studyid'];
        let testId = req.params['testid'];
        let sessionid = req.session.id;
        try {
            let activity = await activitiescontroler.importActivity(studyId, testId, newactivity, sessionid);
            res.status(200).send(activity);
        } catch(error) {
            next(error);
        }
    });

    // Get the specified activity
    router.get('/activities/:activityid', auth, redirectToLogin, async (req, res, next) => {
        try {
            let activity = await SimvaAsync.getActivity(req.params["activityid"], req.session.id);
            res.status(200).send(activity);
        } catch(error) {
            next(error.response?.data || error);
        }
    });
    
    // Export the specified activity
    router.get('/activities/:activityid/export', auth, redirectToLogin, async (req, res, next) => {
        try {
            let result = await SimvaAsync.exportActivity(req.params["activityid"], req.query.complete === 'true', req.session.id);
            res.status(200).send(result);
        } catch(error) {
            next(error.response?.data || error);
        }
    });
    router.get('/studies/:studyid/tests/:testid/activities/:activityid/export', auth, redirectToLogin, async (req, res, next) => {
        let complete = req.query.complete === 'true';
        let studyId = req.params['studyid'];
        let testId = req.params['testid'];
        let activityId = req.params['activityid'];
        let sessionid = req.session.id;
        try {
            let activity = await activitiescontroler.exportCompleteActivity(studyId, testId, activityId, complete, sessionid);
            res.status(200).send(activity);
        } catch(error) {
            next(error.response?.data || error);
        }
    });

    // Update the specified activity
    router.patch('/studies/:studyid/tests/:testid/activities/:activityid', auth, redirectToLogin, async (req, res, next) => {
        try {
            let activity = await SimvaAsync.updateActivity(req.params["studyid"], req.params["testid"], req.params["activityid"], req, req.body, req.session.id);
            res.status(200).send(activity);
        } catch(error) {
            next(error.response?.data || error);
        };
    });

    // Delete the specified activity
    router.delete('/studies/:studyid/tests/:testid/activities/:activityid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteActivity(req.params["studyid"], req.params["testid"], req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Document / remove?
    router.post('/activities/:activityid/test', auth, redirectToLogin, async (req, res, next) => {
        Simva.setActivityTest(req.params["activityid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the target of the specified activity
    router.get('/activities/:activityid/target', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivityTarget(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get all the available surveys
    router.get('/limesurvey/surveys', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSurveyList(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the languages of the specified survey
    router.get('/limesurvey/surveys/:activityid/languages', auth, redirectToLogin, async (req, res, next) => {
        try {
            let result = await SimvaAsync.getSurveyLanguages(req.params["activityid"], req.session.id);
            res.status(200).send(result);
        } catch(error) {
            next(error.response?.data || error);
        }
    });

    // Set the owner of a survey
    router.patch('/limesurvey/surveys/:activityid/owner', auth, redirectToLogin, async (req, res, next) => {
        try {
            let result = await SimvaAsync.setSurveyOwner(req.params["activityid"], req.session.id);
            res.status(200).send(result);
        } catch(error) {
            next(error.response?.data || error);
        }
    });

    // Check if the specified activity can be opened
    router.get('/activities/:activityid/openable', auth, redirectToLogin, async (req, res, next) => {
        Simva.isActivityOpenable(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Remove?
    // Open the specified activity
    router.get('/activities/:activityid/open', auth, redirectToLogin, async (req, res, next) => {
        try {
            let result = await SimvaAsync.openActivity(req.params["activityid"], req.session.id);
            res.status(200).send(result);
        } catch(error) {
            next(error.response?.data || error);
        }
    });
    
    // Get the initialized data of all participants of the specified activity 
    router.get('/activities/:activityid/initialized', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivityInitialized(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Remove?
    // Set the initialized status of the specified participant of the specified activity 
    router.post('/activities/:activityid/initialized', auth, redirectToLogin, async (req, res, next) => {
        Simva.setActivityInitialized(req.params["activityid"], req.query.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Get the progress data of all participants of the specified activity 
    router.get('/activities/:activityid/progress', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivityProgress(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Remove?
    // Set the progress status of the specified participant of the specified activity 
    router.post('/activities/:activityid/progress', auth, redirectToLogin, async (req, res, next) => {
        Simva.setActivityProgress(req.params["activityid"], req.query.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the completion data of all participants of the specified activity 
    router.get('/activities/:activityid/completion', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivityCompletion(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Set the completion status of the specified participant of the specified activity 
    router.post('/activities/:activityid/completion', auth, redirectToLogin, async (req, res, next) => {
        Simva.setActivityCompletion(req.params["activityid"], req.query.user, req.body.status, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Set the completion status for all the participants of the specified activity 
    router.post('/activities/:activityid/completion/multi', auth, redirectToLogin, async (req, res, next) => {
        Simva.setMultiActivityCompletion(req.params["activityid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the hasResult data of all participants of the specified activity 
    router.get('/activities/:activityid/hasresult', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivityHasResult(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the result data of of the specified activity 
    router.get('/activities/:activityid/result', auth, redirectToLogin, async (req, res, next) => {
        // Get the data with the specified type
        if(req.query.type) {
            // For a specific participant 
            if(req.query.users) {
                Simva.getActivityResultWithTypeForUser(req.params["activityid"], req.query.type, req.query.users, req.session.id, (error, result) => {
                    if(error) {
                        next(error.response?.data || error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            } 
            // For all participants
            else {
                Simva.getActivityResultWithType(req.params["activityid"], req.query.type, req.session.id, (error, result) => {
                    if(error) {
                        next(error.response?.data || error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        } 
        // Get the data regardless of the type
        else {
            // For a specific participant 
            if(req.query.users) {
                Simva.getActivityResultForUser(req.params["activityid"], req.query.users, req.session.id, (error, result) => {
                    if(error) {
                        next(error.response?.data || error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
            // For all participants
            else {
                Simva.getActivityResult(req.params["activityid"], req.session.id, (error, result) => {
                    if(error) {
                        next(error.response?.data || error);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        }
        
    });

    // TODO: Document / remove?
    router.get('/activities/:activityid/suspension', auth, redirectToLogin, async (req, res, next) => {
        Simva.getActivitySuspension(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Set the specified activity status for the specified participant 
    router.post('/activities/:activityid/suspension', auth, redirectToLogin, async (req, res, next) => {
        Simva.setActivitySuspension(req.params["activityid"], req.body.user, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the LRS data for the specified activity
    router.get('/activities/:activityid/lrs/statements', auth, redirectToLogin, async (req, res, next) => {
        try {
            const data = await collectLrsStatements(
                () => SimvaAsync.getActivityLRSData(req.params["activityid"], req.session.id),
                (more) => SimvaAsync.getActivityMoreLRSData(req.params["activityid"], more, req.session.id)
            );
            res.status(200).send({ data });
        } catch(error) {
            next(error.response?.data || error);
        }
    });

    // Get the LRS data for the test users of the specified activity
    router.get('/activities/:activityid/lrs_test_statements', auth, redirectToLogin, async (req, res, next) => {
        try {
            const data = await collectLrsStatements(
                () => SimvaAsync.getActivityTestLRSData(req.params["activityid"], req.session.id),
                (more) => SimvaAsync.getActivityMoreTestLRSData(req.params["activityid"], more, req.session.id)
            );
            res.status(200).send({ data });
        } catch(error) {
            next(error.response?.data || error);
        }
    });


    // GROUPS

    // Get all groups in the specified SIMLET matching the query search parameters
    router.get('/simlets/:simlet_id/groups', auth, redirectToLogin, async (req, res, next) => {
        if(req.query.use_new_generation) {
            Simva.getSimletGroupsWithVersion(req.query.use_new_generation === 'true', req.params["simlet_id"], getCleanQuery(req), req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        } else {
            Simva.getSimletGroups(req.params["simlet_id"], getCleanQuery(req), req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    // Get the amount of groups in the specified SIMLET matching the query search parameters
    router.get('/simlets/:simlet_id/groups/count', auth, redirectToLogin, async (req, res, next) => {
        if(req.query.use_new_generation) {
            Simva.getSimletGroupsWithVersionCount(req.query.use_new_generation === 'true', req.params["simlet_id"], getCleanQuery(req), req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        } else {
            Simva.getSimletGroupsCount(req.params["simlet_id"], getCleanQuery(req), req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    // Add a new group to the specified SIMLET
    router.post('/simlets/:simlet_id/groups', auth, redirectToLogin, async (req, res, next) => {
        Simva.addGroup(req.params['simlet_id'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Document / remove?
    router.post('/studies/:studyid/groups/:groupid', auth, redirectToLogin, async (req, res, next) => {
        Simva.addStudyGroup(req.params["studyid"], req.params["groupid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Import a group to the specified SIMLET
    router.post('/simlets/:simlet_id/groups/import', auth, redirectToLogin, async (req, res, next) => {
        let newgroup = JSON.parse(atob(req.body.file));
        newgroup.group_name = req.body.group_name;
        let simlet_id = req.params['simlet_id'];
        let sessionid = req.session.id;
        try {
            let group = await groupcontroler.importGroup(simlet_id, newgroup, sessionid);
            res.status(200).send(group);
        } catch(error) {
            next(error);
        }
    });
    
    // Get the specified group from the specified SIMLET
    router.get('/simlets/:simlet_id/groups/:groupid', auth, redirectToLogin, async (req, res, next) => {
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
    
    // Export the specified group from the specified SIMLET
    router.get('/simlets/:simlet_id/groups/:groupid/export', auth, redirectToLogin, async (req, res, next) => {
        let simlet_id = req.params['simlet_id'];
        let groupid = req.params['groupid'];
        let complete = req.query.complete === 'true';
        let sessionid = req.session.id;
        try {
            let group = await groupcontroler.exportGroup(simlet_id, groupid, complete, sessionid);
            res.status(200).send(group);
        } catch(error) {
            next(error);
        }
    });
    
    // Update the specified group from the specified SIMLET
    router.patch('/simlets/:simlet_id/groups/:groupid', auth, redirectToLogin, async (req, res, next) => {
        Simva.updateGroup(req.params['simlet_id'], req.params['groupid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Delete the specified group from the specified SIMLET
    router.delete('/simlets/:simlet_id/groups/:groupid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteGroup(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Document / remove?
    router.delete('/studies/:studyid/groups/:groupid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteStudyGroup(req.params["studyid"], req.params["groupid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });


    // ALLOCATOR

    // Get all the existing allocator types
    router.get('/allocatortypes', auth, redirectToLogin, async (req, res, next) => {
        Simva.getAllocatorTypes(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                logger.info("Allocator types before i18n processing:", result);
                result.forEach(element => {
                    element['description'] = req.t(`allocator.${element.allocator_type}.description`, { ns : 'groups' } );
                    element['name'] = req.t(`allocator.${element.allocator_type}.title`, { ns : 'groups' } );
                    element['type_t'] = req.t(`allocator.${element.allocator_type}.type`, { ns : 'groups' } );
                    element['type_title'] = req.t(`allocator.type.title`, { ns : 'groups' } );
                    element['test_title'] = req.t(`allocator.sessions.title`, { ns : 'groups' } );
                    element['participant_title'] = req.t(`allocator.participants.title`, { ns : 'groups' } );
                    element['add_error'] = req.t(`allocator.add.error`, { ns : 'groups' } );
                    element['add_message'] = req.t(`allocator.add.message`, { ns : 'groups' } );
                    element['add_title'] = req.t(`allocator.add.title`, { ns : 'groups' } );
                });
                res.status(200).send(result);
            }
        });
    });

    // Get the allocator for the specified SIMLET
    router.get('/studies/:studyid/allocator', auth, redirectToLogin, async (req, res, next) => {
        Simva.getAllocator(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Remove?
    // Update the allocator for the specified SIMLET
    router.patch('/studies/:studyid/allocator', auth, redirectToLogin, async (req, res, next) => {
        Simva.updateAllocator(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Allocate the specified participant of the specified group to the specified session of the specified SIMLET
    router.post('/studies/:studyid/groups/:groupid/allocate/:testid', auth, redirectToLogin, async (req, res, next) => {
        Simva.allocateToSession(req.params["studyid"], req.params["groupid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).json(result ?? {});
            }
        });
    });
    
    // Allocate the specified participant of the specified group to a random session of the specified SIMLET
    router.post('/studies/:studyid/groups/:groupid/allocate/random', auth, redirectToLogin, async (req, res, next) => {
        Simva.allocateRandomly(req.params["studyid"], req.params["groupid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).json(result ?? {});
            }
        });
    });
    
    
    // PARTICIPANTS

    // Get all the participants of the specified SIMLET
    router.get('/studies/:studyid/participants', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletParticipants(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Get the amount of participants in each group of the specified SIMLET
    router.get('/simlets/:simlet_id/groups/participants/count', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletGroupsParticipantsCount(req.params['simlet_id'], getCleanQuery(req), req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Get all the participants in the specified session of the specified SIMLET
    router.get('/studies/:studyid/tests/:testid/participants', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSessionParticipants(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // Get all the participants in the specified group of the specified SIMLET
    router.get('/simlets/:simlet_id/groups/:groupid/participants', auth, redirectToLogin, async (req, res, next) => {
        Simva.getGroupParticipants(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Get the amount of participants in the specified group of the specified SIMLET
    router.get('/simlets/:simlet_id/groups/:groupid/participants/count', auth, redirectToLogin, async (req, res, next) => {
        Simva.getGroupParticipantsCount(req.params['simlet_id'], req.params['groupid'], getCleanQuery(req), req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Add a participant to the specified group of the specified SIMLET
    router.post('/simlets/:simletid/groups/:groupid/participants/:participantid', auth, redirectToLogin, async (req, res, next) => {
        let simletid = req.params['simletid'];
        let groupid = req.params['groupid'];
        let participantid = req.params['participantid'];
        Simva.addGroupParticipant(simletid, groupid, participantid, req.session.id, (error, result) => {
            if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
    });
    
    // Delete the specified participant from the specified group of the specified SIMLET
    router.delete('/simlets/:simlet_id/groups/:groupid/participants/:participantid', auth, redirectToLogin, async (req, res, next) => {
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
    

    // USERS

    // Get all users matching the query search parameters
    router.get('/users', auth, redirectToLogin, async (req, res, next) => {
        const query = getCleanQuery(req);
        // Get user by exact username
        if (query.username) {
            Simva.getUser(query.username, req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        } 
        // Get users by matching (either partially or completely) username
        else {
            Simva.getUsers(query, req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });

    // Get the user data of the current user
    router.get('/users/me', auth, redirectToLogin, async (req, res, next) => {
        Simva.getCurrentUser(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                let name={username : result.username, user_id : result.user_id};
                if(result.isToken) {
                    name={token : result.token, user_id : result.user_id};
                }
                res.status(200).send(name);
            }
        });
    });

    // Add participants to the specified group
    router.post('/simlets/:simletid/groups/:groupid/users', auth, redirectToLogin, async (req, res, next) => {
        let simletid = req.params['simletid'];
        let groupid = req.params['groupid'];
        // Generate batch of tokens, register them, and add them to the group 
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
        } 
        // Register a user with custom username, email, password and role, and add it to the group 
        else {
            Simva.register(simletid, groupid, req.body.username, req.body.email, req.body.password, req.body.role, req.session.id, (error, result) => {
                if(error) {
                    next(error.response?.data || error);
                } else {
                    res.status(200).send(result);
                }
            });
        }
    });
    
    // TODO: Document / remove?
    router.post('/users/link', auth, redirectToLogin, async (req, res, next) => {
        Simva.linkUserAccount(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Document / remove?
    router.post('/users/events', auth, redirectToLogin, async (req, res, next) => {
        Simva.processUserEvents(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Document / remove?
    router.patch('/users/:username', auth, redirectToLogin, async (req, res, next) => {
        Simva.setRole(req.params.username, req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Document
    router.get('/users/islimesurveyadmin', auth, redirectToLogin, async (req, res, next) => {
        Simva.islimesurveyadmin(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    
    // PERMISSIONS

    // Get the permissions data for all the coordinators of the specified SIMLET
    router.get('/studies/:studyid/permissions', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletDirectPermissions(req.params["studyid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Add permissions data for a user to the specified SIMLET
    router.post('/studies/:studyid/permissions', auth, redirectToLogin, async (req, res, next) => {
        Simva.createSimletPermissions(req.params["studyid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    
    // TODO: Remove?
    // Get the permissions data for the specified user of the specified SIMLET
    router.get('/studies/:studyid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSimletPermissionsForUser(req.params["studyid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Update the permissions data for the specified user of the specified SIMLET
    router.patch('/studies/:studyid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.patchSimletPermissionsForUser(req.params["studyid"], req.params['userid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // Delete the permissions data for the specified user of the specified SIMLET
    router.delete('/studies/:studyid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteSimletPermissionsForUser(req.params["studyid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    
    // TODO: Remove?
    // Get the permissions data for all the coordinators of the specified session of the specified SIMLET
    router.get('/studies/:studyid/tests/:testid/permissions', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSessionPermissions(req.params["studyid"], req.params["testid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Add permissions data for a user to the specified session of the specified SIMLET
    router.post('/studies/:studyid/tests/:testid/permissions', auth, redirectToLogin, async (req, res, next) => {
        Simva.createSessionPermissions(req.params["studyid"], req.params["testid"], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Get the permissions data for the specified user of the specified session of the specified SIMLET
    router.get('/studies/:studyid/tests/:testid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.getSessionPermissionsForUser(req.params["studyid"], req.params["testid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Update the permissions data for the specified user of the specified session of the specified SIMLET
    router.patch('/studies/:studyid/tests/:testid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.patchSessionPermissionsForUser(req.params["studyid"], req.params["testid"], req.params['userid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Delete the permissions data for the specified user of the specified session of the specified SIMLET
    router.delete('/studies/:studyid/tests/:testid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteSessionPermissionsForUser(req.params["studyid"], req.params["testid"], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });
    

    // TODO: Remove?
    // Get the permissions data for all the coordinators of the specified group of the specified SIMLET
    router.get('/simlets/:simlet_id/groups/:groupid/permissions', auth, redirectToLogin, async (req, res, next) => {
        Simva.getGroupDirectPermissions(req.params['simlet_id'], req.params['groupid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Add permissions data for a user to the specified group of the specified SIMLET
    router.post('/simlets/:simlet_id/groups/:groupid/permissions', auth, redirectToLogin, async (req, res, next) => {
        Simva.createGroupPermissions(req.params['simlet_id'], req.params['groupid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Get the permissions data for the specified user of the specified group of the specified SIMLET
    router.get('/simlets/:simlet_id/groups/:groupid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.getGroupPermissionsForUser(req.params['simlet_id'], req.params['groupid'], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Update the permissions data for the specified user of the specified group of the specified SIMLET
    router.patch('/simlets/:simlet_id/groups/:groupid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.patchGroupPermissionsForUser(req.params['simlet_id'], req.params['groupid'], req.params['userid'], req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    // TODO: Remove?
    // Delete the permissions data for the specified user of the specified group of the specified SIMLET
    router.delete('/simlets/:simlet_id/groups/:groupid/permissions/:userid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteGroupPermissionsForUser(req.params['simlet_id'], req.params['groupid'], req.params['userid'], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });


    // TODO: Document + classify / remove?

    // Add to task list
    router.get('/tasklist', auth, redirectToLogin, async (req, res, next) => {
        Simva.addToTaskList(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/activities/:activityid/presignedurl', auth, redirectToLogin, async (req, res, next) => {
        Simva.getMinioDataUrl(req.params["activityid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    
    // TODO: Document
    // LTI

    router.get('/lti/tools', auth, redirectToLogin, async (req, res, next) => {
        Simva.getLtiTools(req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/lti/tools', auth, redirectToLogin, async (req, res, next) => {
        Simva.addLtiTool(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/lti/tools/:toolid', auth, redirectToLogin, async (req, res, next) => {
        Simva.deleteLtiTool(req.params["toolid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/lti/platforms', auth, redirectToLogin, async (req, res, next) => {
        let studyid = null;
        if(req.query.searchString) {
            studyid = JSON.parse(req.query.searchString).studyId;
        }
        Simva.getLtiPlatforms(studyid, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.post('/lti/platforms', auth, redirectToLogin, async (req, res, next) => {
        Simva.addLtiPlatform(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.delete('/lti/platforms/:platformid', auth, redirectToLogin, async (req, res, next) => {
        Simva.removePlatform(req.params["platformid"], req.session.id, (error, result) => {
            if(error) {
                next(error.response?.data || error);
            } else {
                res.status(200).send(result);
            }
        });
    });


    return router;
}