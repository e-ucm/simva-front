const Utils = require('./utils');
const config = require('../../config');
const userClientsListManager = require('./userClientsListManager');
const usertools = require('./usertools');
const logger = require('../../logger');
class Simva {
	apiurl;
	ssoUrl;
	ssoRealm;
	shlinkapikey;
	shlinkapidomain;
	shlinkapiurl;

	constructor() {
		this.apiurl= config.api.url;
		this.ssoUrl = config.sso.ssoUrl;
		this.ssoRealm = config.sso.ssoRealm;	
		this.shlinkapikey = config.shlink.apikey;
		this.shlinkapidomain = config.shlink.apihost;
		this.shlinkapiurl = config.shlink.apiurl;
	}

	// REQUEST
	post(url, req, body, sessionId, callback){
		logger.info(body, `Making POST request to ${url} for session ${sessionId}`);
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(sessionId), (error, result) => {
			if(!error) {
				Utils.post(url, req, body, callback, userClientsListManager.getJWT(sessionId));
			}
		});
		
	}

	patch(url, req, body, sessionId, callback){
		logger.info(body, `Making PATCH request to ${url} for session ${sessionId}`);
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(sessionId), (error, result) => {
			if(!error) {
				Utils.patch(url, req, body, callback, userClientsListManager.getJWT(sessionId));
			}
		});
	}

	put(url, req, body, sessionId, callback){
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(sessionId), (error, result) => {
			if(!error) {
				Utils.put(url, req, body, callback, userClientsListManager.getJWT(sessionId));
			}
		});
	}

	get(url, sessionId, callback){
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(sessionId), (error, result) => {
			if(!error) {
				Utils.get(url, callback, userClientsListManager.getJWT(sessionId));
			}
		});
	}

	delete(url, sessionId, callback){
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(sessionId), (error, result) => {
			if(!error) {
				Utils.delete(url, callback, userClientsListManager.getJWT(sessionId));
			}
		});
	}

	//SHLINK URL
	generateURL(url, tag, title, customSlug, length, callback){
		let body = {
			"longUrl": url,
			"tags": [
			  tag
			],
			//"validSince": "string",
			//"validUntil": "string",
			//"maxvisits": 0,
			"title": title,
			"crawlable": false,
			"forwardQuery": true,
			"findIfExists": true,
			"domain": `${this.shlinkapidomain}`,
			//"customSlug": null,
			//"shortCodeLength": 0
		}
		if(length) {
			body.shortCodeLength = length;
		}
		if(customSlug) {
			body.customSlug = customSlug;
		}
		
		Utils.post(`${this.shlinkapiurl}/rest/v3/short-urls`, null, null, body, callback, null, this.shlinkapikey);
	}

	//SHLINK URL
	generateURL(url, tag, title, customSlug, length, callback){
		let body = {
			"longUrl": url,
			"tags": [
			  tag
			],
			//"validSince": "string",
			//"validUntil": "string",
			//"maxvisits": 0,
			"title": title,
			"crawlable": false,
			"forwardQuery": true,
			"findIfExists": true,
			"domain": `${this.shlinkapidomain}`,
			//"customSlug": null,
			//"shortCodeLength": 0
		}
		if(length) {
			body.shortCodeLength = length;
		}
		if(customSlug) {
			body.customSlug = customSlug;
		}
		
		Utils.post(`${this.shlinkapiurl}/rest/v3/short-urls`, null, null, body, callback, null, this.shlinkapikey);
	}

	//SHLINK URL
	deleteShLink(shortCode, callback){
		Utils.delete(`${this.shlinkapiurl}/rest/v3/short-urls/${shortCode}?domain=${this.shlinkapidomain}`, callback, null, this.shlinkapikey);
	}

	// USER
	registerGeneratedUser(simlet_id, groupid, token, sessionId, callback){
		logger.info(`Registering generated user with token ${token} for group ID ${groupid} in simlet ${simlet_id}`);
		let body = {
			token: token,
			role: "student",
			isToken : true
		};
		this.post(`${this.apiurl}/simlets/${simlet_id}/groups/${groupid}/participants`, null, body, sessionId, callback);
	}

	register(simlet_id, groupid, username, email, password, role, sessionId, callback){
		let body = {
			username: username,
			email: email,
			password: password,
			role: role,
			isToken : false
		};
		this.post(`${this.apiurl}/simlets/${simlet_id}/groups/${groupid}/participants`, null, body, sessionId, callback);
	}

	getUser(username, sessionId, callback){
		this.get(`${this.apiurl}/users?username=${username}`, sessionId, callback);
	}

	getUsers(search, sessionId, callback){
		const queryString = search ? `?search=${search}` : '';
		this.get(`${this.apiurl}/users${queryString}`, sessionId, callback);
	}

	linkUserAccount(data, sessionId, callback){
		this.post(`${this.apiurl}/users/link`, null, data, sessionId, callback);
	}

	processUserEvents(data, sessionId, callback){
		this.post(`${this.apiurl}/users/events`, null, data, sessionId, callback);
	}

	setRole(body, sessionId, callback){
		this.patch(`${this.apiurl}/users/${username}`, null, null, body, sessionId, callback);
	}

	getCurrentUser(sessionId, callback){
		this.get(`${this.apiurl}/users/me`, sessionId, callback);
	}

	getMe(sessionId, callback){
		this.getCurrentUser(sessionId, callback);
	}

	islimesurveyadmin(sessionId, callback){
		this.get(`${this.apiurl}/limesurvey/isAdmin`, sessionId, callback);
	}

	// GROUPS
	addToTaskList(body, sessionId, callback){
		this.post(`${this.apiurl}/tasklist`, null, body, sessionId, callback);
	}

	// GROUPS
	getGroups(sessionId, callback){
		this.get(`${this.apiurl}/groups`, sessionId, callback);
	}

	getGroupsWithVersion(useNewGeneration, sessionId, callback){
		this.get(`${this.apiurl}/groups?use_new_generation=${useNewGeneration}`, sessionId, callback);
	}

	addGroup(simlet_id, body, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${simlet_id}/groups`, null, body, sessionId, callback);
	}

	updateGroup(simlet_id, groupId, group, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simlet_id}/groups/${groupId}`, null, group, sessionId, callback);
	}

	getGroup(simlet_id, group_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}`, sessionId, callback);
	}

	getGroupCount(simlet_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${simlet_id}/groups/count`, sessionId, callback);
	}

	getGroupSimlets(simlet_id, group_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/simlets`, sessionId, callback);
	}

	deleteGroup(simlet_id, group_id, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}`, sessionId, callback);
	}

	addGroupParticipant(simlet_id, group_id, participant_id, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/participants/${participant_id}`, null, { }, sessionId, callback);
	}

	getGroupParticipants(simlet_id, group_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/participants`, null, sessionId, callback);
	}
	
	deleteGroupParticipant(simlet_id, group_id, participant_id, keycloakDelete, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/participants/${participant_id}?keycloakDelete=${keycloakDelete}`, sessionId, callback);
	}

	getGroupDirectPermissions(simlet_id, group_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/permissions`, sessionId, callback);
	}

	createGroupPermissions(simlet_id, group_id, permissions, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/permissions`, null, permissions, sessionId, callback);
	}

	getGroupPermissionsForUser(simlet_id, group_id, user_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/permissions/${user_id}`, sessionId, callback);
	}

	patchGroupPermissionsForUser(simlet_id, group_id, user_id, permissions, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/permissions/${user_id}`, null, permissions, sessionId, callback);
	}

	deleteGroupPermissionsForUser(simlet_id, group_id, user_id, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simlet_id}/groups/${group_id}/permissions/${user_id}`, sessionId, callback);
	}

	// STUDIES

	getStudies(sessionId, callback){
		this.get(`${this.apiurl}/simlets`, sessionId, callback);
	}

	getStudyDirectPermissions(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/permissions`, sessionId, callback);
	}

	createStudyPermissions(study_id, permissions, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/permissions`, null, permissions, sessionId, callback);
	}

	getStudyPermissionsForUser(study_id, user_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/permissions/${user_id}`, sessionId, callback);
	}

	patchStudyPermissionsForUser(study_id, user_id, permissions, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${study_id}/permissions/${user_id}`, null, permissions, sessionId, callback);
	}

	deleteStudyPermissionsForUser(study_id, user_id, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${study_id}/permissions/${user_id}`, sessionId, callback);
	}

	addStudy(body, sessionId, callback){
		this.post(`${this.apiurl}/simlets`, null, body, sessionId, callback);
	}

	addTestToStudy(study_id, body, sessionId, callback){
	   this.post(`${this.apiurl}/simlets/${study_id}/sessions`, null, body, sessionId, callback);
	}

	duplicateTestFromStudy(study_id, body, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/sessions`, null, body, sessionId, callback);
	}

	getStudy(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}`, sessionId, callback);
	}

	getStudySessions(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions`, sessionId, callback);
	}

	updateStudy(studyId, study, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${studyId}`, null, study, sessionId, callback);
	}

	updateTest(studyId, testId, test, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${studyId}/sessions/${testId}`, null, test, sessionId, callback);
	}

	deleteTest(studyId, testId, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${studyId}/sessions/${testId}`, sessionId, callback);
	}

	deleteStudy(study_id, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${study_id}`, sessionId, callback);
	}

	getAllocator(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/allocator`, sessionId, callback);
	}

	updateAllocator(study_id, allocator, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${study_id}/allocator`, null, allocator, sessionId, callback);
	}

	getStudyTests(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions`, sessionId, callback);
	}

	exportStudyConfig(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/export`, sessionId, callback);
	}

	importStudyConfig(newStudy, sessionId, callback){
		this.post(`${this.apiurl}/simlets/import`, null, newStudy, sessionId, callback);
	}

	getStudyTest(study_id,test_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}`, sessionId, callback);
	}

	getStudyGroups(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/groups`, sessionId, callback);
	}

	addStudyGroup(study_id, group_id, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/groups/${group_id}`, null, {}, sessionId, callback);
	}

	deleteStudyGroup(study_id, group_id, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${study_id}/groups/${group_id}`, sessionId, callback);
	}

	getTestActivities(study_id, test_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/activities`, sessionId, callback);
	}

	getStudyParticipants(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/participants`, sessionId, callback);
	}

	getSessionParticipants(study_id, test_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/participants`, sessionId, callback);
	}


	getStudySchedule(study_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/schedule`, sessionId, callback);
	}

	activateSession(study_id, test_id, body, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/activate`, null, body, sessionId, callback);
	}

	allocateToSession(study_id, group_id, test_id, body, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/groups/${group_id}/allocate/${test_id}`, null, body, sessionId, callback);
	}

	allocateRandomly(study_id, group_id, data, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/groups/${group_id}/allocate/random`, null, data, sessionId, callback);
	}

	getSessionPermissions(study_id, test_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/permissions`, sessionId, callback);
	}

	createSessionPermissions(study_id, test_id, permissions, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/permissions`, null, permissions, sessionId, callback);
	}

	getSessionPermissionsForUser(study_id, test_id, user_id, sessionId, callback){
		this.get(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/permissions/${user_id}`, sessionId, callback);
	}

	patchSessionPermissionsForUser(study_id, test_id, user_id, permissions, sessionId, callback){
		this.patch(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/permissions/${user_id}`, null, permissions, sessionId, callback);
	}

	deleteSessionPermissionsForUser(study_id, test_id, user_id, sessionId, callback){
		this.delete(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/permissions/${user_id}`, sessionId, callback);
	}

	// Activities

	addActivityToTest(study_id, test_id, req, activity, sessionId, callback){
		this.post(`${this.apiurl}/simlets/${study_id}/sessions/${test_id}/activities`, req, activity, sessionId, callback);
	}
	
	updateActivity(activity_id, req, activity, sessionId, callback){
		this.patch(`${this.apiurl}/activities/${activity_id}`, req, activity, sessionId, callback);
	}

	getActivity(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}`, sessionId, callback);
	}

	exportActivity(activity_id, complete, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/export?complete=${complete}`, sessionId, callback);
	}

	setSurveyOwner(survey_id, sessionId, callback){
		this.patch(`${this.apiurl}/limesurvey/surveys/${survey_id}/owner`, null, {}, sessionId, callback);
	}

	getSurveyList(sessionId, callback){
		this.get(`${this.apiurl}/limesurvey/surveys`, sessionId, callback);
	}

	getSurveyLanguages(survey_id, sessionId, callback){
		this.get(`${this.apiurl}/limesurvey/surveys/${survey_id}/languages`, sessionId, callback);
	}

	getActivityProgress(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/progress`, sessionId, callback);
	}

	setActivityProgress(activity_id, user, status, sessionId, callback){
		const userQuery = user ? `?user=${user}` : '';
		this.post(`${this.apiurl}/activities/${activity_id}/progress${userQuery}`, null, { status: status }, sessionId, callback);
	}

	openActivity(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/open`, sessionId, callback);
	}

	getActivityInitialized(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/initialized`, sessionId, callback);
	}

	setActivityInitialized(activity_id, user, status, sessionId, callback){
		this.post(`${this.apiurl}/activities/${activity_id}/initialized?user=${user}`, null, { status: status }, sessionId, callback);
	}

	getActivityCompletion(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/completion`, sessionId, callback);
	}

	setActivityCompletion(activity_id, user, status, sessionId, callback){
		this.post(`${this.apiurl}/activities/${activity_id}/completion?user=${user}`, null, { status: status }, sessionId, callback);
	}
	
	setMultiActivityCompletion(activity_id, body, sessionId, callback) {
		this.post(`${this.apiurl}/activities/${activity_id}/completion/multi`, null, body, sessionId, callback);
	}

	getActivitySuspension(activity_id, sessionId, callback) {
		this.get(`${this.apiurl}/activities/${activity_id}/suspension`, sessionId, callback);
	}

	setActivitySuspension(activity_id, body, sessionId, callback) {
		this.post(`${this.apiurl}/activities/${activity_id}/suspension`, null, body, sessionId, callback);
	}

	getActivityResultForUser(activity_id, student, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?users=${student}&type=backup`, sessionId, callback);
	}

	getActivityResultWithTypeForUser (activity_id, type, student, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?users=${student}&type=backup&all=${type}`, sessionId, callback);
	}

	getActivityResult(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?type=backup`, sessionId, callback);
	}

	getActivityResultWithType(activity_id, type, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?all=${type}`, sessionId, callback);
	}

	getActivityHasResult(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/hasresult`, sessionId, callback);
	}

	hasActivityResult(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/hasresult`, sessionId, callback);
	}

	getActivityTarget(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/target`, sessionId, callback);
	}

	isActivityOpenable(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/openable`, sessionId, callback);
	}

	getMinioDataUrl(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/presignedurl`, sessionId, callback);
	}

	setActivityTest(activity_id, payload, sessionId, callback){
		this.post(`${this.apiurl}/activities/${activity_id}/test`, null, payload, sessionId, callback);
	}

	deleteActivity(activity_id, sessionId, callback){
		this.delete(`${this.apiurl}/activities/${activity_id}`, sessionId, callback);
	}

	getActivityTypes(sessionId, callback){
		this.get(`${this.apiurl}/activitytypes`, sessionId, callback);
	}

	getAllocatorTypes(sessionId, callback){
		this.get(`${this.apiurl}/allocatortypes`, sessionId, callback);
	}

	// LTI

	getLtiTools(sessionId, callback){
		this.get(`${this.apiurl}/lti/tools`, sessionId, callback);
	}

	addLtiTool(tool, sessionId, callback){
		this.post(`${this.apiurl}/lti/tools`, null, tool, sessionId, callback);
	}

	deleteLtiTool(tool, sessionId, callback){
		this.delete(`${this.apiurl}/lti/tools/${tool}`, sessionId, callback);
	}

	getLtiPlatforms(study, sessionId, callback){
		let query = '';
		if(study){
			query = '?searchString=' + encodeURI(`{"studyId":"${study}"}`);
		}

		this.get(`${this.apiurl}/lti/platforms${query}`, sessionId, callback);
	}

	addLtiPlatform(platform, sessionId, callback){
		this.post(`${this.apiurl}/lti/platforms`, null, platform, sessionId, callback);
	}

	removePlatform(platform_id, sessionId, callback) {
		this.delete(`${this.apiurl}/lti/platforms/${platform_id}`, sessionId, callback);
	}
}

module.exports = new Simva();