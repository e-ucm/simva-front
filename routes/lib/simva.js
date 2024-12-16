const Utils = require('./utils');
const config = require('../../config');
const userClientsListManager = require('./userClientsListManager');

class Simva {
	apiurl;
	ssoUrl;
	ssoRealm;

	constructor() {
		this.apiurl= config.api.url;
		this.ssoUrl = config.sso.ssoUrl;
		this.ssoRealm = config.sso.ssoRealm;	
	}

	getJWT(sessionId) {
		return userClientsListManager.getJWT(sessionId);	
	}

	// REQUEST
	post(url, body, sessionId, callback){
		Utils.post(url, body, callback, this.getJWT(sessionId));
	}

	patch(url, body, sessionId, callback){
		Utils.patch(url, body, callback, this.getJWT(sessionId));
	}

	put(url, body, sessionId, callback){
		Utils.put(url, body, callback, this.getJWT(sessionId));
	}

	get(url, sessionId, callback){
		Utils.get(url, callback, this.getJWT(sessionId));
	}

	delete(url, sessionId, callback){
		Utils.delete(url, callback, this.getJWT(sessionId));
	}

	// USER
	register(groupid, username, email, password, role, isToken, useNewGeneration, sessionId, callback){
		let body = {
			groupid : groupid,
			username: username,
			email: email,
			password: password,
			role: role,
			isToken : isToken,
			useNewGeneration : useNewGeneration
		};
		this.post(`${this.apiurl}/users`, body, sessionId, callback);
	}

	setRole(username, role, sessionId, callback){
		let body = { username: username, role: role };
		this.patch(`${this.apiurl}/users/${username}`, body, sessionId, callback);
	}

	getCurrentUser(sessionId, callback){
		this.get(`${this.apiurl}/users/me`, sessionId, callback);
	}

	// GROUPS
	getGroups(sessionId, callback){
		this.get(`${this.apiurl}/groups`, sessionId, callback);
	}

	addGroup(name, newversion, sessionId, callback){
		let body = { name: name	 };
		if(newversion) {
			body.version = 1;
		} else {
			body.version = 0;
		}
		this.post(`${this.apiurl}/groups`, body, sessionId, callback);
	}

	updateGroup(group, sessionId, callback){
		this.put(`${this.apiurl}/groups/${group._id}`, group, sessionId, callback);
	}

	getGroup(group_id, sessionId, callback){
		this.get(`${this.apiurl}/groups/${group_id}`, sessionId, callback);
	}

	deleteGroup(group_id, sessionId, callback){
		this.delete(`${this.apiurl}/groups/${group_id}`, sessionId, callback);
	}

	getGroupParticipants(group_id, sessionId, callback){
		this.get(`${this.apiurl}/groups/${group_id}/participants`, sessionId, callback);
	}

	// STUDIES

	getStudies(sessionId, callback){
		this.get(`${this.apiurl}/studies`, sessionId, callback);
	}

	addStudy(name, sessionId, callback){
		let body = { name: name };
		this.post(`${this.apiurl}/studies/`, body, sessionId, callback);
	}

	addTestToStudy(study_id, name, sessionId, callback){
		let body = { name: name };
		this.post(`${this.apiurl}/studies/${study_id}/tests`, body, sessionId, callback);
	}

	duplicateTestFromStudy(study_id, name, testId, sessionId, callback){
		let body = { name: name, from : testId };
		this.post(`${this.apiurl}/studies/${study_id}/tests`, body, sessionId, callback);
	}

	getStudy(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}`, sessionId, callback);
	}

	updateStudy(study, sessionId, callback){
		this.put(`${this.apiurl}/studies/${study._id}`, study, sessionId, callback);
	}

	updateTest(studyId, test, sessionId, callback){
		this.patch(`${this.apiurl}/studies/${studyId}/tests/${test.id}`, test, sessionId, callback);
	}

	deleteStudy(study_id, sessionId, callback){
		this.delete(`${this.apiurl}/studies/${study_id}`, sessionId, callback);
	}

	getAllocator(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/allocator`, sessionId, callback);
	}

	updateAllocator(study_id, allocator, sessionId, callback){
		this.put(`${this.apiurl}/studies/${study_id}/allocator`, allocator, sessionId, callback);
	}

	getStudyTests(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/tests`, sessionId, callback);
	}

	exportStudyConfig(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/export`, sessionId, callback);
	}

	importStudyConfig(newStudy, sessionId, callback){
		this.post(`${this.apiurl}/studies/import`, newStudy, sessionId, callback);
	}

	getStudyTest(study_id,test_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/tests/${test_id}`, sessionId, callback);
	}

	getStudyGroups(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/groups`, sessionId, callback);
	}

	getTestActivities(study_id, test_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/tests/${test_id}/activities`, sessionId, callback);
	}

	getStudyParticipants(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/participants`, sessionId, callback);
	}

	getStudySchedule(study_id, sessionId, callback){
		this.get(`${this.apiurl}/studies/${study_id}/schedule`, sessionId, callback);
	}

	// Activities

	addActivityToTest(study_id, test_id, activity, sessionId, callback){
		this.post(`${this.apiurl}/studies/${study_id}/tests/${test_id}/activities`, activity, sessionId, callback);
	}
	
	updateActivity(activity, sessionId, callback){
		this.patch(`${this.apiurl}/activities/${activity.id}`, activity, sessionId, callback);
	}

	getActivity(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}`, sessionId, callback);
	}

	setSurveyOwner(activity_id, sessionId, callback){
		this.patch(`${this.apiurl}/activities/${activity_id}/surveyowner`, {}, sessionId, callback);
	}

	getSurveyList(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/usersurveylist`, sessionId, callback);
	}


	getActivityProgress(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/progress`, sessionId, callback);
	}

	getActivityCompletion(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/completion`, sessionId, callback);
	}

	setActivityCompletion(activity_id, user, status, sessionId, callback){
		this.post(`${this.apiurl}/activities/${activity_id}/completion?user=${user}`, { status: status }, sessionId, callback);
	}

	getActivityResultForUser (activity_id, student, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?users=${student}`, sessionId, callback);
	}

	getActivityResultWithTypeForUser (activity_id, type, student, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?users=${student}&type=${type}`, sessionId, callback);
	}

	getActivityResult(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result`, sessionId, callback);
	}

	getActivityResultWithType(activity_id, type, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/result?type=${type}`, sessionId, callback);
	}

	getActivityHasResult(activity_id, sessionId, callback){
		this.get(`${this.apiurl}/activities/${activity_id}/hasresult`, sessionId, callback);
	}
	
	downloadActivityResult(activity_id, sessionId, callback) {
		this.get(`${this.apiurl}/activities/${activity_id}/result?token=${this.getJWT(sessionId)}`, sessionId, callback);
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
		this.post(`${this.apiurl}/lti/tools`, tool, sessionId, callback);
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
		this.post(`${this.apiurl}/lti/platforms`, platform, sessionId, callback);
	}

	removePlatform(platform_id, sessionId, callback) {
		this.delete(`${this.apiurl}/lti/platforms/${platform_id}`, sessionId, callback);
	}
}

module.exports = new Simva();