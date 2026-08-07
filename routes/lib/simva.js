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
 * @typedef {number} CurrSessionId - id of the current session
 * @typedef {string} QueryString - string of the query parameters, including the starting ? if there are any parameters
 * @typedef {function} Callback - function to call when the request gets a response (either on success or on error) 
 * @typedef {object} Request - HTTP Request object passed from the bff
 */


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

	// REQUESTS

	/**
	 * Handle/refresh the current session and send a GET request to the Axios wrapper
	 * @param {string} url - url to send the request to
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	get(url, currSessionId, callback){
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(currSessionId), (error, result) => {
			if(error) {
				callback(error);
				return;
			}
			Utils.get(url, callback, userClientsListManager.getJWT(currSessionId));
		});
	}
	
	/**
	 * Handle/refresh the current session and send a POST request to the Axios wrapper
	 * @param {string} url - url to send the request to
	 * @param {Request} req
	 * @param {object} body - data to send in the request
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	post(url, req, body, currSessionId, callback){
		logger.info(body, `Making POST request to ${url} for session ${currSessionId}`);
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(currSessionId), (error, result) => {
			if(error) {
				callback(error);
				return;
			}
			Utils.post(url, req, body, callback, userClientsListManager.getJWT(currSessionId));
		});
		
	}

	/**
	 * Handle/refresh the current session and send a PATCH request to the Axios wrapper
	 * @param {string} url - url to send the request to
	 * @param {Request} req
	 * @param {object} body - data to send in the request
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	patch(url, req, body, currSessionId, callback){
		logger.info(body, `Making PATCH request to ${url} for session ${currSessionId}`);
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(currSessionId), (error, result) => {
			if(error) {
				callback(error);
				return;
			}
			Utils.patch(url, req, body, callback, userClientsListManager.getJWT(currSessionId));
		});
	}

	/**
	 * Handle/refresh the current session and send a PUT request to the Axios wrapper
	 * @param {string} url - url to send the request to
	 * @param {Request} req
	 * @param {object} body - data to send in the request
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	put(url, req, body, currSessionId, callback){
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(currSessionId), (error, result) => {
			if(error) {
				callback(error);
				return;
			}
			Utils.put(url, req, body, callback, userClientsListManager.getJWT(currSessionId));
		});
	}

	/**
	 * Handle/refresh the current session and send a DELETE request to the Axios wrapper
	 * @param {string} url - url to send the request to
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	delete(url, currSessionId, callback){
		usertools.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(currSessionId), (error, result) => {
			if(error) {
				callback(error);
				return;
			}
			Utils.delete(url, callback, userClientsListManager.getJWT(currSessionId));
		});
	}

	
	/**
	 * Convert query object to query string
	 * @param {Query | undefined} query 
	 * @returns {string} - string of the query parameters, including the starting ? if there are any parameters
	 */
	getQueryString(query) {
		// Build the queryString manually by formatting each key-value to be like key=value, encode them to 
		// percent-encoding and join them with the & symbol 
		// It needs to be done this way because building it with URLSearchParams().toString() turns spaces into + 
		// following the form encoding standard, instead of %20 following the percent encoding, which the api needs  
		let params = Object.entries(query)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&');

		// Manually replace !, ', (, ), and * to follow the percent encoding, since the RFC 3986 standard
		// reserves these characters and doing encodeURIComponent leaves them unencoded
		params = params.replace(
			/[!'()*]/g,
			(c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
		);
		const queryString = params ? `?${params}` : "";
		return queryString;
	}

	
	// TAGS

	/**
	 * Send a GET request to the Axios wrapper to fetch all the existing tags
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getTags(currSessionId, callback){
		this.get(`${this.apiurl}/tags`, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to create a new tag
	 * @param {object} body - object containing the tag_name and tag_color of the tag
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	createTag(body, currSessionId, callback){
		this.post(`${this.apiurl}/tags`, null, body, currSessionId, callback);
	}

	/**
	 * Send a PATCH request to the Axios wrapper to update the specified tag info 
	 * @param {number} tagId - id of the tag to update
	 * @param {object} body - object containing either the modified tag_name, the tag_color, or both
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	updateTag(tagId, body, currSessionId, callback){
		this.patch(`${this.apiurl}/tags/${tagId}`, null, body, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified tag 
	 * @param {number} tagId - id of the tag to delete
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteTag(tagId, currSessionId, callback){
		this.delete(`${this.apiurl}/tags/${tagId}`, currSessionId, callback);
	}


	// SIMLETS + SCHEDULERS

	/**
	 * Send a GET request to the Axios wrapper to fetch the SIMLETs matching the query search parameters
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimlets(query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of SIMLETs matching the query search parameters
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletsCount(query, currSessionId, callback) {
		this.get(`${this.apiurl}/simlets/count${this.getQueryString(query)}`, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to add a SIMLET 
	 * @param {object} body - object containing the simlet_name and simlet_description of the SIMLET
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	addSimlet(body, currSessionId, callback){
		this.post(`${this.apiurl}/simlets`, null, body, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to import a SIMLET 
	 * @param {object} newStudy - object containing the simlet_name and file of the SIMLET
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	importSimlet(newStudy, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/import`, null, newStudy, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to fetch
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimlet(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to export the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to export
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	exportSimlet(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/export`, currSessionId, callback);
	}

	/**
	 * Send a PATCH request to the Axios wrapper to update the specified SIMLET info 
	 * @param {number} simletId - id of the SIMLET to update
	 * @param {object} study - object containing either the modified simlet_name, the simlet_description, or both
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	updateSimlet(simletId, study, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}`, null, study, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to delete
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteSimlet(simletId, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}`, currSessionId, callback);
	}


	/**
	 * Send a GET request to the Axios wrapper to fetch the scheduled SIMLETs matching the query search parameters
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSchedulerSimlets(query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/scheduler${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of scheduled SIMLETs matching the query search parameters
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSchedulerSimletsCount(query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/scheduler/count${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the scheduler of the specified SIMLET 
	 * @param {number} simletId - id of the SIMLET to fetch
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletScheduler(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/schedule`, currSessionId, callback);
	}
	

	//SHLINK URL
	
	/**
	 * Send a POST request to the Axios wrapper to generate a shlink url for the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that the shlink will be generated for
	 * @param {string} customSlug - custom text that appears as the url
	 * @param {number} length - length of the custom slug
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	generateShlink(simletId, customSlug, length, currSessionId, callback){
		let body = {};
		if(length) {
			body.length = parseInt(length);
		}
		if(customSlug) {
			body.customSlug = customSlug;
		}
		this.post(`${this.apiurl}/simlets/${simletId}/shlink`, null, body, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the shlink url of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET the shlink will be fetched from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getShLink(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/shlink`, currSessionId, callback);
	}

	// TODO: Document / remove?
	updateShLink(simletId, customSlug, length, currSessionId, callback){
		let body = {};
		if(length) {
			body.length = parseInt(length);
		}
		if(customSlug) {
			body.customSlug = customSlug;
		}
		this.patch(`${this.apiurl}/simlets/${simletId}/shlink`, null, body, currSessionId, callback);
	}
	
	/**
	 * Send a DELETE request to the Axios wrapper to delete the shlink url of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET the shlink will be deleted from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteShLink(simletId, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/shlink`, currSessionId, callback);
	}


	// SESSIONS

	/**
	 * Send a GET request to the Axios wrapper to fetch the sessions matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the sessions from
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletSessions(simletId, query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of sessions matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the sessions from
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletSessionsCount(simletId, query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/count${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to add a session to the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to add the session to
	 * @param {object} body - object containing the session_name, session_description, session_status and session_can_be_manually_activated of the session
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	addSessionToSimlet(simletId, body, currSessionId, callback){
	   this.post(`${this.apiurl}/simlets/${simletId}/sessions`, null, body, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletSession(simletId,sessionId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}`, currSessionId, callback);
	}

	/**
	 * Send a PATCH request to the Axios wrapper to update the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {object} body - object containing either the modified session_name, the session_description, or both
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	updateSession(simletId, sessionId, body, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}`, null, body, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to delete
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteSession(simletId, sessionId, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}`, currSessionId, callback);
	}


	/**
	 * Send a PATCH request to the Axios wrapper to change the status of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {object} body - object containing the activate of the session
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	activateSession(simletId, sessionId, body, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/activate`, null, body, currSessionId, callback);
	}


	/**
	 * Send a PATCH request to the Axios wrapper to add the specified tag to the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {number} tagId - id of the tag to add
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	addTagToSession(simletId, sessionId, tag, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/tags/${tag}`, null, {}, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified tag to the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to update
	 * @param {number} tagId - id of the tag to delete
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteTagFromSession(simletId, sessionId, tag, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/tags/${tag}`, currSessionId, callback);
	}
	

	/**
	 * Send a GET request to the Axios wrapper to fetch the LRS data of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch the data from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSessionLRSData(simletId, sessionId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/lrs/statements`, currSessionId, callback);
	}
		
	// TODO: Document
	getSessionMoreLRSData(simletId, sessionId, more, currSessionId, callback){
		this.getLrsStatementsMore(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/lrs/statements`, more, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the LRS data for the test users of the specified session from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch the data from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSessionTestLRSData(simletId, sessionId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/lrs_test_statements`, currSessionId, callback);
	}

	// TODO: Document
	getSessionMoreTestLRSData(simletId, sessionId, more, currSessionId, callback){
		this.getLrsStatementsMore(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/lrs_test_statements`, more, currSessionId, callback);
	}

	
	// ACTIVITIES
	
	/**
	 * Send a GET request to the Axios wrapper to fetch all the activities in the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session that has the activities
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSessionActivities(simletId, sessionId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/activities`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch all the existing activity types
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityTypes(currSessionId, callback){
		this.get(`${this.apiurl}/activitytypes`, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to add an activity to the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to add the activity to
	 * @param {object} activity - object containing the activity info
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	addActivityToSession(simletId, sessionId, req, activity, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/activities`, req, activity, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the specified activity
	 * @param {number} activityId - id of the activity to fetch
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivity(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}`, currSessionId, callback);
	}

	// TODO: Document / remove?
	exportActivity(activityId, complete, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/export?complete=${complete}`, currSessionId, callback);
	}

	/**
	 * Send a PATCH request to the Axios wrapper to update the specified activity info of the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session that has the activity
	 * @param {number} activityId - id of the activity to update
	 * @param {Request} req 
	 * @param {object} activity - object containing the parameters to update
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	updateActivity(simletId, sessionId, activityId, req, activity, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/activities/${activityId}`, req, activity, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified activity of the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session that has the activity
	 * @param {number} activityId - id of the activity to delete
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteActivity(simletId, sessionId, activityId, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/activities/${activityId}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the Xasu config of the specified activity
	 * @param {number} activityId - id of the activity the config will be fetched from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityXasuConfig(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/tracker_config`, currSessionId, callback);
	}

	// TODO: Document / remove?
	setActivityTest(activityId, payload, currSessionId, callback){
		this.post(`${this.apiurl}/activities/${activityId}/test`, null, payload, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the target of the specified activity
	 * @param {number} activityId - id of the activity to fetch the target from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityTarget(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/target`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch all the available surveys
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSurveyList(currSessionId, callback){
		this.get(`${this.apiurl}/limesurvey/surveys`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the languages of the specified survey
	 * @param {number} surveyId - id of the survey to fetch the languages from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSurveyLanguages(surveyId, currSessionId, callback){
		this.get(`${this.apiurl}/limesurvey/${surveyId}/surveylanguages`, currSessionId, callback);
	}

	/**
	 * Send a PATCH request to the Axios wrapper to set the owner of a survey
	 * @param {number} surveyId - id of the survey to set the owner in
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	setSurveyOwner(surveyId, currSessionId, callback){
		this.patch(`${this.apiurl}/limesurvey/${surveyId}/surveyowner`, null, {}, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to check if the specified activity can be opened
	 * @param {number} activityId - id of the activity to check
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	isActivityOpenable(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/openable`, currSessionId, callback);
	}

	// TODO: Document / remove?
	openActivity(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/open`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the initialized data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to check
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityInitialized(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/initialized`, currSessionId, callback);
	}

	// TODO: Document / remove?
	setActivityInitialized(activityId, participantId, status, currSessionId, callback){
		this.post(`${this.apiurl}/activities/${activityId}/initialized?user=${participantId}`, null, { status: status }, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the completion data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the progress from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityProgress(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/progress`, currSessionId, callback);
	}

	// TODO: Document / remove?
	setActivityProgress(activityId, participantId, status, currSessionId, callback){
		const userQuery = participantId ? `?user=${participantId}` : '';
		this.post(`${this.apiurl}/activities/${activityId}/progress${userQuery}`, null, { status: status }, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the completion data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the completion from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityCompletion(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/completion`, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to set the completion status for the specified participant of the specified activity 
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {number} participantId - id of the participant to change the completion for 
	 * @param {boolean} status - true to set the activity as completed, false otherwise
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	setActivityCompletion(activityId, participantId, status, currSessionId, callback){
		this.post(`${this.apiurl}/activities/${activityId}/completion?user=${participantId}`, null, { status: status }, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to set the completion status for all the participants of the specified activity 
	 * @param {number} activityId - id of the activity to set the status for
	 * @param {object} body - object containing the status value (true to set the activity as completed, false otherwise)
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	setMultiActivityCompletion(activityId, body, currSessionId, callback) {
		this.post(`${this.apiurl}/activities/${activityId}/completion/multi`, null, body, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the hasResult data of all participants of the specified activity 
	 * @param {number} activityId - id of the activity to fetch the hasResult from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityHasResult(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/hasresult`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the result data of the specified participant from the specified activity with the specified type
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {number} participantId - id of the participant to fetch the result data from 
	 * @param {string} resultType - type of result of the result data to fetch (full/code/traces)
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityResult(activityId, participantId, resultType, currSessionId, callback){
		if (participantId != null) {
			// getActivityResultWithTypeForUser
			if (resultType != null) {
				this.get(`${this.apiurl}/activities/${activityId}/result?users=${participantId}&type=${resultType}`, currSessionId, callback);
			}
			// getActivityResultForUser
			else {
				this.get(`${this.apiurl}/activities/${activityId}/result?users=${participantId}&type=full`, currSessionId, callback);
			}
		} 
		else {
			// getActivityResultWithType
			if (resultType != null) {
				this.get(`${this.apiurl}/activities/${activityId}/result?type=${resultType}`, currSessionId, callback);
			}
			// getActivityResult
			else {
				this.get(`${this.apiurl}/activities/${activityId}/result?type=full`, currSessionId, callback);
			}
		}
	}

	// TODO: Document / remove?
	getActivitySuspension(activityId, currSessionId, callback) {
		this.get(`${this.apiurl}/activities/${activityId}/suspension`, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to change the specified activity status for the specified participant 
	 * @param {number} activityId - id of the activity that has the participant
	 * @param {number} participantId - id of the participant to set the status for  
	 * @param {object} body - object containing the status value (true to set the activity as suspended, false otherwise)
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	setActivitySuspension(activityId, participantId, body, currSessionId, callback) {
		const userQuery = participantId ? `?user=${participantId}` : '';
		this.post(`${this.apiurl}/activities/${activityId}/suspension${userQuery}`, null, body, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the LRS data for the specified activity
	 * @param {number} activityId - id of the activity to fetch the data from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityLRSData(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/lrs/statements`, currSessionId, callback);
	}

	// TODO: Document
	getActivityMoreLRSData(activityId, more, currSessionId, callback){
		this.getLrsStatementsMore(`${this.apiurl}/activities/${activityId}/lrs/statements`, more, currSessionId, callback);
	}
	
	/**
	 * Send a GET request to the Axios wrapper to fetch the LRS data for the test users of the specified activity
	 * @param {number} activityId - id of the activity to fetch the data from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getActivityTestLRSData(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/lrs_test_statements`, currSessionId, callback);
	}

	// TODO: Document
	getActivityMoreTestLRSData(activityId, more, currSessionId, callback){
		this.getLrsStatementsMore(`${this.apiurl}/activities/${activityId}/lrs_test_statements`, more, currSessionId, callback);
	}
	

	// GROUPS

	/**
	 * Send a GET request to the Axios wrapper to fetch the groups matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the groups from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletGroups(simletId, query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of groups matching the query search parameters in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the groups from
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletGroupsCount(simletId, query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups/count${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the groups matching the query search parameters in the specified SIMLET
	 * @param {boolean} useNewGeneration - true to search for groups created using new generation, false otherwise
	 * @param {number} simletId - id of the SIMLET to fetch the groups from
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletGroupsWithVersion(useNewGeneration, simletId, query, currSessionId, callback){
		query.useNewGeneration = useNewGeneration;
		this.get(`${this.apiurl}/simlets/${simletId}/groups${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of groups matching the query search parameters in the specified SIMLET
	 * @param {boolean} useNewGeneration - true to search for groups created using new generation, false otherwise
	 * @param {number} simletId - id of the SIMLET to fetch the groups from
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletGroupsWithVersionCount(useNewGeneration, simletId, query, currSessionId, callback){
		query.useNewGeneration = useNewGeneration;
		this.get(`${this.apiurl}/simlets/${simletId}/groups${this.getQueryString(query)}`, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to add a group to the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to add the group to
	 * @param {object} body - object containing the group_name, group_sandbox and group_use_new_generation of the group
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	addGroup(simletId, body, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/groups`, null, body, currSessionId, callback);
	}

	// TODO: Document / remove?
	addStudyGroup(simletId, groupId, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupId}`, null, {}, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to fetch
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getGroup(simletId, groupId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups/${groupId}`, currSessionId, callback);
	}
	
	/**
	 * Send a PATCH request to the Axios wrapper to update the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to update
	 * @param {object} group - object containing either the modified group_name, group_sandbox, group_use_new_generation, or any combination of them
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	updateGroup(simletId, groupId, group, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/groups/${groupId}`, null, group, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified group from the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId  - id of the group to delete
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteGroup(simletId, groupId, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/groups/${groupId}`, currSessionId, callback);
	}

	// TODO: Document / remove?
	deleteStudyGroup(simletId, groupId, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/groups/${groupId}`, currSessionId, callback);
	}


	// ALLOCATOR

	/**
	 * Send a GET request to the Axios wrapper to fetch all the allocator types
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getAllocatorTypes(currSessionId, callback){
		this.get(`${this.apiurl}/allocatortypes`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the allocator for the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the allocator from 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getAllocator(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/allocator`, currSessionId, callback);
	}

	// TODO: Document / remove?
	updateAllocator(simletId, allocator, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/allocator`, null, allocator, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to allocate the specified participant of the specified group to the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session and the group
	 * @param {number} groupId - id of the group that has the participant to allocate
	 * @param {number} sessionId - id of the session to allocate the participant in
	 * @param {object} body - object containing the participant_id of the participant to allocate 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	allocateToSession(simletId, groupId, sessionId, body, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/allocate/${sessionId}`, null, body, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to allocate the specified participant of the specified group to a random session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session and the group
	 * @param {number} groupId - id of the group that has the participant to allocate
	 * @param {object} data - object containing the participant_id of the participant to allocate 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	allocateRandomly(simletId, groupId, data, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/allocate/random`, null, data, currSessionId, callback);
	}


	// PARTICIPANTS

	/**
	 * Send a GET request to the Axios wrapper to fetch all the participants of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the participants from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletParticipants(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/participants`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of participants in each group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the participants from
	 * @param {Query | undefined} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletGroupsParticipantsCount(simletId, query, currSessionId, callback) {
		this.get(`${this.apiurl}/simlets/${simletId}/groups/participants/count${this.getQueryString(query)}`, currSessionId, callback);
	}
	
	/**
	 * Send a GET request to the Axios wrapper to fetch all the participants in the specified session of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the session
	 * @param {number} sessionId - id of the session to fetch the participants from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSessionParticipants(simletId, sessionId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/participants`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch all the participants in the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to fetch the participants from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getGroupParticipants(simletId, groupId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/participants`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the amount of participants in the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to fetch the participants from
	 * @param {Query | undefined} query - TODO: Remove?
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getGroupParticipantsCount(simletId, groupId, query, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/participants/count${this.getQueryString(query)}`, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to add a participant to the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to add the participant to
	 * @param {number} participantId - id of the participant to add
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	addGroupParticipant(simletId, groupId, participantId, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/participants/${participantId}`, null, { }, currSessionId, callback);
	}
	
	/**
	 * Send a DELETE request to the Axios wrapper to delete the specified participant from the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group to delete the participant from
	 * @param {number} participantId - id of the participant to delete
	 * @param {boolean} keycloakDelete - true to delete the user from keycloak, false otherwise 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteGroupParticipant(simletId, groupId, participantId, keycloakDelete, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/participants/${participantId}?keycloakDelete=${keycloakDelete}`, currSessionId, callback);
	}


	// USERS

	/**
	 * Send a GET request to the Axios wrapper to fetch the users matching the query search parameters
	 * @param {Query} query 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getUsers(query, currSessionId, callback){
		this.get(`${this.apiurl}/users${this.getQueryString(query)}`, currSessionId, callback);
	}

	/**
	 * Send a GET request to the Axios wrapper to fetch the user data with the specified username
	 * @param {string} username - username of the user to fetch 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getUser(username, currSessionId, callback){
		this.get(`${this.apiurl}/users?username=${username}`, currSessionId, callback);
	}

	
	/**
	 * Send a GET request to the Axios wrapper to fetch the user data of the current user
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getCurrentUser(currSessionId, callback){
		this.get(`${this.apiurl}/users/me`, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to add register a generated user to the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group where the user will be added to
	 * @param {string} token - token of the generated user 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	registerGeneratedUser(simletId, groupid, token, currSessionId, callback){
		logger.info(`Registering generated user with token ${token} for group ID ${groupid} in simlet ${simletId}`);
		let body = {
			token: token,
			role: "student",
			isToken : true
		};
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupid}/participants`, null, body, currSessionId, callback);
	}
	
	/**
	 * Send a POST request to the Axios wrapper to add a new participant to the specified group of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the group
	 * @param {number} groupId - id of the group where the participant will be added to
	 * @param {string} username - username of the new user
	 * @param {string} email - email of the new user
	 * @param {string} password - password of the new user
	 * @param {string} role - role of the new user (student/teacher) 
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	register(simletId, groupid, username, email, password, role, currSessionId, callback){
		let body = {
			username: username,
			email: email,
			password: password,
			role: role,
			isToken : false
		};
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupid}/participants`, null, body, currSessionId, callback);
	}

	// TODO: Document / remove?
	linkUserAccount(data, currSessionId, callback){
		this.post(`${this.apiurl}/users/link`, null, data, currSessionId, callback);
	}

	// TODO: Document / remove?
	processUserEvents(data, currSessionId, callback){
		this.post(`${this.apiurl}/users/events`, null, data, currSessionId, callback);
	}

	/**
	 * TODO: Document / remove?
	 * @param {string} username 
	 * @param {object} body 
	 * @param {Callback} callback 
	 */
	setRole(username, body, currSessionId, callback){
		const normalizedBody = (typeof body === 'string') ? { role: body } : body;
		this.patch(`${this.apiurl}/users/${username}`, null, normalizedBody, currSessionId, callback);
	}
	
	/**
	 * TODO: Document
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	islimesurveyadmin(currSessionId, callback){
		this.get(`${this.apiurl}/limesurvey/isAdmin`, currSessionId, callback);
	}
	
	
	// PERMISSIONS
	
	/**
	 * Send a GET request to the Axios wrapper to fetch the permissions data for all the coordinators of the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to fetch the data from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	getSimletDirectPermissions(simletId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/permissions`, currSessionId, callback);
	}

	/**
	 * Send a POST request to the Axios wrapper to add permissions data for a user to the specified SIMLET
	 * @param {number} simletId - id of the SIMLET to add the data to
	 * @param {object} permissions - object containing the user_id, and permission type (READ/WRITE)
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	createSimletPermissions(simletId, permissions, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/permissions`, null, permissions, currSessionId, callback);
	}

	// TODO: Document / remove?
	getSimletPermissionsForUser(simletId, user_id, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/permissions/${user_id}`, currSessionId, callback);
	}

	// TODO: Document / remove?
	patchSimletPermissionsForUser(simletId, user_id, permissions, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/permissions/${user_id}`, null, permissions, currSessionId, callback);
	}

	/**
	 * Send a DELETE request to the Axios wrapper to delete the permissions of the specified user in the specified SIMLET
	 * @param {number} simletId - id of the SIMLET that has the user
	 * @param {number} userId - id of the user to remove the permissions from
	 * @param {CurrSessionId} currSessionId
	 * @param {Callback} callback 
	 */
	deleteSimletPermissionsForUser(simletId, user_id, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/permissions/${user_id}`, currSessionId, callback);
	}


	// TODO: Document / remove?
	getSessionPermissions(simletId, sessionId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/permissions`, currSessionId, callback);
	}

	// TODO: Document / remove?
	createSessionPermissions(simletId, sessionId, permissions, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/permissions`, null, permissions, currSessionId, callback);
	}

	// TODO: Document / remove?
	getSessionPermissionsForUser(simletId, sessionId, user_id, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/permissions/${user_id}`, currSessionId, callback);
	}

	// TODO: Document / remove?
	patchSessionPermissionsForUser(simletId, sessionId, user_id, permissions, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/permissions/${user_id}`, null, permissions, currSessionId, callback);
	}

	// TODO: Document / remove?
	deleteSessionPermissionsForUser(simletId, sessionId, user_id, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/sessions/${sessionId}/permissions/${user_id}`, currSessionId, callback);
	}


	// TODO: Document / remove?
	getGroupDirectPermissions(simletId, groupId, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/permissions`, currSessionId, callback);
	}

	// TODO: Document / remove?
	createGroupPermissions(simletId, groupId, permissions, currSessionId, callback){
		this.post(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/permissions`, null, permissions, currSessionId, callback);
	}

	// TODO: Document / remove?
	getGroupPermissionsForUser(simletId, groupId, user_id, currSessionId, callback){
		this.get(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/permissions/${user_id}`, currSessionId, callback);
	}

	// TODO: Document / remove?
	patchGroupPermissionsForUser(simletId, groupId, user_id, permissions, currSessionId, callback){
		this.patch(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/permissions/${user_id}`, null, permissions, currSessionId, callback);
	}

	// TODO: Document / remove?
	deleteGroupPermissionsForUser(simletId, groupId, user_id, currSessionId, callback){
		this.delete(`${this.apiurl}/simlets/${simletId}/groups/${groupId}/permissions/${user_id}`, currSessionId, callback);
	}


	// TODO: Document + classify / remove?

	addToTaskList(body, currSessionId, callback){
		this.post(`${this.apiurl}/tasklist`, null, body, currSessionId, callback);
	}

	getMinioDataUrl(activityId, currSessionId, callback){
		this.get(`${this.apiurl}/activities/${activityId}/presignedurl`, currSessionId, callback);
	}

	getLrsStatementsMore(baseUrl, more, currSessionId, callback){
		const encodedMore = encodeURIComponent(String(more || ''));
		this.get(`${baseUrl}?more=${encodedMore}`, currSessionId, callback);
	}


	// TODO: Document
	// LTI

	getLtiTools(currSessionId, callback){
		this.get(`${this.apiurl}/lti/tools`, currSessionId, callback);
	}

	addLtiTool(tool, currSessionId, callback){
		this.post(`${this.apiurl}/lti/tools`, null, tool, currSessionId, callback);
	}

	deleteLtiTool(tool, currSessionId, callback){
		this.delete(`${this.apiurl}/lti/tools/${tool}`, currSessionId, callback);
	}

	getLtiPlatforms(study, currSessionId, callback){
		let query = '';
		if(study){
			query = '?searchString=' + encodeURI(`{"simletId":"${study}"}`);
		}

		this.get(`${this.apiurl}/lti/platforms${query}`, currSessionId, callback);
	}

	addLtiPlatform(platform, currSessionId, callback){
		this.post(`${this.apiurl}/lti/platforms`, null, platform, currSessionId, callback);
	}

	removePlatform(platform_id, currSessionId, callback) {
		this.delete(`${this.apiurl}/lti/platforms/${platform_id}`, currSessionId, callback);
	}
}

module.exports = new Simva();