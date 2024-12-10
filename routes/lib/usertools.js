var jwt = require('jsonwebtoken');

var passport = require('passport');

let axios = require('axios');

const logger = require('../../logger');

module.exports = {
	setUser: function(req, user){
		let decoded = jwt.decode(user.jwt);
		logger.info(`JWT : ${JSON.stringify(decoded)}`);
		user.data.roles = decoded.realm_access.roles;
		user.data.role = this.getRoleFromJWT(decoded);
		req.session.user = user;
	},

	setClientSession: function(req, clientId){
		req.session.clientId = clientId;
	},

	authExpired: function(session, config, callback){
		let current = Math.floor(Date.now() / 1000);
		let jwtdecoded = this.decodeJWT(session.user.jwt);
		try {
			let expiration = parseInt(jwtdecoded.exp);
			if(current > expiration){
				logger.info(`authExpired() - JWT: ${JSON.stringify(jwtdecoded)}`);
				logger.info(`authExpired() - Expiration: ${expiration}`);
				logger.info("authExpired() - Token Expired");
				this.refreshAuth(session, config, callback);
			}else{
				logger.info("authExpired() - Token OK");
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
		logger.info(`getProfileFromJWT() : ${JSON.stringify(simvaJwtToken)}`);
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
		if(decoded.realm_access.roles.includes('teacher') || decoded.realm_access.roles.includes('researcher')){
			role = 'teacher';
		} else if(decoded.realm_access.roles.includes('teaching-assistant') || decoded.realm_access.roles.includes('student')){
			role = 'student';
		};
		return role;
	},

	refreshAuth: function(session, config, callback){
		if(session.user && session.user.refreshToken){
			logger.info(`refreshAuth() - Refresh Token : ${session.user.refreshToken}`)
			clientConfig= `${config.sso.clientId}:${config.sso.clientSecret}`
			const querystring = new URLSearchParams({
				'grant_type': 'refresh_token',
				'refresh_token': session.user.refreshToken
			  });
			axios.post(`${config.sso.url}/realms/${config.sso.realm}/protocol/openid-connect/token`, querystring, {
				headers: {
				  'Authorization': `Basic ${Buffer.from(clientConfig).toString('base64')}`,
				  'Content-Type': 'application/x-www-form-urlencoded'
				}
			}).then(response => {
				try {
					logger.info(`refreshAuth() - Body : ${response.data}`);
					let simvaToken = response.data.access_token;
					let simvaRefreshToken = response.data.refresh_token;
					logger.info(`refreshAuth() - Access Token : ${simvaToken}`);
					logger.info(`refreshAuth() - Refresh Token : ${simvaRefreshToken}`);
					if(simvaToken == "undefined" || simvaToken == null) {
						callback({
							status: 500,
							data: {
								message: 'Token not active.',
								error: b
							}
						});
					} else {
						callback(null, response.data);
					}
				} catch(e) {
					logger.info(e);
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