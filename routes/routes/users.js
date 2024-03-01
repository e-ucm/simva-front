var jwt = require('jsonwebtoken');

var passport = require('passport');

let request = require('request');
let querystring = require('querystring');

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
    callbackURL: config.simva.url + '/users/openid/return'
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

  router.get('/role_selection', function(req, res, next) {
    res.render('users_role_edit', { config: config, user: req.session.user });
  });

  
  router.get('/contact_admin', function(req, res, next) {
    res.render('users_contact_admin', { config: config, user: req.session.user , error : req.query.error });
  });

  router.get('/openid', passport.authenticate('openid'));

  router.get('/openid/return', function (req, res, next) {
    passport.authenticate('openid', { failureRedirect: '/users/login' }, function(err, user) {
      console.log('/openid/return: USER');
      console.log(JSON.stringify(user));

      if(err){
        return res.redirect('../login');
      }

      usertools.setUser(req, user);

      //Check if user doesnt exist in SIMVA and it´s the first connexion
      if(!config.sso.allowedRoles.split(",").includes(user.role)) {
        if(config.sso.userCanSelectRole == "true") {
          res.redirect('/users/role_selection');
        } else {
          res.redirect('/users/contact_admin?error=no_role');
        }
      } else {
        res.redirect('/');
      }    
    })(req, res, next);
  });

  router.get('/logout', auth, function(req, res, next){

    if(req.session.user.refreshToken){
      request.post({
        url: config.sso.url + '/realms/' + config.sso.realm + '/protocol/openid-connect/logout',
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
          req.session.user = null;
          res.redirect('login');
        }else{
          res.redirect('/');
        }
      });
    }else{
      req.session.user = null;
      res.redirect('login');
    }
  });

  return router;
}