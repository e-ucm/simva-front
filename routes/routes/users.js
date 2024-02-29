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
    if(req.query.jwt){
      let user = {};
      let simvaToken = req.query.jwt;
      let profile = usertools.getProfileFromJWT(simvaToken);
      user.data = profile;
      user.jwt = simvaToken;
      usertools.setUser(req, user);

      if(req.query.next){
        res.redirect(req.query.next + '?jwt=' + req.query.jwt);
      }else{
        res.status(200).send({'message': 'ok'});
      }
    }else{
      if(req.session.user){
        return res.redirect('../');
      }
      res.render('users_login', { config: config });
    }
  });

  router.post('/login', function(req, res, next) {

    if(req.session.user){
      return res.redirect('../');
    }

    request.post({
      url: config.api.url + '/users/login',
      json: true,
      body: req.body
      },
      function(error, response, body){
        if(!error){
          console.log(response);
          if(response.statusCode !== 200){
            res.status(response.statusCode).send(body);
          }else{
            let user = {};
            let simvaToken = body.token;
            let profile = usertools.getProfileFromJWT(simvaToken);
            user.data = profile;
            user.jwt = simvaToken;
            usertools.setUser(req, user);
            res.status(200).send({'message': 'ok'});
          }
        } else {
          console.log(error);
          res.status(500).send({message:"Unexpected error"});
        }
      }
    );
  });

  router.get('/openid', passport.authenticate('openid'));

  router.get('/openid/return', function (req, res, next) {
    passport.authenticate('openid', { failureRedirect: '/users/login' }, function(err, user) {
      if(err){
        return res.redirect('../login');
      }

      usertools.setUser(req, user);
      res.redirect('/');
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

  router.get('/register', function(req, res, next) {
    if(req.session.user){
      return res.redirect('../');
    }

    res.render('users_register', { config: config });
  });

  return router;
}