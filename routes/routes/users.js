var jwt = require('jsonwebtoken');

module.exports = function(auth, config){

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

  router.get('/logout', auth, function(req, res, next){
    req.session.user = null;
    res.redirect('login');
  });

  router.get('/register', function(req, res, next) {
    if(req.session.user){
      return res.redirect('../');
    }
    
    res.render('users_register', { config: config });
  });

  router.post('/savetoken', function(req, res) {
    let token = req.body.jwt;

    req.session.user = jwt.decode(token);
    req.session.user.jwt = token;

    return res.status(200).send({
      message: 'Success'
    });
  });

  return router;
}