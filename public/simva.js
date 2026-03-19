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
	register: function(simlet_id, groupid, username, email, password, role, callback){
		let body = {
			username: username,
			email: email,
			password: password,
			role: role
		};
		Utils.post(`/bff/simlets/${simlet_id}/groups/${groupid}/users`, body, callback);
	},

	// USER
	generateAndRegister: function(simlet_id, groupid, algorithm, length, batchLength, callback){
		let body = {
			algorithm: algorithm,
			length: Number(length),
			batchLength: Number(batchLength)
		};
		Utils.post(`/bff/simlets/${simlet_id}/groups/${groupid}/users`, body, callback);
	},

	setRole: function(username, role, callback){
		let body = { username: username, role: role };
		Utils.patch(`/bff/users/${username}`, body, callback);
	},

	getUsers: function(query, callback){
		const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
		Utils.get(`/bff/users${queryString}`, callback);
	},

	linkUserAccount: function(data, callback){
		Utils.post(`/bff/users/link`, data, callback);
	},

	processUserEvents: function(data, callback){
		Utils.post(`/bff/users/events`, data, callback);
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

	addGroup: function(simlet_id, name, use_new_generation, group_sandbox, callback){
		let body = { group_name: name };
		if(use_new_generation) {
			body.use_new_generation = true;
		} else {
			body.use_new_generation = false;
		}
		if(group_sandbox) {
			body.group_sandbox = true;
		} else {
			body.group_sandbox = false;
		}
		Utils.post(`/bff/simlets/${simlet_id}/groups`, body, callback);
	},

	updateGroup: function(simlet_id, groupId, group, callback){
		Utils.patch(`/bff/simlets/${simlet_id}/groups/${groupId}`, group, callback);
	},

	getGroup: function(simlet_id, group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}`, callback);
	},

	getGroupCount: function(simlet_id,callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/count`, callback);
	},

	getGroupSimlets: function(simlet_id,group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/simlets`, callback);
	},

	getGroupPermissions: function(simlet_id,group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/permissions`, callback);
	},

	createGroupPermissions: function(simlet_id,group_id, permissions, callback){
		Utils.post(`/bff/simlets/${simlet_id}/groups/${group_id}/permissions`, permissions, callback);
	},

	getGroupPermissionsForUser: function(simlet_id,group_id, user_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/permissions/${user_id}`, callback);
	},

	patchGroupPermissionsForUser: function(simlet_id, group_id, user_id, permissions, callback){
		Utils.patch(`/bff/simlets/${simlet_id}/groups/${group_id}/permissions/${user_id}`, permissions, callback);
	},

	deleteGroupPermissionsForUser: function(simlet_id,group_id, user_id, callback){
		Utils.delete(`/bff/simlets/${simlet_id}/groups/${group_id}/permissions/${user_id}`, callback);
	},

	deleteGroup: function(simlet_id,group_id, callback){
		Utils.delete(`/bff/simlets/${simlet_id}/groups/${group_id}`, callback);
	},

	addGroupParticipant: function(simlet_id, group_id, participant_id, callback){
		Utils.post(`/bff/simlets/${simlet_id}/groups/${group_id}/participants/${participant_id}`, { }, callback);
	},

	getGroupParticipants: function(simlet_id, group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/participants`, callback);
	},

	deleteGroupParticipants: function(simlet_id, group_id, participant_id, keycloakDelete, callback){
		Utils.delete(`/bff/simlets/${simlet_id}/groups/${group_id}/participants/${participant_id}?keycloakDelete=${keycloakDelete}`, callback);
	},

	// STUDIES

	getStudies: function(callback){
		Utils.get(`/bff/studies`, callback);
	},

	addStudy: function(name, description, callback){
		let body = { simlet_name: name, simlet_description : description };
		Utils.post(`/bff/studies`, body, callback);
	},

	   addTestToStudy: function(study_id, name, description, canBeManuallyActivated, callback){
		   let body = { session_name: name, session_description: description, session_can_be_manually_activated: canBeManuallyActivated };
		   Utils.post(`/bff/studies/${study_id}/tests`, body, callback);
	},

	getStudyEventsPresignedUrl: function(study_id, callback){
		Utils.get(`/simlets/${study_id}/events/getPresignedUrl`, callback);
	},

	duplicateTestFromStudy: function(study_id, name, testId, callback){
		let body = { session_name: name, from : testId };
		Utils.post(`/bff/studies/${study_id}/tests`, body, callback);
	},

	getStudy: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}`, callback);
	},

	updateStudy: function(studyId, study, callback){
		Utils.patch(`/bff/studies/${studyId}`, study, callback);
	},

	updateTest: function(studyId, sessionId, test, callback){
		Utils.patch(`/bff/studies/${studyId}/tests/${sessionId}`, test, callback);
	},

	updateActivity: function(activityId, activity, callback){
		Utils.patch(`/bff/activities/${activityId}`, activity, callback);
	},

	deleteStudy: function(study_id, callback){
		Utils.delete(`/bff/studies/${study_id}`, callback);
	},

	getAllocator: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/allocator`, callback);
	},

	getStudyPermissions: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/permissions`, callback);
	},

	createStudyPermissions: function(study_id, permissions, callback){
		Utils.post(`/bff/studies/${study_id}/permissions`, permissions, callback);
	},

	getStudyPermissionsForUser: function(study_id, user_id, callback){
		Utils.get(`/bff/studies/${study_id}/permissions/${user_id}`, callback);
	},

	patchStudyPermissionsForUser: function(study_id, user_id, permissions, callback){
		Utils.patch(`/bff/studies/${study_id}/permissions/${user_id}`, permissions, callback);
	},

	deleteStudyPermissionsForUser: function(study_id, user_id, callback){
		Utils.delete(`/bff/studies/${study_id}/permissions/${user_id}`, callback);
	},

	updateAllocator: function(study_id, allocator, callback){
		Utils.patch(`/bff/studies/${study_id}/allocator`, allocator, callback);
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

	deleteTest: function(study_id, test_id, callback){
		Utils.delete(`/bff/studies/${study_id}/tests/${test_id}`, callback);
	},

	getSessionParticipants: function(study_id, test_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}/participants`, callback);
	},

	allocateToSession: function(study_id, group_id, test_id, participant_id, callback){
		Utils.post(`/bff/studies/${study_id}/groups/${group_id}/allocate/${test_id}`, participant_id ? { participant_id: participant_id } : {}, callback);
	},

	allocateRandomly: function(study_id, group_id, data, callback){
		Utils.post(`/bff/studies/${study_id}/groups/${group_id}/allocate/random`, data, callback);
	},

	getSessionPermissions: function(study_id, test_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}/permissions`, callback);
	},

	createSessionPermissions: function(study_id, test_id, permissions, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/permissions`, permissions, callback);
	},

	getSessionPermissionsForUser: function(study_id, test_id, user_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}/permissions/${user_id}`, callback);
	},

	patchSessionPermissionsForUser: function(study_id, test_id, user_id, permissions, callback){
		Utils.patch(`/bff/studies/${study_id}/tests/${test_id}/permissions/${user_id}`, permissions, callback);
	},

	deleteSessionPermissionsForUser: function(study_id, test_id, user_id, callback){
		Utils.delete(`/bff/studies/${study_id}/tests/${test_id}/permissions/${user_id}`, callback);
	},

	getStudyGroups: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/groups`, callback);
	},

	addStudyGroup: function(study_id, group_id, callback){
		Utils.post(`/bff/studies/${study_id}/groups/${group_id}`, {}, callback);
	},

	deleteStudyGroup: function(study_id, group_id, callback){
		Utils.delete(`/bff/studies/${study_id}/groups/${group_id}`, callback);
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
		Utils.get(`/simlets/${study_id}/schedule/events/getPresignedUrl`, callback);
	},

	getGroupEventsPresignedUrl: function(simlet_id, group_id, callback) {
		Utils.get(`/groups/${simlet_id}/${group_id}/events/getPresignedUrl`, callback);
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

	exportActivity: function(activity_id, complete, callback){
		Utils.get(`/bff/activities/${activity_id}/export?complete=${complete}`, callback);
	},

	setSurveyOwner: function(survey_id, callback){
		Utils.patch(`/bff/limesurvey/surveys/${survey_id}/owner`, {}, callback);
	},

	getSurveyList: function(callback){
		Utils.get(`/bff/limesurvey/surveys`, callback);
	},

	getSurveyLanguages: function(survey_id, callback){
		Utils.get(`/bff/limesurvey/surveys/${survey_id}/languages`, callback);
	},

	getActivityProgress: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/progress`, callback);
	},

	setActivityProgress: function(activity_id, user, status, callback){
		const userQuery = user ? `?user=${user}` : '';
		Utils.post(`/bff/activities/${activity_id}/progress${userQuery}`, { status: status }, callback);
	},

	openActivity: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/open`, callback);
	},

	getActivityInitialized: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/initialized`, callback);
	},

	setActivityInitialized: function(activity_id, user, status, callback){
		Utils.post(`/bff/activities/${activity_id}/initialized?user=${user}`, { status: status }, callback);
	},

	getActivityCompletion: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/completion`, callback);
	},

	setActivityCompletion: function(activity_id, user, status, callback){
		Utils.post(`/bff/activities/${activity_id}/completion?user=${user}`, { status: status }, callback);
	},

	setMultiActivityCompletion: function(activity_id, status, callback){
		Utils.post(`/bff/activities/${activity_id}/completion/multi`, { status: status }, callback);
	},
	
	setActivitySuspend: function(activity_id, user, status, reason, callback){
		Utils.post(`/bff/activities/${activity_id}/suspension`, { user : user , status : status, reason : reason }, callback);
	},

	getActivitySuspension: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/suspension`, callback);
	},

	setActivitySuspension: function(activity_id, user, status, reason, callback){
		Utils.post(`/bff/activities/${activity_id}/suspension`, { user : user , status : status, reason : reason }, callback);
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

	setActivityTest: function(activity_id, payload, callback){
		Utils.post(`/bff/activities/${activity_id}/test`, payload, callback);
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