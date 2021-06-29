var jwt = require('jsonwebtoken');

var passport = require('passport');

let request = require('request');
let querystring = require('querystring');

module.exports = {
	setUser: function(req, user){
		console.log(user);
		let decoded = jwt.decode(user.jwt);

		if (user.data.provider != 'simva') {
		user.data.roles = decoded.realm_access.roles;
		user.data.role = this.getRoleFromJWT(decoded);
		}
		req.session.user = user;
	},

	getProfileFromJWT: function(token){
		let profile = {};
		let simvaJwtToken = jwt.decode(token);
		profile.provider = simvaJwtToken.iss
		profile.id = simvaJwtToken.data.id;
		profile.username = simvaJwtToken.data.username;
		profile.email = simvaJwtToken.email;
		profile.roles = [simvaJwtToken.data.role];
		profile.role = simvaJwtToken.data.role;

		return profile;
	},

	getRoleFromJWT: function(decoded){
		let role = 'student';

		for (var i = decoded.realm_access.roles.length - 1; i >= 0; i--) {
			if(decoded.realm_access.roles[i] === 'teacher' || decoded.realm_access.roles[i] === 'researcher'){
				role = 'teacher';
				break;
			};
		}

		return role;
	}
}