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
		let role = 'norole';
		if(decoded.realm_access.roles.includes('teacher') || decoded.realm_access.roles.includes('researcher')){
			role = 'teacher';
		} else if(decoded.realm_access.roles.includes('teaching-assistant') || decoded.realm_access.roles.includes('student')){
			role = 'student';
		};
		return role;
	}
}