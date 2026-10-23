var axios = require('axios');
const logger = require('../../logger');
const config = require('../../config');

/**
 * @typedef {string} RequestUrl - url to send the request to
 * @typedef {object} Request - HTTP Request object passed from the bff
 * @typedef {object} RequestBody - data to send in the request
 * @typedef {function} RequestCallback - function to call when the request gets a response (either on success or on error) 
 * @typedef {string | undefined} JWT - Auth credential (JSON Web Token) of the current session
 * @typedef {string | undefined} ApiKey - Auth credential (API Key) of the current session
 */

/**
 * Determine the request headers based on the auth credential
 * @param {JWT} jwt 
 * @param {ApiKey} apikey 
 * @returns {object} - object containing the request headers
 */
const determineHeaders = function(jwt, apikey) {
	let headers = {};
	if (jwt) {
		headers['Authorization'] = `Bearer ${jwt}`;
	}
	if (apikey) {
		headers['X-Api-Key'] = `${apikey}`;
	}
	return headers;
}

module.exports = {
	// AXIOS WRAPPERS

	/**
	 * Send a GET request to the specified url
	 * @param {RequestUrl} url 
	 * @param {RequestCallback} callback 
	 * @param {JWT} jwt 
	 * @param {ApiKey} apikey 
	 */
	get: function (url, callback, jwt, apikey) {
		const headers = determineHeaders(jwt, apikey);
		axios
			.get(url, { headers })
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},
	
	/**
	 * Send a POST request to the specified url
	 * @param {RequestUrl} url 
	 * @param {Request} req 
	 * @param {RequestBody} body 
	 * @param {RequestCallback} callback 
	 * @param {JWT} jwt 
	 * @param {ApiKey} apikey 
	 */
	post: function (url, req, body, callback, jwt, apikey) {
		let headers = determineHeaders(jwt, apikey);
		let transferedBody = body;
		
		if (req != undefined && req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
			logger.info("Body is form-data, setting Content-Type to multipart/form-data");
			delete body.formData;
			headers['Content-Type'] = 'multipart/form-data';
			transferedBody = req;
		} else {
			logger.info("post() - Body is not FormData, setting Content-Type to application/json");
			headers['Content-Type'] = 'application/json';
		}

		axios
			.post(url, transferedBody,
				{ 
					headers,
					maxContentLength: Infinity,
            		maxBodyLength: Infinity
				}
			)
			.then((response) => {
				callback(null, response.data);
			})
			.catch((error) => {
				callback(error);
			});
	},

	/**
	 * Send a PATCH request to the specified url
	 * @param {RequestUrl} url 
	 * @param {Request} req 
	 * @param {RequestBody} body 
	 * @param {RequestCallback} callback 
	 * @param {JWT} jwt 
	 * @param {ApiKey} apikey 
	 */
	patch: function (url, req, body, callback, jwt, apikey) {
		let headers = determineHeaders(jwt, apikey);
		let transferedBody = body;
		
		if (body.formData != undefined) {
			logger.info("Body is form-data, setting Content-Type to multipart/form-data");
			delete body.formData;
			headers['Content-Type'] = 'multipart/form-data';
			transferedBody = req;
		} else {
			logger.info("patch() - Body is not FormData, setting Content-Type to application/json");
			headers['Content-Type'] = 'application/json';
		}

		axios
			.patch(url, transferedBody, 
				{ 
					headers,
					maxContentLength: Infinity,
            		maxBodyLength: Infinity
				}
			)
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},

	/**
	 * Send a PUT request to the specified url
	 * @param {RequestUrl} url 
	 * @param {Request} req 
	 * @param {RequestBody} body 
	 * @param {RequestCallback} callback 
	 * @param {JWT} jwt 
	 * @param {ApiKey} apikey 
	 */
	put: function (url, req, body, callback, jwt, apikey) {
		let headers = determineHeaders(jwt, apikey);
		let transferedBody = body;
	
		if (body.formData != undefined) {
			logger.info("Body is form-data, setting Content-Type to multipart/form-data");
			delete body.formData;
			headers['Content-Type'] = 'multipart/form-data';
			transferedBody = req;
		} else {
			logger.info("put() - Body is not FormData, setting Content-Type to application/json");
			headers['Content-Type'] = 'application/json';
		}
			
		axios
			.put(url, transferedBody, 
				{ 
					headers,
					maxContentLength: Infinity,
            		maxBodyLength: Infinity
				}
			)
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},

	/**
	 * Send a DELETE request to the specified url
	 * @param {RequestUrl} url 
	 * @param {RequestCallback} callback 
	 * @param {JWT} jwt 
	 * @param {ApiKey} apikey 
	 */
  	delete: function (url, callback, jwt, apikey) {
		const headers = determineHeaders(jwt, apikey);
		axios
		  .delete(url, { headers })
		  .then((response) => callback(null, response.data))
		  .catch((error) => callback(error));
  	},


	// PARAMETER HANDLING

	/**
	 * Remove trailing and leading spaces of any string the body has as value
	 * @param {object} body - object containing the request body 
	 * @returns {object} - body object with all strings trimmed 
	 */
	trimBodyStrings(body) {
		if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
			Object.entries(body).forEach(([key, value]) => {
				if (typeof value === 'string' || value instanceof String) {
					body[key] = value.replace(/^\s+|\s+$/g, '');
				}
			});
		}
		return body;
	},

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
	},

	/**
	 * Convert the username of a participant into the query string needed to fetch only the LRS statements of that participant
	 * @param {string | undefined} actorName - username of the participant whose statements to fetch (statements of every
	 * participant if it isn't set)
	 * @returns {string} - string of the query parameters, including the starting ? if there are any parameters
	 */
	getLrsActorQueryString(actorName) {
		if (!actorName) {
			return "";
		}
		// The api filters the statements by the agent (the xAPI 2.0 name of the actor) as a json string, whose
		// account is identified by the username of the participant and the external url of the platform
		// (the homePage the LRS clients send)
		const agent = JSON.stringify({ account: { name: actorName, homePage: config.simva.url } });
		return this.getQueryString({ agent: agent });
	},

}
