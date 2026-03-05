
  const { createUrl } = require("../lib/hMacKey/tokens.js");

  module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.render('groups_list', { 
      config: config, 
      user: req.session.user,
      newGeneration: true,
      t : req.t
    });
  });

  router.get('/:simletid/:groupid', auth, function(req, res, next) {
    res.render('group_view', { 
      config: config, 
      user: req.session.user, 
      group: req.params['groupid'],
      simletid: req.params['simletid'],
      newGeneration: true,
      t : req.t
   });
  });

    /**
   * To get presigned url for groups events
   * 
   */
  router.get('/:simletid/:groupid/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      groupId: req.params['groupid'],
      username: req.session.user.data.username,
      simletId: req.params['simletid'],
      userRole:req.session.user.data.role,
      sessionID: req.session.id
    };

    try {
        const url = `${config.simva.url}/events`;
        const result = await createUrl(url, options, config.hmac.hmacKey);
        res.status(200).send(result.data);
    } catch (err) {
        next(err);
    }
  });


  router.get('/:simletid/:groupid/print', auth, function(req, res, next) {
    res.render('group_view', { 
      config: config, 
      user: req.session.user, 
      group: req.params['groupid'],
      simletid: req.params['simletid'],
      newGeneration: true,
      t: req.t
    });
  });

  return router;
}