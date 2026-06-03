module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.render('groups_list', { 
      config: config, 
      user: req.session.user,
      newGeneration: false,
      t : req.t
    });
  });

  router.get('/:simletid/:groupid', auth, function(req, res, next) {
    res.render('group_view', { 
      config: config, 
      user: req.session.user, 
      group: req.params['groupid'],
      simletid: req.params['simletid'],
      newGeneration: false,
      t : req.t
    });
  });

  router.get('/:simletid/:groupid/print', auth, function(req, res, next) {
    res.render('group_view', { 
      config: config, 
      user: req.session.user, 
      group: req.params['groupid'],
      simletid: req.params['simletid'],
      newGeneration: false,
      t: req.t 
    });
  });
  
  return router;
}