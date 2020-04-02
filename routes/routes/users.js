var jwt = require('jsonwebtoken');

var passport = require('passport');

let request = require('request');
let querystring = require('querystring');

let setUser = function(req, user){
  req.session.user = user;
}

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
    authServerURL: config.sso.authUrl,
    callbackURL: config.api.url + '/users/openid/return'
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
    if(req.session.user){
      return res.redirect('../');
    }
    res.render('users_login', { config: config });
  });

  router.get('/openid', passport.authenticate('openid'));

  router.get('/openid/return', function (req, res, next) {
    passport.authenticate('openid', { failureRedirect: '/users/login' }, function(err, user) {
      setUser(req, user);
      res.redirect('/');
    })(req, res, next);
  });

  router.get('/logout', auth, function(req, res, next){

    if(req.session.user.refreshToken){
      request.post({
        url: config.sso.authUrl + '/realms/' + config.sso.realm + '/protocol/openid-connect/logout',
        headers: {
          'Authorization': 'Basic ' + new Buffer(config.sso.clientId + ':' + config.sso.clientSecret).toString('base64'),
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

  router.post('/savetoken', function(req, res) {
    let token = req.body.jwt;

    let user = jwt.decode(token);
    user.jwt = token;

    setUser(req, user);

    return res.status(200).send({
      message: 'Success'
    });
  });

  return router;
}