var jwt = require('jsonwebtoken');

var passport = require('passport');

let axios = require('axios');

const logger = require('../../logger');
const config = require('../../config');
const userClientsListManager = require("./userClientsListManager");


class UserTools {
    constructor() {
    }

	redirectOpenId(level, req, res) {
		var pre = '/';
		for(var i = 0; i < level; i++){
		  pre += '../';
		}
		req.session.intendedUrl=`${req.originalUrl}`;
		if(req.session.intendedUrl.toLowerCase().includes("scheduler")) {
		  logger.info("scheduler");
		  const keyword = "scheduler/";
		  // Find the index of the keyword
		  const index = req.session.intendedUrl.indexOf(keyword);
		  var result;
		  if (index !== -1) {
			// Extract everything after "scheduler/"
			result = req.session.intendedUrl.substring(index + keyword.length);
		  } else {
			result=""
		  }
		  return res.redirect(`${pre}users/openidscheduler?study=${result}`);
		} else {
		  return res.redirect(`${pre}users/openid`); 
		}
	}

	auth(level){
		var tmp=this;
		return function(req, res, next) {
		  let simvaToken = userClientsListManager.getJWT(req.session.id);
		  if (req.session && req.session.user && req.session.user.jwt){
			tmp.authExpiredAndRefreshAuthWithCallback(userClientsListManager.getSession(req.session.id), (error, result) => {
				if(error) {
					tmp.redirectOpenId(level, req, res);
				} else {
					logger.debug("auth() - Token OK");
					return next();
				}
			});
		  } else if(simvaToken){
			logger.info("auth() - New token");
			let session = req.session;
			let profile = tmp.getProfileFromJWT(simvaToken);
			session.user.data = profile;
			session.user.jwt = simvaToken;
			userClientsListManager.addClient(session);
			req.session.user.jwt = true;
			logger.info("auth() - New token done");
			return next();
		  }else{
			tmp.redirectOpenId(level, req, res);
		  }
		};
	}

	async getRefreshSessionsList() {
        let sessionsToSend = [];
        for (let [sessionId, sessionData] of userClientsListManager.sessions) {
            let ok = await this.isAuthExpiredPromise(sessionData.session);
            if(ok) {
                sessionsToSend.push(ok);
            }
        }
        return sessionsToSend;
    }

    async isAuthExpiredPromise(session) {
        return new Promise((resolve, reject) => {
            this.isAuthExpired(session, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    if(result.type == "expired") {
                        resolve(session.id);
                    }
                }
            });
        });
    }

    authExpiredAndRefreshAuthWithCallback(session, callback) {
        this.authExpired(session, config, (error, result) => {
            if(error) {
                logger.info(JSON.stringify(error));
				if(session && session.id) {
             	   userClientsListManager.removeSession(session.id);
				}
                callback(error);
            } else {
                if(result) {
                    logger.info(JSON.stringify(result));
                    userClientsListManager.refreshAuth(session.id, result.access_token, result.refresh_token);
                    logger.info("Auth Refreshed");
                    callback(null, {message:"Auth Refreshed"});
                } else {
                    callback(null, {message:"Auth OK"});
                }
            }
        });
    }

	setUser(req, user){
		let decoded = jwt.decode(user.jwt);
		logger.info(`JWT : ${JSON.stringify(decoded)}`);
		req.session.user.data.roles = decoded.realm_access.roles;
		req.session.user.data.role = this.getRoleFromJWT(decoded);
	}

	isAuthExpired(session, callback){
		try {
			let current = Math.floor(Date.now() / 1000);
			let jwtdecoded = this.decodeJWT(session.user.jwt);
			let expiration = parseInt(jwtdecoded.exp);
			if(current > expiration){
				logger.info(`authExpired() - JWT: ${JSON.stringify(jwtdecoded)}`);
				logger.info(`authExpired() - Expiration: ${expiration}`);
				logger.info("authExpired() - Token Expired");
				callback(null, {type:"expired"});
			}else{
				logger.debug("authExpired() - Token OK");
				callback(null, {type:"ok"});
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
	}

	authExpired(session, config, callback) {
		this.isAuthExpired(session, (error, result) => {
			if(error) {
				callback(error);
			} else {
				if(result.type == "expired") {
					this.refreshAuth(session, config, callback);
				} else {
					callback();
				}
			}
		});
	}

	decodeJWT(token){
		return jwt.decode(token);
	}

	getProfileFromJWT(token){
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
	}

	getRoleFromJWT(decoded){
		let role = 'norole';
		if(decoded.realm_access.roles.includes('teacher') || decoded.realm_access.roles.includes('researcher')){
			role = 'teacher';
		} else if(decoded.realm_access.roles.includes('teaching-assistant') || decoded.realm_access.roles.includes('student')){
			role = 'student';
		};
		return role;
	}

	refreshAuth(session, config, callback){
		if(session.user && session.user.refreshToken){
			logger.info(`refreshAuth() - Refresh Token : ${session.user.refreshToken}`);
			const clientConfig= `${config.sso.clientId}:${config.sso.clientSecret}`;
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
					let simvaToken = response.data.access_token;
					let simvaRefreshToken = response.data.refresh_token;
					logger.debug(`refreshAuth() - Access Token : ${simvaToken}`);
					logger.debug(`refreshAuth() - Refresh Token : ${simvaRefreshToken}`);
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

	generateUsername(algorithm, length) {
		switch (algorithm) {
		  case 'alphanumeric':
			return this.randomString(length, 'a#');
			break;
		  case 'base58':
			return this.randomString(length, 'b*');
			break;
		  case 'letters':
		  default: 
			return this.randomString(length, 'a');
			break;
		}
	  }
	  
	  randomString(length, chars) {
			var mask = '';
			if (chars.indexOf('b') > -1) mask += 'abcdefghijkmnopqrstuvwxyz';
			if (chars.indexOf('B') > -1) mask += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
			if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
			if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			if (chars.indexOf('*') > -1) mask += '123456789';
			if (chars.indexOf('#') > -1) mask += '0123456789';
			if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
			var result = '';
			for (var i = length; i > 0; i--) result += mask[Math.floor(Math.random() * mask.length)];
			return result;
	  }
}

module.exports = new UserTools();