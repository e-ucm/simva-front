var jwt = require('jsonwebtoken');

var passport = require('passport');

let axios = require('axios');
const logger = require('../../logger');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const userClientsListManager = require('../lib/userClientsListManager');
let usertools = require('../lib/usertools');
const cron = require('node-cron');

module.exports = function(auth, config){

  // Passport configuration
  // Using Keycloak openID
  var KeyCloakStrategy = require('passport-keycloak-oauth2-oidc').Strategy;

  class SimvaKeyCloakStrategy extends KeyCloakStrategy {
    authorizationParams(options) {
      const params = super.authorizationParams(options);
      if ('simva_user_token' in options) {
        params.simva_user_token = options.simva_user_token;
       }
      if ('login_hint' in options) {
        params.login_hint = options.login_hint;
       }
      return params;
    }
  }
  
  let keycloakConfig = {
    clientID: config.sso.clientId,
    realm: config.sso.realm,
    publicClient: config.sso.publicClient,
    clientSecret: config.sso.clientSecret,
    sslRequired: config.sso.sslRequired,
    scope: "openid profile email roles",
    authServerURL: config.sso.url,
    callbackURL: `${config.simva.url}/users/openid/return`
  }

  logger.info('--- SSO CONFIG ---');
  logger.info(keycloakConfig);
  logger.info('------------------');

  passport.use('openid', new SimvaKeyCloakStrategy(
    keycloakConfig,
    function(accessToken, refreshToken, profile, done) {
      let user = {};

      user.data = profile;
      user.jwt = accessToken;
      user.refreshToken = refreshToken;

      done(null, user);
    })
  );

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.redirect('../');
  });
  
  router.get('/login', function(req, res, next) {
      res.render('users_login', { config: config });
  });

  router.get('/role_selection', auth, function(req, res, next) {
    res.render('users_role_edit', { config: config, user: req.session.user });
  });

  
  router.get('/contact_admin', auth, function(req, res, next) {
    res.render('users_contact_admin', { config: config, user: req.session.user , error : req.query.error });
  });

  router.get('/openid', passport.authenticate('openid'));

  router.get('/openidscheduler', (req, res, next) => {
    const options = {
      login_hint : req.query.study,
      simva_user_token: true
    };
    passport.authenticate('openid', options)(req, res, next);
  }
);

  router.get('/openid/return', function (req, res, next) {
    passport.authenticate('openid', { failureRedirect: '/users/login' }, function(err, user) {
      logger.info('/openid/return: USER');
      
      if(err){
        return res.redirect('../login');
      }
      usertools.setUser(req, user);
      logger.debug(user);
      const intendedUrl = req.session.intendedUrl || '/';
      delete req.session.intendedUrl;
      userClientsListManager.addUserSession(req.session);
      logger.debug(req.session);
      res.redirect(intendedUrl);
    })(req, res, next);
  });

  router.get('/logout', auth, function(req, res, next){
    let sessionId = req.session.id;
    if(req.session.user.refreshToken){
      clientConfig= `${config.sso.clientId}:${config.sso.clientSecret}`
      const querystring = new URLSearchParams({
				'grant_type': 'refresh_token',
				'refresh_token': req.session.user.refreshToken
			});
			axios.post(`${config.sso.url}/realms/${config.sso.realm}/protocol/openid-connect/logout`, querystring, {
          headers: {
            'Authorization': `Basic ${Buffer.from(clientConfig).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
      })
      .then(response => {
        userClientsListManager.removeSession(sessionId);
        req.session.user = null;
        res.redirect('login');
      })
      .catch(error => {
        res.redirect('/');
      })
    }else{
      userClientsListManager.removeSession(sessionId);
      req.session.user = null;
      res.redirect('login');
    }
  });

  router.get('/refresh_auth', auth, function (req, res, next) {
    usertools.refreshAuth(req.session, config, function(error, result){
      if(!error){
        userClientsListManager.refreshAuth(req.session.id, result.access_token, result.refresh_token);
        req.session.user.jwt = result.access_token;
        req.session.refreshToken = result.refresh_token;
        res.send(result);
      }else{
        res.status(error.status).send(error.data);
      }
    });
  });

  return router;
}