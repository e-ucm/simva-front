
  const { createUrl } = require("../lib/hMacKey/tokens.js");
  const SimvaAsync = require('../lib/simvaAsync');

  function resolveUserIdFromSession(sessionUser) {
    const candidates = [
      sessionUser?.sql?.user_id,
      sessionUser?.data?.user_id,
      sessionUser?.data?.id,
      sessionUser?.id
    ];

    for (const value of candidates) {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        return value;
      }
    }

    return undefined;
  }

  module.exports = function(auth, config){

  var express = require('express'),
    router = express.Router();

  /**
   * To get presigned url for groups events
   * 
   */
  router.get('/:simletid/:groupid/events/getPresignedUrl', async (req, res, next) => {
    try {
        const me = await SimvaAsync.getCurrentUser(req.session.id);
        const userId = me?.user_id ?? resolveUserIdFromSession(req.session.user);
        const options = {
          groupId: req.params['groupid'],
          username: req.session.user.data.username,
          simletId: req.params['simletid'],
          userRole:req.session.user.data.role,
          sessionID: req.session.id,
          ...(userId !== undefined ? { userId } : {})
        };
        const url = `${config.simva.url}/events`;
        const result = await createUrl(url, options, config.hmac.hmacKey);
        res.status(200).send(result.data);
    } catch (err) {
        next(err);
    }
  });

  return router;
}