var jwt = require('jsonwebtoken');

var passport = require('passport');

let request = require('request');
let querystring = require('querystring');

module.exports = {
	setUser: function(req, user){
		let decoded = jwt.decode(user.jwt);
		console.log("JWT : " + JSON.stringify(decoded));
		user.data.roles = decoded.realm_access.roles;
		user.data.role = this.getRoleFromJWT(decoded);
		req.session.user = user;
	},

	authExpired: function(req, config, callback){
		let current = Math.floor(Date.now() / 1000);
		let expiration = parseInt(this.decodeJWT(req.session.user.jwt).exp);

		if(current > expiration){
			this.refreshAuth(req, config, callback);
		}else{
			callback();
		}
	},

	decodeJWT: function(token){
		return jwt.decode(token);
	},

	getProfileFromJWT: function(token){
		let profile = {};
		let simvaJwtToken = this.decodeJWT(token);
		console.log(JSON.stringify(simvaJwtToken));
		profile.provider = simvaJwtToken.iss
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

	refreshAuth: function(req, config, callback){
		if(req.session.user && req.session.user.refreshToken){
			request.post({
				url: config.sso.url + '/realms/' + config.sso.realm + '/protocol/openid-connect/token',
				headers: {
					'Authorization': 'Basic ' + Buffer.from(config.sso.clientId + ':' + config.sso.clientSecret).toString('base64'),
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: querystring.stringify({
					'grant_type': 'refresh_token',
					'refresh_token': req.session.user.refreshToken
				})
			}, function(error, response, body){
				if(!error){
					body = JSON.parse(body);
					req.session.user.jwt = body.access_token;
					callback(null, body);
				}else{
					callback({
						status: 500,
						data: {
							message: 'Unable to refresh accessToken',
							error: error
						}
					});
				}
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