module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.render('groups_list', { config: config, user: req.session.user });
  });

  router.get('/:groupid', auth, function(req, res, next) {
    res.render('group_view', { config: config, user: req.session.user, group: req.params['groupid'] });
  });

  return router;
}