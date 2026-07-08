/**
 * @typedef {object} Query - object containing the parameters of the query (status and searchTags params ONLY FOR SIMLETS AND SESSIONS)
 * @property {number} skip - number of results to exclude from the beginning of the fetched results (after filtering and sorting)
 * @property {number} limit - maximum number of results to return after the skip offset (after filtering and sorting)
 * @property {string} searchString - fetch results whose name/description match (either partially or completely) the string
 * @property {string} orderBy - fetch results sorted by this parameter (id/name/createdAt/updatedAt)
 * @property {string} order - order of the sorted results (asc/desc)
 * @property {string} status - fetch results whose status parameter matches this value (active/archived for SIMLETs, active/inactive/terminated for sessions)
 * @property {Array} searchTags - fetch results whose tags ids contain any of the ids in the array
 */

/** 
 * @typedef {string} QueryString - string of the query parameters, including the starting ? if there are any parameters
 * @typedef {function} Callback - function to call when the request gets a response (either on success or on error) 
 */


/**
 * Convert query object to query string
 * @param {Query} query
 * @returns {QueryString}
 */
const getQueryString = function(query) {
	let queryString = "";

	// Filter out empty strings, null, and undefined values
	const cleanQuery = Object.fromEntries(
		Object.entries(query).filter(([_, value]) => 
			value != '' && value != null
		)
	);
	queryString = Object.keys(cleanQuery).length > 0 ? `?${new URLSearchParams(cleanQuery).toString()}` : '';
	return queryString;
}

/**
 * Convert query object to query string containing only the parameters necessary for the /count endpoints
 * @param {Query} query
 * @returns {QueryString}
 */
const getCountQueryString = function(query) {
	const cleanQuery = Object.fromEntries(
		Object.entries(query).filter(([key, value]) => 
			key == "searchString" || key == "searchTags" || key == "status"
		)
	);
	return getQueryString(cleanQuery);
}

/**
 * Given the 2 passed parameters, determine whether the first one is a query or a callback
 * @param {Query | undefined} query
 * @param {Callback} callback
 * @returns {object} - object with the parameters query and callback after corrections
 */
