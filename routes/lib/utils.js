var axios = require('axios');
const logger = require('../../logger');

module.exports = {
	post: function (url, req, body, callback, jwt, apikey) {
		const headers =  {};
		let transferedBody = body;
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
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

	patch: function (url, req, body, callback, jwt, apikey) {
		const headers = {};
		let transferedBody = body;
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
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

	put: function (url, req, body, callback, jwt, apikey) {
		const headers = {};
		let transferedBody = body;
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
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

	get: function (url, callback, jwt, apikey) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
		axios
			.get(url, { headers })
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},
	
  	delete: function (url, callback, jwt, apikey) {
		const headers = {};
		if (jwt) {
		  headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
		axios
		  .delete(url, { headers })
		  .then((response) => callback(null, response.data))
		  .catch((error) => callback(error));
  	},
}
