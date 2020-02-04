module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.render('studies_list', { config: config, user: req.session.user });
  });

  return router;
}