const determineQueryAndCallback = function(query, callback) {
	// If the passed query object is a function, no parameters are being passed, so it's the callback
	if (typeof query === "function") {
		callback = query;	
		query = {};
	}
	return {
		query: query,
		callback: callback
	}
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


	/**
	 * Refresh authentication token
	 * @param {Callback} callback - Function to call when request completes
	 */
	refreshAuth : function(callback){
		Utils.get(`/users/refresh_auth`, callback);
	},

	getLanguage: function(callback){
		Utils.get(`/bff/languages`, callback);
	},

	updateLanguage: function(languageid, callback){
		Utils.get(`/bff/languages/${languageid}`, callback);
	},


	// TAGS
	
	/**
	 * Send a GET request to the bff to fetch all the existing tags
	 * @param {Callback} callback
	 */
	getTags: function(callback){
		Utils.get(`/bff/tags`, callback);
	},

	/**
	 * Send a POST request to the bff to create a new tag
	 * @param {object} body - object containing the tag_name and tag_color of the tag
	 * @param {Callback} callback
	 */
	createTag: function(body, callback){
		Utils.post(`/bff/tags`, body, callback);
	},
	
	/**
	 * Send a PATCH request to the bff to update the specified tag info 
	 * @param {number} tagId - id of the tag to update
	 * @param {object} body - object containing either the modified tag_name, the tag_color, or both
	 * @param {Callback} callback
	 */
	updateTag: function(tagId, body, callback){
		Utils.patch(`/bff/tags/${tagId}`, body, callback);
	},

	/**
	 * Send a DELETE request to the bff to delete the specified tag 
	 * @param {number} tagId - id of the tag to delete
	 * @param {Callback} callback
	 */
	deleteTag: function(tagId, callback){
		Utils.delete(`/bff/tags/${tagId}`, callback);
	},


	// SIMLETS + SCHEDULERS

	/**
	 * Send a GET request to the bff to fetch the SIMLETs matching the query search parameters
	 * @param {Query | undefined} query
	 * @param {Callback} callback
	 */
	getSimlets: function(query, callback) {
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/studies${getQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch the amount of SIMLETs matching the query search parameters
	 * @param {Query | undefined} query
	 * @param {Callback} callback
	 */
	getSimletsCount: function(query, callback) {
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/studies/count${getCountQueryString(params.query)}`, params.callback);
	},
	
	/**
	 * Send a POST request to the bff to add a SIMLET 
	 * @param {object} body - object containing the simlet_name and simlet_description of the SIMLET
	 * @param {Callback} callback
	 */
	addSimlet: function(body, callback){
		Utils.post(`/bff/studies`, body, callback);
	},

	/**
	 * Send a POST request to the bff to import a SIMLET 
	 * @param {object} newStudy - object containing the simlet_name and file of the SIMLET
	 * @param {Callback} callback
	 */
	importSimlet: function(newStudy, callback){
		Utils.post(`/bff/studies/import`, newStudy, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to fetch
	 * @param {Callback} callback
	 */
	getSimlet: function(simletId, callback){
		Utils.get(`/bff/studies/${simletId}`, callback);
	},

	/**
	 * Send a GET request to the bff to export the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to export
	 * @param {Callback} callback
	 */
	exportSimlet: function(simletId, callback){
		Utils.get(`/bff/studies/${simletId}/export`, callback);
	},
	
	/**
	 * Send a PATCH request to the bff to update the specified SIMLET info 
	 * @param {number} simletId - id of the SIMLET to update
	 * @param {object} study - object containing either the modified simlet_name, the simlet_description, or both
	 * @param {Callback} callback
	 */
	updateSimlet: function(simletId, study, callback){
		Utils.patch(`/bff/studies/${simletId}`, study, callback);
	},
	
	/**
	 * Send a DELETE request to the bff to delete the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to delete
	 * @param {Callback} callback
	 */
	deleteSimlet: function(simletId, callback){
		Utils.delete(`/bff/studies/${simletId}`, callback);
	},


	/**
	 * Send a GET request to the bff to fetch the scheduled SIMLETs matching the query search parameters
	 * @param {Query | undefined} query
	 * @param {Callback} callback
	 */
	getSchedulerSimlets: function(query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/scheduler/studies${getQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch the amount of scheduled SIMLETs matching the query search parameters
	 * @param {Query | undefined} query
	 * @param {Callback} callback
	 */
	getSchedulerSimletsCount: function(query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/scheduler/studies/count${getCountQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch the scheduler of the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to fetch
	 * @param {Callback} callback
	 */
	getSimletScheduler: function(simletId, callback){
		Utils.get(`/bff/studies/${simletId}/schedule`, callback);
	},

	
	//SHLINK URL

	/**
	 * Send a POST request to the bff to generate a shlink url for the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that the shlink will be generated for
	 * @param {string} customSlug - custom text that appears as the url
	 * @param {number} length - length of the custom slug
	 * @param {Callback} callback 
	 */
	generateShlink(simletId, customSlug, length, callback){
		let body = {
			customSlug: customSlug, 
			length:length
		};
		Utils.post(`/bff/simlets/${simletId}/shlink`, body, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the shlink url of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET the shlink will be fetched from
	 * @param {Callback} callback 
	 */
	getShLink(simletId, callback){
		Utils.get(`/bff/simlets/${simletId}/shlink`, callback);
	},

	/**
	 * Update shlink URL for SIMLET
	 * @param {number} simletId - ID of the SIMLET
	 * @param {string} customSlug - Custom slug for the URL
	 * @param {number} length - Length of the custom slug
	 * @param {Callback} callback - Function to call when request completes
	 */
	updateShLink(simletId, customSlug, length, callback){
		let body = {
			customSlug: customSlug, 
			length:length
		};
		Utils.patch(`/bff/simlets/${simletId}/shlink`, body, callback);
	},	

	/**
	 * Send a DELETE request to the bff to delete the shlink url of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET the shlink will be deleted from
	 * @param {Callback} callback 
	 */
	deleteShLink(simletId, callback){
		Utils.delete(`/bff/simlets/${simletId}/shlink`, callback);
	},


	// SESSIONS

	/**
	 * Send a GET request to the bff to fetch the sessions matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the sessions from
	 * @param {Query | undefined} query 
	 * @param {Callback} callback 
	 */
	getSimletSessions: function(simletId, query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/studies/${simletId}/tests${getQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch the amount of sessions matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the sessions from
	 * @param {Query | undefined} query 
	 * @param {Callback} callback 
	 */
	getSimletSessionsCount: function(simletId, query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/studies/${simletId}/tests/count${getCountQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a POST request to the bff to add a session to the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to add the session to
	 * @param {object} body - object containing the session_name, session_description, session_status and session_can_be_manually_activated of the session
	 * @param {Callback} callback
	 */
	addSessionToSimlet: function(simletId, body, callback){
	   Utils.post(`/bff/studies/${simletId}/tests`, body, callback);
	},

	/**
	 * Send a POST request to the bff to import a session in the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to add the session to
	 * @param {object} newSession - object containing the session_name and file of the session
	 * @param {Callback} callback
	 */
	importSession: function(simletId, newSession, callback){
		Utils.post(`/bff/studies/${simletId}/tests/import`, newSession, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch
	 * @param {Callback} callback 
	 */
	getSimletSession: function(simletId,sessionId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the complete info of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch
	 * @param {Callback} callback 
	 */
	getSimletSessionComplete: function(simletId,sessionId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}/complete`, callback);
	},

	/**
	 * Send a GET request to the bff to export the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to export
	 * @param {Callback} callback 
	 */
	exportSession: function(simletId, sessionId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}/export`, callback);
	},

	/**
	 * Send a PATCH request to the bff to update the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {object} body - object containing either the modified session_name, the session_description, or both
	 * @param {Callback} callback 
	 */
	updateSession: function(simletId, sessionId, body, callback){
		Utils.patch(`/bff/studies/${simletId}/tests/${sessionId}`, body, callback);
	},

	/**
	 * Send a DELETE request to the bff to delete the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to delete
	 * @param {Callback} callback 
	 */
	deleteSession: function(simletId, sessionId, callback){
		Utils.delete(`/bff/studies/${simletId}/tests/${sessionId}`, callback);
	},
	
	
	/**
	 * Send a PATCH request to the bff to change the status of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {object} body - object containing the activate of the session
	 * @param {Callback} callback 
	 */
	activateSession(simletId, sessionId, body, callback){
		Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/activate`, body, callback);
	},
	
	
	/**
	 * Send a PATCH request to the bff to add the specified tag to the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {number} tagId - id of the tag to add
	 * @param {Callback} callback 
	 */
	addTagToSession: function(simletId, sessionId, tagId, callback){
		Utils.post(`/bff/simlets/${simletId}/tests/${sessionId}/tags/${tagId}`, {}, callback);
	},

	/**
	 * Send a DELETE request to the bff to delete the specified tag to the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {number} tagId - id of the tag to delete
	 * @param {Callback} callback 
	 */
	deleteTagFromSession: function(simletId, sessionId, tagId, callback){
		Utils.delete(`/bff/simlets/${simletId}/tests/${sessionId}/tags/${tagId}`, callback);
	},


	/**
	 * Send a POST request to the bff to set the current user as tester (allocate to session, create sandbox group if needed)
	 *  in the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to set the tester in
	 * @param {Callback} callback 
	 */
	setTesterForSession: function(simletId, sessionId, callback){
		Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/set-tester`, {}, callback);
	},

	/**
	 * Send a POST request to the bff to unset the current user as tester (remove from group, delete group if sandbox)
	 * in the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to unset the tester from
	 * @param {Callback} callback 
	 */
	unsetTesterForSession: function(simletId, sessionId, callback){
		Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/unset-tester`, {}, callback);
	},

	/**
	 * Send a POST request to the bff to resset the current user as tester (unset and set again as tester)
	 * in the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to reset the tester from
	 * @param {Callback} callback 
	 */
	resetTesterForSession: function(simletId, sessionId, callback){
		Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/reset-tester`, {}, callback);
	},
	

	/**
	 * Send a GET request to the bff to fetch the LRS data of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch the data from
	 * @param {Callback} callback 
	 */
	getSessionLRSData: function(simletId, sessionId, callback){
		Utils.get(`/bff/simlets/${simletId}/sessions/${sessionId}/lrs/statements`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the LRS data for the test users of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch the data from
	 * @param {Callback} callback 
	 */
	getSessionTestLRSData: function(simletId, sessionId, callback){
		Utils.get(`/bff/simlets/${simletId}/sessions/${sessionId}/lrs_test_statements`, callback);
	},


	// ACTIVITIES

	/**
	 * Send a GET request to the bff to fetch all the activities in the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session that has the activities
	 * @param {Callback} callback 
	 */
	getSessionActivities: function(simletId, sessionId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}/activities`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch all the existing activity types
	 * @param {Callback} callback 
	 */
	getActivityTypes: function(callback){
		Utils.get(`/bff/activitytypes`, callback);
	},

	/**
	 * Send a POST request to the bff to add an activity to the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to add the activity to
	 * @param {object} activity - object containing the activity info
	 * @param {Callback} callback
	 */
	addActivityToSession: function(simletId, sessionId, activity, callback){
		if(activity instanceof FormData){
			Utils.postForm(`/bff/studies/${simletId}/tests/${sessionId}/activities`, activity, callback);
		} else {
			Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/activities`, activity, callback);
		}
	},

	/**
 	 * Send a POST request to the bff to import an activity to the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to add the activity to
	 * @param {object} activityData - object containing the activity_name and file of the activity
	 * @param {Callback} callback
	 */
	importActivity: function(simletId, sessionId, activityData, callback){
		Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/activities/import`, activityData, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the specified activity
	 * @param {number} activityId - id of the activity to fetch
	 * @param {Callback} callback 
	 */
	getActivity: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}`, callback);
	},

	/**
	 * Export activity
	 * @param {number} activityId - ID of the activity to export
	 * @param {boolean} complete - Whether to export complete data
	 * @param {Callback} callback - Function to call when request completes
	 */
	exportActivity: function(activityId, complete, callback){
		Utils.get(`/bff/activities/${activityId}/export?complete=${complete}`, callback);
	},
	/**
	 * Send a PATCH request to the bff to update the specified activity info of the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session that has the activity
	 * @param {number} activityId - id of the activity to update
	 * @param {object} activity - object containing the parameters to update
	 * @param {Callback} callback 
	 */
	updateActivity: function(simletId, sessionId, activityId, activity, callback){
		if(activity instanceof FormData){
			Utils.patchForm(`/bff/studies/${simletId}/tests/${sessionId}/activities/${activityId}`, activity, callback);
		} else {
			Utils.patch(`/bff/studies/${simletId}/tests/${sessionId}/activities/${activityId}`, activity, callback);
		}
	},

	/**
	 * Send a DELETE request to the bff to delete the specified activity of the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session that has the activity
	 * @param {number} activityId - id of the activity to delete
	 * @param {Callback} callback 
	 */
	deleteActivity: function(simletId, sessionId, activityId, callback){
		Utils.delete(`/bff/studies/${simletId}/tests/${sessionId}/activities/${activityId}`, callback);
	},
	
	/**
	 * Set activity test
	 * @param {number} activityId - ID of the activity
	 * @param {object} payload - Payload for the test
	 * @param {Callback} callback - Function to call when request completes
	 */
	setActivityTest: function(activityId, payload, callback){
		Utils.post(`/bff/activities/${activityId}/test`, payload, callback);
	},
	
	/**
	 * Send a GET request to the bff to fetch the target of the specified activity
	 * @param {number} activityId - id of the activity to fetch the target from
	 * @param {Callback} callback 
	 */
	getActivityTarget: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/target`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch all the available surveys
	 * @param {Callback} callback 
	 */
	getSurveyList: function(callback){
		Utils.get(`/bff/limesurvey/surveys`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the languages of the specified survey
	 * @param {number} surveyId - id of the survey to fetch the languages from
	 * @param {Callback} callback 
	 */
	getSurveyLanguages: function(surveyId, callback){
		Utils.get(`/bff/limesurvey/surveys/${surveyId}/languages`, callback);
	},

	/**
	 * Send a PATCH request to the bff to set the owner of a survey
	 * @param {number} surveyId - id of the survey to set the owner in
	 * @param {Callback} callback 
	 */
	setSurveyOwner: function(surveyId, callback){
		Utils.patch(`/bff/limesurvey/surveys/${surveyId}/owner`, {}, callback);
	},
	
	/**
	 * Send a GET request to the bff to check if the specified activity can be opened
	 * @param {number} activityId - id of the activity to check
	 * @param {Callback} callback 
	 */
	isActivityOpenable: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/openable`, callback);
	},

	/**
	 * Open activity
	 * @param {number} activityId - ID of the activity to open
	 * @param {Callback} callback - Function to call when request completes
	 */
	openActivity: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/open`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the initialized data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to check
	 * @param {Callback} callback 
	 */
	getActivityInitialized: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/initialized`, callback);
	},

	/**
	 * Set activity initialized status
	 * @param {number} activityId - ID of the activity
	 * @param {number} participantId - ID of the participant
	 * @param {boolean} status - Initialization status
	 * @param {Callback} callback - Function to call when request completes
	 */
	setActivityInitialized: function(activityId, participantId, status, callback){
		Utils.post(`/bff/activities/${activityId}/initialized?user=${participantId}`, { status: status }, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the completion data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the progress from
	 * @param {Callback} callback 
	 */
	getActivityProgress: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/progress`, callback);
	},

	/**
	 * Set activity progress
	 * @param {number} activityId - ID of the activity
	 * @param {number} participantId - ID of the participant
	 * @param {boolean} status - Progress status
	 * @param {Callback} callback - Function to call when request completes
	 */
	setActivityProgress: function(activityId, participantId, status, callback){
		const userQuery = participantId ? `?user=${participantId}` : '';
		Utils.post(`/bff/activities/${activityId}/progress${userQuery}`, { status: status }, callback);
	},
	
	/**
	 * Send a GET request to the bff to fetch the completion data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the completion from
	 * @param {Callback} callback 
	 */
	getActivityCompletion: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/completion`, callback);
	},

	/**
	 * Send a POST request to the bff to set the completion status for the specified participant of the specified activity 
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {number} participantId - id of the participant to change the completion for 
	 * @param {boolean} status - true to set the activity as completed, false otherwise
	 * @param {Callback} callback 
	 */
	setActivityCompletion: function(activityId, participantId, status, callback){
		Utils.post(`/bff/activities/${activityId}/completion?user=${participantId}`, { status: status }, callback);
	},

	/**
	 * Send a POST request to the bff to set the completion status for all the participants of the specified activity 
	 * @param {number} activityId - id of the activity to set the status for
	 * @param {boolean} status - true to set the activity as completed, false otherwise
	 * @param {Callback} callback 
	 */
	setMultiActivityCompletion: function(activityId, status, callback){
		Utils.post(`/bff/activities/${activityId}/completion/multi`, { status: status }, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the hasResult data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the hasResult from
	 * @param {Callback} callback 
	 */
	getActivityHasResult: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/hasresult`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the result data of the specified participant from the specified activity with the specified type
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {string} type - type of result of the result data to fetch 
	 * @param {number} participantId - id of the participant to fetch the result data from 
	 * @param {Callback} callback 
	 */
	getActivityResultWithTypeForUser : function(activityId, type, participantId, callback){
		if(type === undefined) {
			type = 'full';
		}
		Utils.get(`/bff/activities/${activityId}/result?users=${participantId}&type=${type}`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the result data of for all the participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the results from
	 * @param {string} type - type of result of the result data to fetch 
	 * @param {Callback} callback 
	 */
	getActivityResultWithType: function(activityId, type, callback){
		if(type === undefined) {
			type = 'full';
		}
		Utils.get(`/bff/activities/${activityId}/result?type=${type}`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the result data of the specified participant from the specified activity
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {number} participantId - id of the participant to fetch the result data from 
	 * @param {Callback} callback 
	 */
	getActivityResultForUser : function(activityId, participantId, callback){
		Utils.get(`/bff/activities/${activityId}/result?users=${participantId}&type=full`, callback);
	},
	
	/**
	 * Send a GET request to the bff to fetch the result data for all the participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the results from
	 * @param {Callback} callback 
	 */
	getActivityResult: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/result`, callback);
	},
	
	/**
	 * Get activity suspension
	 * @param {number} activityId - ID of the activity
	 * @param {Callback} callback - Function to call when request completes
	 */
	getActivitySuspension: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/suspension`, callback);
	},
	
	/**
	 * Send a POST request to the bff to change the specified activity status for the specified participant 
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {number} participantId - id of the participant to set the status for  
	 * @param {boolean} status - true to set the activity as suspended, false otherwise
	 * @param {string} reason - reason of the status change
	 * @param {Callback} callback 
	 */
	setActivitySuspension: function(activityId, participantId, status, reason, callback){
		Utils.post(`/bff/activities/${activityId}/suspension`, { user : participantId , status : status, reason : reason }, callback);
	},
	
	
	/**
	 * Send a GET request to the bff to fetch the LRS data for the specified activity
	 * @param {number} activityId - id of the activity to fetch the data from
	 * @param {Callback} callback 
	 */
	getActivityLRSData: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/lrs/statements`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the LRS data for the test users of the specified activity
	 * @param {number} activityId - id of the activity to fetch the data from
	 * @param {Callback} callback 
	 */
	getActivityTestLRSData: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/lrs_test_statements`, callback);
	},
	

	// GROUPS

	/**
	 * Send a GET request to the bff to fetch the groups matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the groups from
	 * @param {Query | undefined} query 
	 * @param {Callback} callback 
	 */
	getSimletGroups: function(simletId, query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/simlets/${simletId}/groups${getQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch the amount of groups matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the groups from
	 * @param {Query | undefined} query 
	 * @param {Callback} callback 
	 */
	getSimletGroupsCount: function(simletId, query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/simlets/${simletId}/groups/count${getCountQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a POST request to the bff to add a group to the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to add the group to
	 * @param {object} body - object containing the group_name, group_sandbox and group_use_new_generation of the group
	 * @param {Callback} callback 
	 */
	addGroup: function(simletId, body, callback){
		Utils.post(`/bff/simlets/${simletId}/groups`, body, callback);
	},
	
	/**
	 * Add study group
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {Callback} callback - Function to call when request completes
	 */
	addStudyGroup: function(simletId, groupId, callback){
		Utils.post(`/bff/studies/${simletId}/groups/${groupId}`, {}, callback);
	},

	/**
	 * Send a POST request to the bff to import a group in the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to add the group to
	 * @param {object} groupData  - object containing the group_name and file of the group
	 * @param {Callback} callback 
	 */
	importGroup: function(simletId, groupData, callback) {
		Utils.post(`/bff/simlets/${simletId}/groups/import`, groupData, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to fetch
	 * @param {Callback} callback 
	 */
	getGroup: function(simletId, groupId, callback){
		Utils.get(`/bff/simlets/${simletId}/groups/${groupId}`, callback);
	},

	/**
	 * Send a GET request to the bff to export the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to export
	 * @param {boolean} complete - true to export the complete group info, false otherwise 
	 * @param {Callback} callback 
	 */
	exportGroup: function(simletId, groupId, complete, callback) {
		Utils.get(`/bff/simlets/${simletId}/groups/${groupId}/export?complete=${complete}`, callback);
	},

	/**
	 * Send a PATCH request to the bff to update the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to update
	 * @param {object} group - object containing either the modified group_name, group_sandbox, group_use_new_generation, or any combination of them
	 * @param {Callback} callback 
	 */
	updateGroup: function(simletId, groupId, group, callback){
		Utils.patch(`/bff/simlets/${simletId}/groups/${groupId}`, group, callback);
	},

	/**
	 * Send a DELETE request to the bff to delete the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId  - id of the group to delete
	 * @param {Callback} callback 
	 */
	deleteGroup: function(simletId,groupId, callback){
		Utils.delete(`/bff/simlets/${simletId}/groups/${groupId}`, callback);
	},

	/**
	 * Delete study group
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {Callback} callback - Function to call when request completes
	 */
	deleteStudyGroup: function(simletId, groupId, callback){
		Utils.delete(`/bff/studies/${simletId}/groups/${groupId}`, callback);
	},

	
	// ALLOCATOR

	/**
	 * Send a GET request to the bff to fetch all the allocator types
	 * @param {Callback} callback 
	 */
	getAllocatorTypes: function(callback){
		Utils.get(`/bff/allocatortypes`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the allocator for the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the allocator from 
	 * @param {Callback} callback 
	 */
	getAllocator: function(simletId, callback){
		Utils.get(`/bff/studies/${simletId}/allocator`, callback);
	},

	/**
	 * Update allocator
	 * @param {number} simletId - ID of the SIMLET
	 * @param {object} allocator - Allocator data
	 * @param {Callback} callback - Function to call when request completes
	 */
	updateAllocator: function(simletId, allocator, callback){
		Utils.patch(`/bff/studies/${simletId}/allocator`, allocator, callback);
	},
	
	/**
	 * Send a POST request to the bff to allocate the specified participant of the specified group to the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session and the group
	 * @param {number} groupId - id of the group that has the participant to allocate
	 * @param {number} sessionId - id of the session to allocate the participant in
	 * @param {object} body - object containing the participant_id of the participant to allocate 
	 * @param {Callback} callback 
	 */
	allocateToSession: function(simletId, groupId, sessionId, body, callback){
		Utils.post(`/bff/studies/${simletId}/groups/${groupId}/allocate/${sessionId}`, body, callback);
	},

	/**
	 * Send a POST request to the bff to allocate the specified participant of the specified group to a random session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session and the group
	 * @param {number} groupId - id of the group that has the participant to allocate
	 * @param {object} data - object containing the participant_id of the participant to allocate 
	 * @param {Callback} callback 
	 */
	allocateRandomly: function(simletId, groupId, data, callback){
		Utils.post(`/bff/studies/${simletId}/groups/${groupId}/allocate/random`, data, callback);
	},
	
	
	// PARTICIPANTS
	
	/**
	 * Send a GET request to the bff to fetch all the participants of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the participants from
	 * @param {Callback} callback 
	 */
	getSimletParticipants: function(simletId, callback){
		Utils.get(`/bff/studies/${simletId}/participants`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the amount of participants in each group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the participants from
	 * @param {Query | undefined} query 
	 * @param {Callback} callback 
	 */
	getSimletGroupsParticipantsCount: function(simletId, query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/simlets/${simletId}/groups/participants/count${getCountQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch all the participants in the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch the participants from
	 * @param {Callback} callback 
	 */
	getSessionParticipants: function(simletId, sessionId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}/participants`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch all the participants in the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to fetch the participants from
	 * @param {Callback} callback 
	 */
	getGroupParticipants: function(simletId, groupId, callback){
		Utils.get(`/bff/simlets/${simletId}/groups/${groupId}/participants`, callback);
	},

	/**
	 * Send a GET request to the bff to fetch the amount of participants in the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to fetch the participants from
	 * @param {Query | undefined} query - TODO: Remove?
	 * @param {Callback} callback 
	 */
	getGroupParticipantsCount: function(simletId, groupId, query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/simlets/${simletId}/groups/${groupId}/participants/count${getCountQueryString(params.query)}`, params.callback);
	},
	
	/**
	 * Send a POST request to the bff to add a participant to the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to add the participant to
	 * @param {number} participantId - id of the participant to add
	 * @param {Callback} callback 
	 */
	addGroupParticipant: function(simletId, groupId, participantId, callback){
		Utils.post(`/bff/simlets/${simletId}/groups/${groupId}/participants/${participantId}`, { }, callback);
	},

	/**
	 * Send a DELETE request to the bff to delete the specified participant from the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to delete the participant from
	 * @param {number} participantId - id of the participant to delete
	 * @param {boolean} keycloakDelete - true to delete the user from keycloak, false otherwise 
	 * @param {Callback} callback 
	 */
	deleteGroupParticipant: function(simletId, groupId, participantId, keycloakDelete, callback){
		Utils.delete(`/bff/simlets/${simletId}/groups/${groupId}/participants/${participantId}?keycloakDelete=${keycloakDelete}`, callback);
	},


	// USERS

	/**
	 * Send a GET request to the bff to fetch the users matching the query search parameters
	 * @param {Query} query 
	 * @param {Callback} callback 
	 */
	getUsers: function(query, callback){
		const params = determineQueryAndCallback(query, callback);
		Utils.get(`/bff/users${getQueryString(params.query)}`, params.callback);
	},

	/**
	 * Send a GET request to the bff to fetch the user data with the specified username
	 * @param {string} username - username of the user to fetch 
	 * @param {Callback} callback 
	 */
	getUser: function(username, callback) {
		Utils.get(`/bff/users?username=${username}`, callback);
	},
	

	/**
	 * Send a GET request to the bff to fetch the user data of the current user
	 * @param {Callback} callback 
	 */
	getCurrentUser: function(callback){
		Utils.get(`/bff/users/me`, callback);
	},
	
	/**
	 * Send a POST request to the bff to add a batch of generated users to the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group where the users will be added to
	 * @param {string} algorithm - algorithm to use for the token generation (letters/alphanumeric/base58)
	 * @param {number} length - length of the tokens
	 * @param {number} batchLength - amount of tokens to generate
	 * @param {Callback} callback 
	 */
	generateAndRegister: function(simletId, groupid, algorithm, length, batchLength, callback){
		let body = {
			algorithm: algorithm,
			length: Number(length),
			batchLength: Number(batchLength)
		};
		Utils.post(`/bff/simlets/${simletId}/groups/${groupid}/users`, body, callback);
	},

	/**
	 * Send a POST request to the bff to add a new participant to the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group where the participant will be added to
	 * @param {string} username - username of the new user
	 * @param {string} email - email of the new user
	 * @param {string} password - password of the new user
	 * @param {string} role - role of the new user (student/teacher) 
	 * @param {Callback} callback 
	 */
	register: function(simletId, groupid, username, email, password, role, callback){
		let body = {
			username: username,
			email: email,
			password: password,
			role: role
		};
		Utils.post(`/bff/simlets/${simletId}/groups/${groupid}/users`, body, callback);
	},

	/**
	 * Set user role
	 * @param {string} username - Username of the user
	 * @param {object|string} body - Role data or string
	 * @param {Callback} callback - Function to call when request completes
	 */
	setRole: function(username, body, callback){
		const normalizedBody = (typeof body === 'string') ? { role: body } : body;
		Utils.patch(`/bff/users/${username}`, normalizedBody, callback);
	},

	/**
	 * Function to check if the current user is a LimeSurvey admin
	 * @param {Callback} callback 
	 */
	islimesurveyadmin: function(callback){
		Utils.get(`/bff/users/islimesurveyadmin`, callback);
	},


	// PERMISSIONS

	/**
	 * Send a GET request to the bff to fetch the permissions data for all the coordinators of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the data from
	 * @param {Callback} callback 
	 */
	getSimletDirectPermissions: function(simletId, callback){
		Utils.get(`/bff/studies/${simletId}/permissions`, callback);
	},

	/**
	 * Send a POST request to the bff to add permissions data for a user to the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to add the data to
	 * @param {object} permissions - object containing the user_id, and permission type (READ/WRITE)
	 * @param {Callback} callback 
	 */
	createSimletPermissions: function(simletId, permissions, callback){
		Utils.post(`/bff/studies/${simletId}/permissions`, permissions, callback);
	},

	/**
	 * Get permissions for user in SIMLET
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} userId - ID of the user
	 * @param {Callback} callback - Function to call when request completes
	 */
	getSimletPermissionsForUser: function(simletId, userId, callback){
		Utils.get(`/bff/studies/${simletId}/permissions/${userId}`, callback);
	},

	/**
	 * Patch permissions for user in SIMLET
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} userId - ID of the user
	 * @param {object} permissions - Permissions data
	 * @param {Callback} callback - Function to call when request completes
	 */
	patchSimletPermissionsForUser: function(simletId, userId, permissions, callback){
		Utils.patch(`/bff/studies/${simletId}/permissions/${userId}`, permissions, callback);
	},

	/**
	 * Send a DELETE request to the bff to delete the permissions of the specified user in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the user
	 * @param {number} userId - id of the user to remove the permissions from
	 * @param {Callback} callback 
	 */
	deleteSimletPermissionsForUser: function(simletId, userId, callback){
		Utils.delete(`/bff/studies/${simletId}/permissions/${userId}`, callback);
	},


	/**
	 * Get session permissions
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} sessionId - ID of the session
	 * @param {Callback} callback - Function to call when request completes
	 */
	getSessionPermissions: function(simletId, sessionId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}/permissions`, callback);
	},

	/**
	 * Create session permissions
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} sessionId - ID of the session
	 * @param {object} permissions - Permissions data
	 * @param {Callback} callback - Function to call when request completes
	 */
	createSessionPermissions: function(simletId, sessionId, permissions, callback){
		Utils.post(`/bff/studies/${simletId}/tests/${sessionId}/permissions`, permissions, callback);
	},

	/**
	 * Get session permissions for user
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} sessionId - ID of the session
	 * @param {number} userId - ID of the user
	 * @param {Callback} callback - Function to call when request completes
	 */
	getSessionPermissionsForUser: function(simletId, sessionId, userId, callback){
		Utils.get(`/bff/studies/${simletId}/tests/${sessionId}/permissions/${userId}`, callback);
	},

	/**
	 * Patch session permissions for user
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} sessionId - ID of the session
	 * @param {number} userId - ID of the user
	 * @param {object} permissions - Permissions data
	 * @param {Callback} callback - Function to call when request completes
	 */
	patchSessionPermissionsForUser: function(simletId, sessionId, userId, permissions, callback){
		Utils.patch(`/bff/studies/${simletId}/tests/${sessionId}/permissions/${userId}`, permissions, callback);
	},

	/**
	 * Delete session permissions for user
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} sessionId - ID of the session
	 * @param {number} userId - ID of the user
	 * @param {Callback} callback - Function to call when request completes
	 */
	deleteSessionPermissionsForUser: function(simletId, sessionId, userId, callback){
		Utils.delete(`/bff/studies/${simletId}/tests/${sessionId}/permissions/${userId}`, callback);
	},


	/**
	 * Get group direct permissions
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {Callback} callback - Function to call when request completes
	 */
	getGroupDirectPermissions: function(simletId,groupId, callback){
		Utils.get(`/bff/simlets/${simletId}/groups/${groupId}/permissions`, callback);
	},

	/**
	 * Create group permissions
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {object} permissions - Permissions data
	 * @param {Callback} callback - Function to call when request completes
	 */
	createGroupPermissions: function(simletId,groupId, permissions, callback){
		Utils.post(`/bff/simlets/${simletId}/groups/${groupId}/permissions`, permissions, callback);
	},

	/**
	 * Get group permissions for user
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {number} userId - ID of the user
	 * @param {Callback} callback - Function to call when request completes
	 */
	getGroupPermissionsForUser: function(simletId,groupId, userId, callback){
		Utils.get(`/bff/simlets/${simletId}/groups/${groupId}/permissions/${userId}`, callback);
	},

	/**
	 * Patch group permissions for user
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {number} userId - ID of the user
	 * @param {object} permissions - Permissions data
	 * @param {Callback} callback - Function to call when request completes
	 */
	patchGroupPermissionsForUser: function(simletId, groupId, userId, permissions, callback){
		Utils.patch(`/bff/simlets/${simletId}/groups/${groupId}/permissions/${userId}`, permissions, callback);
	},

	/**
	 * Delete group permissions for user
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {number} userId - ID of the user
	 * @param {Callback} callback - Function to call when request completes
	 */
	deleteGroupPermissionsForUser: function(simletId,groupId, userId, callback){
		Utils.delete(`/bff/simlets/${simletId}/groups/${groupId}/permissions/${userId}`, callback);
	},


	/**
	 * Get SIMLET events presigned URL
	 * @param {number} simletId - ID of the SIMLET
	 * @param {Callback} callback - Function to call when request completes
	 */
	getSimletEventsPresignedUrl: function(simletId, callback){
		Utils.get(`/simlets/${simletId}/events/getPresignedUrl`, callback);
	},

	/**
	 * Get schedule events presigned URL
	 * @param {number} simletId - ID of the SIMLET
	 * @param {Callback} callback - Function to call when request completes
	 */
	getScheduleEventsPresignedUrl: function(simletId, callback){
		Utils.get(`/simlets/${simletId}/schedule/events/getPresignedUrl`, callback);
	},

	/**
	 * Get group events presigned URL
	 * @param {number} simletId - ID of the SIMLET
	 * @param {number} groupId - ID of the group
	 * @param {Callback} callback - Function to call when request completes
	 */
	getGroupEventsPresignedUrl: function(simletId, groupId, callback) {
		Utils.get(`/groups/${simletId}/${groupId}/events/getPresignedUrl`, callback);
	},

	/**
	 * Get events presigned URL
	 * @param {Callback} callback - Function to call when request completes
	 */
	getEventsPresignedUrl: function(callback){
		Utils.get(`/events/getPresignedUrl`, callback);
	},

	/**
	 * Get MinIO data URL
	 * @param {number} activityId - ID of the activity
	 * @param {Callback} callback - Function to call when request completes
	 */
	getMinioDataUrl: function(activityId, callback){
		Utils.get(`/bff/activities/${activityId}/presignedurl`, callback);
	},
	

	/**
	 * Get LTI tools
	 * @param {Callback} callback - Function to call when request completes
	 */
	getLtiTools: function(callback){
		Utils.get(`/bff/lti/tools`, callback);
	},

	addLtiTool: function(tool, callback){
		Utils.post(`/bff/lti/tools`, tool, callback);
	},

	deleteLtiTool: function(tool, callback){
		Utils.delete(`/bff/lti/tools/${tool}`, callback);
	},

	getLtiPlatforms: function(simletId, callback){
		let query = '';
		if(simletId){
			query = '?searchString=' + encodeURI(`{"simletId":"${simletId}"}`);
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
