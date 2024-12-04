module.exports = function(auth, config){
  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');
  const { createHMACKey } = require("../lib/hMacKey/crypto.js");
  const { validateUrl, createUrl } = require("../lib/hMacKey/tokens.js");

  initHmacKey();
  async function initHmacKey() {
    config.hmac.hmacKey = (await createHMACKey(config.hmac.password
      //, {
      //  encodedSalt: config.hmac.salt,
      //  encodedKey: config.hmac.key
      //}
    )).key;
    logger.info("Initialized hmacKey");
  }

  /**
   * To send Server Side Event to Client
   * 
   */
  router.get('/:studyid/schedule/events', async (req, res, next) => {
    // Extract the token from the query parameters
    const ts = req.query.ts;
    const signature = req.query.signature;
    if (!signature) {
      return res.status(401).json({ message: 'No signature provided' });
    }
    if (!ts) {
      return res.status(401).json({ message: 'No timestamp provided' });
    }

    const url = config.api.url + req.baseUrl + req.path;
    const query = req.query;
    try {
      if(await validateUrl(url, query, config.hmac.hmacKey)) {
        let user = req.query.username;
        logger.info(user);
        var clientId = sseManager.addClient(req, res);
        const options = {
            id: req.params['studyid'],
            user: user,
            userRole: "student",
            clientId: clientId
        };
        await studies.getStudyEvents(options);
      } else {
          res.status(401).send({ message: 'Signature not valid' });
      }
    } catch (err) {
        next(err);
    }
  });

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/schedule/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      id: req.params['studyid'],
      user: req.session.user,
      username : req.user.data.username
    };

    try {
        const url = `${config.api.url}/studies/${options.id}/schedule/events`;
        const params={ username: options.username };
        const result = await createUrl(url, params, config.hmac.hmacKey);
        res.status(200).send(result.data);
    } catch (err) {
        next(err);
    }
  });

  /**
   * To send Server Side Event to Client
   * 
   */
  router.get('/:studyid/events', async (req, res, next) => {
    // Extract the token from the query parameters
    const ts = req.query.ts;
    const signature = req.query.signature; 
    if (!signature) {
      return res.status(401).json({ message: 'No signature provided' });
    }
    if (!ts) {
      return res.status(401).json({ message: 'No timestamp provided' });
    }

    const url = config.api.url + req.baseUrl + req.path;
    const query = req.query;
    try {
      if(await validateUrl(url, query, config.hmac.hmacKey)) {
        var clientId= sseManager.addClient(req, res);
        const options = {
            id: req.params['studyid'],
            userRole: "teacher",
            clientId: clientId
        };
        await studies.getStudyEvents(options);
      } else {
        res.status(401).send({ message: 'Signature not valid' });
      }
    } catch (err) {
      next(err);
    }
  });

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      id: req.params['studyid'],
      user: req.session.user,
      username : req.user.data.username
    };

    try {
        const url = `${config.api.url}/studies/${options.id}/events`;
        params={};
        const result = await createUrl(url, params, config.hmac.hmacKey);
        res.status(200).send(result.data);
    } catch (err) {
        next(err);
    }
  });

  router.get('/', auth, function(req, res, next) {
    if(req.session.user.data.role === 'teacher'){
      res.render('studies_list', { config: config, user: req.session.user });
    }else{
      res.render('studies_play', { config: config, user: req.session.user });
    }
    
  });
  router.get('/:studyid', auth, function(req, res, next) {
    res.render('study_view', { config: config, user: req.session.user, study: req.params['studyid'] });
  });
  return router;
}