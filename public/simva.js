var Simva = {
	apiurl: null,
	jwt: null,
	expiration: null,
	ssoUrl:null,
	ssoRealm:null,
	url:null,
	tmonUrl:null,
	tmonFile:null,

	setSSOURL: function(ssoUrl){
		this.ssoUrl = ssoUrl;
	},

	setSSOREALM: function(ssoRealm){
		this.ssoRealm = ssoRealm;
	},

	setAPIURL: function(apiUrl){
		this.apiurl = apiUrl;
	},

	setURL: function(url){
		this.url = url;
	},

	setTMonURL: function(tmonUrl){
		this.tmonUrl = tmonUrl;
	},

	setTMonFile: function(tmonFile){
		this.tmonFile = tmonFile;
	},

	refreshAuth : function(callback){
		Utils.get(`/users/refresh_auth`, callback);
	},

	getLanguage: function(callback){
		Utils.get(`/bff/languages`, callback);
	},

	updateLanguage: function(languageid, callback){
		Utils.get(`/bff/languages/${languageid}`, callback);
	},


	//SHLINK URL
	generateShlinkURL(url, tag, title, customSlug, length, callback){
		let body = {
			url: url,
			tag: tag,
			title: title,
			customSlug: customSlug, 
			length:length
		}
		
		Utils.post(`/bff/shlink`, body, callback);
	},

	deleteShLink(shortCode, callback){
		Utils.delete(`/bff/shlink/${shortCode}`, callback);
	},

	// USER
	register: function(groupid, username, email, password, role, callback){
		let body = {
			username: username,
			email: email,
			password: password,
			role: role
		};
		Utils.post(`/bff/groups/${groupid}/users`, body, callback);
	},

	// USER
	generateAndRegister: function(groupid, algorithm, length, batchLength, callback){
		let body = {
			algorithm: algorithm,
			length: Number(length),
			batchLength: Number(batchLength)
		};
		Utils.post(`/bff/groups/${groupid}/users`, body, callback);
	},

	setRole: function(username, role, callback){
		let body = { username: username, role: role };
		Utils.patch(`/bff/users/${username}`, body, callback);
	},

	getCurrentUser: function(callback){
		Utils.get(`/bff/users/me`, callback);
	},

	islimesurveyadmin: function(callback){
		Utils.get(`/bff/users/islimesurveyadmin`, callback);
	},

	// GROUPS
	getGroups: function(use_new_generation, callback){
		Utils.get(`/bff/groups?use_new_generation=${use_new_generation}`, callback);
	},

	addGroup: function(name, use_new_generation, callback){
		let body = { group_name: name };
		if(use_new_generation) {
			body.use_new_generation = true;
		} else {
			body.use_new_generation = false;
		}
		Utils.post(`/bff/groups`, body, callback);
	},

	updateGroup: function(group, callback){
		Utils.put(`/bff/groups/${group._id}`, group, callback);
	},

	getGroup: function(group_id, callback){
		Utils.get(`/bff/groups/${group_id}`, callback);
	},

	deleteGroup: function(group_id, callback){
		Utils.delete(`/bff/groups/${group_id}`, callback);
	},

	getGroupParticipants: function(group_id, callback){
		Utils.get(`/bff/groups/${group_id}/participants`, callback);
	},

	deleteGroupParticipants: function(group_id, participant_id, keycloakDelete, callback){
		Utils.delete(`/bff/groups/${group_id}/participants/${participant_id}?keycloakDelete=${keycloakDelete}`, callback);
	},

	// STUDIES

	getStudies: function(callback){
		Utils.get(`/bff/studies`, callback);
	},

	addStudy: function(name, callback){
		let body = { simlet_name: name };
		Utils.post(`/bff/studies`, body, callback);
	},

	addTestToStudy: function(study_id, name, callback){
		let body = { session_name: name };
		Utils.post(`/bff/studies/${study_id}/tests`, body, callback);
	},

	getStudyEventsPresignedUrl: function(study_id, callback){
		Utils.get(`/studies/${study_id}/events/getPresignedUrl`, callback);
	},

	duplicateTestFromStudy: function(study_id, name, testId, callback){
		let body = { session_name: name, from : testId };
		Utils.post(`/bff/studies/${study_id}/tests`, body, callback);
	},

	getStudy: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}`, callback);
	},

	updateStudy: function(study, callback){
		Utils.put(`/bff/studies/${study._id}`, study, callback);
	},

	updateTest: function(studyId, test, callback){
		Utils.patch(`/bff/studies/${studyId}/tests/${test.id}`, test, callback);
	},

	updateActivity: function(activity, callback){
		Utils.patch(`/bff/activities/${activity.id}`, activity, callback);
	},

	deleteStudy: function(study_id, callback){
		Utils.delete(`/bff/studies/${study_id}`, callback);
	},

	getAllocator: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/allocator`, callback);
	},

	updateAllocator: function(study_id, allocator, callback){
		Utils.put(`/bff/studies/${study_id}/allocator`, allocator, callback);
	},

	getStudyTests: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests`, callback);
	},

	exportStudyConfig: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/export`, callback);
	},

	importStudyConfig: function(newStudy, callback){
		Utils.post(`/bff/studies/import`, newStudy, callback);
	},

	getStudyTest: function(study_id,test_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}`, callback);
	},

	getStudyGroups: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/groups`, callback);
	},

	getTestActivities: function(study_id, test_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}/activities`, callback);
	},

	getStudyParticipants: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/participants`, callback);
	},

	getStudySchedule: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/schedule`, callback);
	},

	
	getScheduleEventsPresignedUrl: function(study_id, callback){
		Utils.get(`/studies/${study_id}/schedule/events/getPresignedUrl`, callback);
	},

	getGroupEventsPresignedUrl: function(group_id, callback) {
		Utils.get(`/groups/${group_id}/events/getPresignedUrl`, callback);
	},

	getEventsPresignedUrl: function(callback){
		Utils.get(`/events/getPresignedUrl`, callback);
	},

	activateSession(study_id, test_id, activate, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/activate`, { activate }, callback);
	},

	// Activities

	addActivityToTest: function(study_id, test_id, activity, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/activities`, activity, callback);
	},

	getActivity: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}`, callback);
	},

	setSurveyOwner: function(activity_id, callback){
		Utils.patch(`/bff/activities/${activity_id}/surveyowner`, {}, callback);
	},

	getSurveyList: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/usersurveylist`, callback);
	},


	getActivityProgress: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/progress`, callback);
	},

	getActivityCompletion: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/completion`, callback);
	},

	setActivityCompletion: function(activity_id, user, status, callback){
		Utils.post(`/bff/activities/${activity_id}/completion?user=${user}`, { status: status }, callback);
	},

	setMultiActivityCompletion: function(activity_id, status, callback){
		Utils.post(`/bff/activities/${activity_id}/multicompletion`, { status: status }, callback);
	},
	
	setActivitySuspend: function(activity_id, user, status, reason, callback){
		Utils.post(`/bff/activities/${activity_id}/suspend`, { user : user , status : status, reason : reason }, callback);
	},

	getActivityResultForUser : function(activity_id, student, callback){
		Utils.get(`/bff/activities/${activity_id}/result?users=${student}`, callback);
	},

	getActivityResultWithTypeForUser : function(activity_id, type, student, callback){
		Utils.get(`/bff/activities/${activity_id}/result?users=${student}&type=${type}`, callback);
	},

	getActivityResult: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/result`, callback);
	},

	getActivityResultWithType: function(activity_id, type, callback){
		Utils.get(`/bff/activities/${activity_id}/result?type=${type}`, callback);
	},

	getActivityHasResult: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/hasresult`, callback);
	},

	hasActivityResult: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/hasresult`, callback);
	},

	getActivityTarget: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/target`, callback);
	},

	isActivityOpenable: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/openable`, callback);
	},

	getMinioDataUrl: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/presignedurl`, callback);
	},

	deleteActivity: function(activity_id, callback){
		Utils.delete(`/bff/activities/${activity_id}`, callback);
	},

	getActivityTypes: function(callback){
		Utils.get(`/bff/activitytypes`, callback);
	},

	getAllocatorTypes: function(callback){
		Utils.get(`/bff/allocatortypes`, callback);
	},

	// LTI

	getLtiTools: function(callback){
		Utils.get(`/bff/lti/tools`, callback);
	},

	addLtiTool: function(tool, callback){
		Utils.post(`/bff/lti/tools`, tool, callback);
	},

	deleteLtiTool: function(tool, callback){
		Utils.delete(`/bff/lti/tools/${tool}`, callback);
	},

	getLtiPlatforms: function(study, callback){
		let query = '';
		if(study){
			query = '?searchString=' + encodeURI(`{"studyId":"${study}"}`);
		}

		Utils.get(`/bff/lti/platforms${query}`, callback);
	},

	addLtiPlatform: function(platform, callback){
		Utils.post(`/bff/lti/platforms`, platform, callback);
	},

	removePlatform: function(platform_id, callback){
		Utils.delete(`/bff/lti/platforms/${platform_id}`, callback);
	}
}