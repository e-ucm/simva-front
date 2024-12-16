var axios = require('axios');

module.exports = {
	post: function (url, body, callback, jwt, apikey) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}

		axios
			.post(url, body, { headers })
			.then((response) => {
				callback(null, response.data);
			})
			.catch((error) => {
				callback(error);
			});
	},

	patch: function (url, body, callback, jwt, apikey) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
		axios
			.patch(url, body, { headers })
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},

	put: function (url, body, callback, jwt, apikey) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}
		if(apikey) {
			headers['X-Api-Key'] = `${apikey}`;
		}
		axios
			.put(url, body, { headers })
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
