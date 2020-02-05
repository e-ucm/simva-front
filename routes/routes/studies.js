module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.render('studies_list', { config: config, user: req.session.user });
  });

  router.get('/:studyid', auth, function(req, res, next) {
    res.render('study_view', { config: config, user: req.session.user, study: req.params['studyid'] });
  });

  return router;
}