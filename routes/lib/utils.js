var axios = require('axios');

module.exports = {
	post: function (url, body, callback, jwt) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
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

	patch: function (url, body, callback, jwt) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}

		axios
			.patch(url, body, { headers })
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},

	put: function (url, body, callback, jwt) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}

		axios
			.put(url, body, { headers })
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},

	get: function (url, callback, jwt) {
		const headers = {};
		if (jwt) {
			headers['Authorization'] = `Bearer ${jwt}`;
		}

		axios
			.get(url, { headers })
			.then((response) => callback(null, response.data))
			.catch((error) => callback(error));
	},
	
  	delete: function (url, callback, jwt) {
		const headers = {};
		if (jwt) {
		  headers['Authorization'] = `Bearer ${jwt}`;
		}

		axios
		  .delete(url, { headers })
		  .then((response) => callback(null, response.data))
		  .catch((error) => callback(error));
  	},
}
