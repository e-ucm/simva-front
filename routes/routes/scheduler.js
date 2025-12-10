module.exports = function(auth, config){

  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');

  router.get('/', auth, function(req, res, next) {
  	if(req.session.user.data.role === 'teacher'){
  		res.render('studies_list', { 
        config: config,
        user: req.session.user,
        t : req.t
     });
  	}else{
  		res.render('studies_play', { 
        config: config,
        user: req.session.user,
        t : req.t
     });
  	}
    
  });

  router.get('/:studyid', auth, function(req, res, next) {
    res.render('scheduler', { 
        config: config,
        user: req.session.user,
        study: req.params['studyid'],
        t : req.t
    });
  });

  return router;
}