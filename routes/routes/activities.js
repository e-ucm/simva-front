module.exports = function(auth, redirectToLogin, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, redirectToLogin, function(req, res, next) {
    res.render('activities_list', { 
      config: config, 
      user: req.session.user,
      t : req.t
    });
  });

  return router;
}