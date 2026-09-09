module.exports = function(auth, redirectToLogin, config){

  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');

  router.get('/', auth, redirectToLogin, function(req, res, next) {
  	   res.render('simlets_play', { 
         config: config,
         user: req.session.user,
         t : req.t
      });
  });

  router.get('/:studyid/device', function(req, res, next) {
    const studyId = req.params['studyid'];
    // If not connected, send the user to the SSO login with the study as login_hint
    // and preserve the exact /scheduler/:studyid/device URL as the post-login return target.
    if (!req.session || !req.session.user || !req.session.user.data) {
      req.session.intendedUrl = `/scheduler/${studyId}/device`;
      return res.redirect(`/users/openidscheduler?study=${studyId}`);
    }
    res.render('device_auth', {
        config: config,
        user: req.session.user,
        study: studyId,
        authMethod: config.sso.authMethod || '',
        usercode: req.query.usercode || '',
        t : req.t
    });
  });

  router.get('/:studyid', auth, redirectToLogin, function(req, res, next) {
    res.render('scheduler', { 
        config: config,
        user: req.session.user,
        study: req.params['studyid'],
        testMode: req.query.testMode === 'true',
        authMethod: config.sso.authMethod || '',
        t : req.t
    });
  });

  return router;
}