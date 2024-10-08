var jwt = require('jsonwebtoken');

var passport = require('passport');

let axios = require('axios');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let usertools = require('../lib/usertools');

module.exports = function(auth, config){

  // Passport configuration
  // Using Keycloak openID
  var KeyCloakStrategy = require('passport-keycloak-oauth2-oidc').Strategy;

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

  console.log('--- SSO CONFIG ---');
  console.log(keycloakConfig);
  console.log('------------------');

  passport.use('openid', new KeyCloakStrategy(
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

  router.get('/openid/return', function (req, res, next) {
    passport.authenticate('openid', { failureRedirect: '/users/login' }, function(err, user) {
      console.log('/openid/return: USER');
      
      if(err){
        return res.redirect('../login');
      }
      usertools.setUser(req, user);
      console.log(user);
      res.redirect('/');
    })(req, res, next);
  });

  router.get('/logout', auth, function(req, res, next){
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
        req.session.user = null;
        res.redirect('login');
      })
      .catch(error => {
        res.redirect('/');
      })
    }else{
      req.session.user = null;
      res.redirect('login');
    }
  });

  router.get('/refresh_auth', auth, function (req, res, next) {
    usertools.refreshAuth(req, config, function(error, result){
      if(!error){
        res.send(result);
      }else{
        res.status(error.status).send(error.data);
      }
    });
  });

  return router;
}