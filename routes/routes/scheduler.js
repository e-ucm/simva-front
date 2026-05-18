module.exports = function(auth, config){

  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');

  router.get('/', auth, function(req, res, next) {
  	   res.render('studies_play', { 
         config: config,
         user: req.session.user,
         t : req.t
      });
  });

  router.get('/:studyid', auth, function(req, res, next) {
    res.render('scheduler', { 
        config: config,
        user: req.session.user,
        study: req.params['studyid'],
        testMode: req.query.testMode === 'true',
        t : req.t
    });
  });

  return router;
}