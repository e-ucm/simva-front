
  const { createUrl } = require("../lib/hMacKey/tokens.js");

  module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  router.get('/', auth, function(req, res, next) {
    res.render('new_groups_list', { 
      config: config, 
      user: req.session.user,
      t : req.t
    });
  });

  router.get('/:groupid', auth, function(req, res, next) {
    res.render('new_group_view', { 
      config: config, 
      user: req.session.user, 
      group: req.params['groupid'],
      t : req.t
   });
  });

    /**
   * To get presigned url for groups events
   * 
   */
  router.get('/:groupid/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      groupId: req.params['groupid'],
      username: req.session.user.data.username,
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


  router.get('/:groupid/print', auth, function(req, res, next) {
    res.render('new_group_view', { config: config, user: req.session.user, group: req.params['groupid'] });
  });

  return router;
}