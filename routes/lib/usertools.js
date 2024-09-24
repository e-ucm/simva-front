var jwt = require('jsonwebtoken');

var passport = require('passport');

let axios = require('axios');

module.exports = {
	setUser: function(req, user){
		let decoded = jwt.decode(user.jwt);
		console.log(`JWT : ${JSON.stringify(decoded)}`);
		user.data.roles = decoded.realm_access.roles;
		user.data.role = this.getRoleFromJWT(decoded);
		console.log(`User Role : ${user.data.role}`);
		req.session.user = user;
		console.log(`User : ${user}`);
	},

	authExpired: function(req, config, callback){
		let current = Math.floor(Date.now() / 1000);
		let jwtdecoded = this.decodeJWT(req.session.user.jwt);
		try {
			let expiration = parseInt(jwtdecoded.exp);
			if(current > expiration){
				console.log(`authExpired() - JWT: ${JSON.stringify(jwtdecoded)}`);
				console.log(`authExpired() - Expiration: ${expiration}`);
				console.log("authExpired() - Token Expired");
				this.refreshAuth(req, config, callback);
			}else{
				console.log("authExpired() - Token OK");
				callback();
			}
		} catch(e) {
			callback({
				status: 500,
				data: {
					message: 'Unable to parse accessToken',
					error: e
				}
			});
		}
	},

	decodeJWT: function(token){
		return jwt.decode(token);
	},

	getProfileFromJWT: function(token){
		let profile = {};
		let simvaJwtToken = this.decodeJWT(token);
		console.log(`getProfileFromJWT() : ${JSON.stringify(simvaJwtToken)}`);
		profile.provider = simvaJwtToken.iss;
		profile.id = simvaJwtToken.data.id;
		profile.username = simvaJwtToken.data.username;
		profile.email = simvaJwtToken.email;
		profile.roles = simvaJwtToken.realm_access.roles;
		profile.role = this.getRoleFromJWT(simvaJwtToken);
		return profile;
	},

	getRoleFromJWT: function(decoded){
		let role = 'norole';
		if(decoded.realm_access.roles.includes('administrator')){
			role = 'admin';
		} else if(decoded.realm_access.roles.includes('teacher') || decoded.realm_access.roles.includes('researcher')){
			role = 'teacher';
		} else if(decoded.realm_access.roles.includes('teaching-assistant') || decoded.realm_access.roles.includes('student')){
			role = 'student';
		};
		console.log(role);
		return role;
	},

	refreshAuth: function(req, config, callback){
		if(req.session.user && req.session.user.refreshToken){
			console.log(`refreshAuth() - Refresh Token : ${req.session.user.refreshToken}`)
			clientConfig= `${config.sso.clientId}:${config.sso.clientSecret}`
			const querystring = new URLSearchParams({
				'grant_type': 'refresh_token',
				'refresh_token': req.session.user.refreshToken
			  });
			axios.post(`${config.sso.url}/realms/${config.sso.realm}/protocol/openid-connect/token`, querystring, {
				headers: {
				  'Authorization': `Basic ${Buffer.from(clientConfig).toString('base64')}`,
				  'Content-Type': 'application/x-www-form-urlencoded'
				}
			}).then(response => {
				try {
					console.log(`refreshAuth() - Body : ${response.body}`);
					let b = JSON.parse(response.body);
					let simvaToken = b.access_token;
					console.log(`refreshAuth() - Access Token : ${simvaToken}`);
					if(simvaToken == "undefined" || simvaToken == null) {
						callback({
							status: 500,
							data: {
								message: 'Token not active.',
								error: b
							}
						});
					} else {
						callback(null, simvaToken);
					}
				} catch(e) {
					console.log(e);
					callback({
						status: 500,
						data: {
							message: 'Unable to refresh accessToken',
							error: e
						}
					});
				}
			})
			.catch(error => {
				callback({
					status: 500,
					data: {
						message: 'Unable to refresh accessToken',
						error: error
					}
				});
			});
		}else{
			callback({
				status: 401,
				data: {
					message: 'No user or refreshToken'
				}
			});
		}
	}
}