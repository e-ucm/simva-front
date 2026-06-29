var axios = require('axios');
const logger = require('../../logger');

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
}
