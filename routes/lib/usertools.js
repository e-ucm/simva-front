var jwt = require('jsonwebtoken');

var passport = require('passport');

let request = require('request');
let querystring = require('querystring');

module.exports = {
	setUser: function(req, user){
		console.log("USER : " + JSON.stringify(user));
		let decoded = jwt.decode(user.jwt);
		console.log("JWT : " + JSON.stringify(decoded));
		if (user.data.provider != 'simva') {
		user.data.roles = decoded.realm_access.roles;
		user.data.role = this.getRoleFromJWT(decoded);
		}
		req.session.user = user;
	},

	getProfileFromJWT: function(token){
		let profile = {};
		let simvaJwtToken = jwt.decode(token);
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
		console.log("Role : " + JSON.stringify(decoded));
		let role = 'norole';

		for (var i = decoded.realm_access.roles.length - 1; i >= 0; i--) {
			if(decoded.realm_access.roles[i] === 'teacher' || decoded.realm_access.roles[i] === 'researcher'){
				role = 'teacher';
			} else if(decoded.realm_access.roles[i] === 'teaching-assistant' || decoded.realm_access.roles[i] === 'student'){
				role = 'student';
			};
		}

		return role;
	}
}