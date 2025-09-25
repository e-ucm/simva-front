const userClientsListManager = require('../lib/userClientsListManager');
const usertools = require('../lib/usertools');

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
        teacher_user: req.session.user,
        sandbox: false,
        t : req.t
    });
  });

  router.get('/:studyid/sandbox', auth, async (req, res, next) => {
      let studyId=req.params["studyid"];
      let user="sandbox";
      let sandbox_user = await usertools.getSandboxToken(studyId, "openid profile email roles", user);
      let sandbox_profile = { data : usertools.getProfileFromJWT(sandbox_user.access_token), jwt : sandbox_user.access_token};
      let session = { id : `${studyId}_sandbox_user`, user: sandbox_profile };
      userClientsListManager.addUserSession(session);
      res.render('scheduler', {
          config: config,
          teacher_user: req.session.user,
          user: sandbox_profile,
          sandbox: true,
          study: req.params['studyid'],
          t : req.t
      });
  });

  return router;
}