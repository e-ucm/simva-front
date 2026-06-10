const getQueryString = function(query) {
	let queryString = "";

	// Filter out empty strings, null, and undefined values
	const cleanQuery = Object.fromEntries(
		Object.entries(query).filter(([_, value]) => 
			value !== '' && value != null
		)
	);
	queryString = Object.keys(cleanQuery).length > 0 ? `?${new URLSearchParams(cleanQuery).toString()}` : '';
	return queryString;
}

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

	generateShlinkURL(simlet_id, customSlug, length, callback){
		let body = {
			customSlug: customSlug, 
			length:length
		};
		Utils.post(`/bff/simlets/${simlet_id}/shlink`, body, callback);
	},

	getShLink(simlet_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/shlink`, callback);
	},

	updateShLink(simlet_id, customSlug, length, callback){
		let body = {
			customSlug: customSlug, 
			length:length
		};
		Utils.patch(`/bff/simlets/${simlet_id}/shlink`, body, callback);
	},	

	deleteShLink(simlet_id, callback){
		Utils.delete(`/bff/simlets/${simlet_id}/shlink`, callback);
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

	register: function(simlet_id, groupid, username, email, password, role, callback){
		let body = {
			username: username,
			email: email,
			password: password,
			role: role
		};
		Utils.post(`/bff/simlets/${simlet_id}/groups/${groupid}/users`, body, callback);
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

	setRole: function(username, body, callback){
		const normalizedBody = (typeof body === 'string') ? { role: body } : body;
		Utils.patch(`/bff/users/${username}`, normalizedBody, callback);
	},

	getCurrentUser: function(callback){
		Utils.get(`/bff/users/me`, callback);
	},

	islimesurveyadmin: function(callback){
		Utils.get(`/bff/users/islimesurveyadmin`, callback);
	},


	// GROUPS
	
	// TODO: Remove?
	getGroups: function(use_new_generation, callback){
		Utils.get(`/bff/groups?use_new_generation=${use_new_generation}`, callback);
	},
	getGroupSimlets: function(simlet_id,group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/simlets`, callback);
	},
	

	getStudyGroups: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/groups`, callback);
	},

	getStudyGroupsCount: function(simlet_id,callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/count`, callback);
	},

	addGroup: function(simlet_id, body, callback){
		Utils.post(`/bff/simlets/${simlet_id}/groups`, body, callback);
	},
	
	addStudyGroup: function(study_id, group_id, callback){
		Utils.post(`/bff/studies/${study_id}/groups/${group_id}`, {}, callback);
	},

	importGroup: function(simlet_id, groupData, callback) {
		Utils.post(`/bff/simlets/${simlet_id}/groups/import`, groupData, callback);
	},

	getGroup: function(simlet_id, group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}`, callback);
	},

	exportGroup: function(simlet_id, group_id, complete, callback) {
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/export?complete=${complete}`, callback);
	},

	updateGroup: function(simlet_id, groupId, group, callback){
		Utils.patch(`/bff/simlets/${simlet_id}/groups/${groupId}`, group, callback);
	},

	deleteGroup: function(simlet_id,group_id, callback){
		Utils.delete(`/bff/simlets/${simlet_id}/groups/${group_id}`, callback);
	},
	
	deleteStudyGroup: function(study_id, group_id, callback){
		Utils.delete(`/bff/studies/${study_id}/groups/${group_id}`, callback);
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

	// Participants

	getStudyGroupsParticipantsCount: function(simlet_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/participants/count`, callback);
	},

	getGroupParticipants: function(simlet_id, group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/participants`, callback);
	},

	getGroupParticipantsCount: function(simlet_id, group_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/groups/${group_id}/participants/count`, callback);
	},

	addGroupParticipant: function(simlet_id, group_id, participant_id, callback){
		Utils.post(`/bff/simlets/${simlet_id}/groups/${group_id}/participants/${participant_id}`, { }, callback);
	},

	deleteGroupParticipants: function(simlet_id, group_id, participant_id, keycloakDelete, callback){
		Utils.delete(`/bff/simlets/${simlet_id}/groups/${group_id}/participants/${participant_id}?keycloakDelete=${keycloakDelete}`, callback);
	},


	// TAGS
	
	getTags: function(callback){
		Utils.get(`/bff/tags`, callback);
	},

	createTag: function(body, callback){
		Utils.post(`/bff/tags`, body, callback);
	},

	updateTag: function(tag_id, body, callback){
		Utils.patch(`/bff/tags/${tag_id}`, body, callback);
	},

	deleteTag: function(tag_id, callback){
		Utils.delete(`/bff/tags/${tag_id}`, callback);
	},


	// STUDIES

	getStudies: function(query, callback) {
		if (typeof query === "function") {
			callback = query;	
			query = {};
		}
		Utils.get(`/bff/studies${getQueryString(query)}`, callback);
	},

	getStudiesCount: function(callback) {
		Utils.get(`/bff/studies/count`, callback);
	},
	
	getSchedulerStudies: function(callback){
		Utils.get(`/bff/scheduler/studies`, callback);
	},

	getSchedulerStudiesCount: function(callback){
		Utils.get(`/bff/scheduler/studies/count`, callback);
	},

	addStudy: function(body, callback){
		Utils.post(`/bff/studies`, body, callback);
	},

	addTestToStudy: function(study_id, body, callback){
	   Utils.post(`/bff/studies/${study_id}/tests`, body, callback);
	},

	importTestConfig: function(study_id, newSession, callback){
		Utils.post(`/bff/studies/${study_id}/tests/import`, newSession, callback);
	},

	getStudyEventsPresignedUrl: function(study_id, callback){
		Utils.get(`/simlets/${study_id}/events/getPresignedUrl`, callback);
	},

	exportTest: function(study_id, test_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}/export`, callback);
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

	setTesterForSession: function(study_id, test_id, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/set-tester`, {}, callback);
	},

	unsetTesterForSession: function(study_id, test_id, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/unset-tester`, {}, callback);
	},

	resetTesterForSession: function(study_id, test_id, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/reset-tester`, {}, callback);
	},

	addTagToSession: function(study_id, test_id, tag, callback){
		Utils.post(`/bff/simlets/${study_id}/tests/${test_id}/tags/${tag}`, {}, callback);
	},

	deleteTagFromSession: function(study_id, test_id, tag, callback){
		Utils.delete(`/bff/simlets/${study_id}/tests/${test_id}/tags/${tag}`, callback);
	},

	updateActivity: function(studyId, testId, activityId, activity, callback){
		if(activity instanceof FormData){
			Utils.patchForm(`/bff/studies/${studyId}/tests/${testId}/activities/${activityId}`, activity, callback);
		} else {
			Utils.patch(`/bff/studies/${studyId}/tests/${testId}/activities/${activityId}`, activity, callback);
		}
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

	getStudyTestsCount: function(study_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/count`, callback);
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

	allocateToSession: function(study_id, group_id, test_id, body, callback){
		Utils.post(`/bff/studies/${study_id}/groups/${group_id}/allocate/${test_id}`, body, callback);
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

	activateSession(study_id, test_id, body, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/activate`, body, callback);
	},

	// Activities

	addActivityToTest: function(study_id, test_id, activity, callback){
		if(activity instanceof FormData){
			Utils.postForm(`/bff/studies/${study_id}/tests/${test_id}/activities`, activity, callback);
		} else {
			Utils.post(`/bff/studies/${study_id}/tests/${test_id}/activities`, activity, callback);
		}
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

	getActivityResultForUser : function(activity_id, student, callback){
		Utils.get(`/bff/activities/${activity_id}/result?users=${student}&type=full`, callback);
	},

	getActivityResultWithTypeForUser : function(activity_id, type, student, callback){
		if(type === undefined) {
			type = 'full';
		}
		Utils.get(`/bff/activities/${activity_id}/result?users=${student}&type=${type}`, callback);
	},

	getActivityResult: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/result`, callback);
	},

	getActivityResultWithType: function(activity_id, type, callback){
		if(type === undefined) {
			type = 'full';
		}
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

	getSessionLRSData: function(simlet_id, session_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/sessions/${session_id}/lrs/statements`, callback);
	},

	getActivityLRSData: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/lrs/statements`, callback);
	},

	getSessionTestLRSData: function(simlet_id, session_id, callback){
		Utils.get(`/bff/simlets/${simlet_id}/sessions/${session_id}/lrs_test_statements`, callback);
	},

	getActivityTestLRSData: function(activity_id, callback){
		Utils.get(`/bff/activities/${activity_id}/lrs_test_statements`, callback);
	},

	setActivityTest: function(activity_id, payload, callback){
		Utils.post(`/bff/activities/${activity_id}/test`, payload, callback);
	},

	deleteActivity: function(studyId, testId, activity_id, callback){
		Utils.delete(`/bff/studies/${studyId}/tests/${testId}/activities/${activity_id}`, callback);
	},

	exportActivity: function(activity_id, study_id, test_id, callback){
		Utils.get(`/bff/studies/${study_id}/tests/${test_id}/activities/${activity_id}/export`, callback);
	},

	importActivity: function(study_id, test_id, activityData, callback){
		Utils.post(`/bff/studies/${study_id}/tests/${test_id}/activities/import`, activityData, callback);
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