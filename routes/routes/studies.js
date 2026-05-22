module.exports = function(auth, redirectToLogin, config){
  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');
  const { createHMACKey } = require("../lib/hMacKey/crypto.js");
  const { createUrl } = require("../lib/hMacKey/tokens.js");
  const SimvaAsync = require('../lib/simvaAsync');
  const sseManager = require('../lib/sseManager');  // Import SSE Manager
  const sseClientsListManager = require('../lib/sseClientsListManager');
  const KafkaClient = require("../lib/kafka");

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

  initHmacKey();
  kafka = new KafkaClient(config.kafka);
  startKafkaConsumer();
  async function initHmacKey() {
    config.hmac.hmacKey = (await createHMACKey(config.hmac.password
      //, {
      //  encodedSalt: config.hmac.salt,
      //  encodedKey: config.hmac.key
      //}
    )).key;
    logger.info("Initialized hmacKey");
  }

    // Method to start consuming messages using KafkaClient
    async function startKafkaConsumer() {
        try {
            logger.info('Starting Kafka consumption...');
            // Start Kafka consumption and pass the processMessage as a callback
            await kafka.consumeLatestMessages(processMessage);
        } catch (error) {
          logger.error('Error starting consumption: ' + error);
        }
    }

    async function processMessage(message) {
        // Broadcast the message to client list
        var msg = typeof message.value === 'string' ? JSON.parse(message.value) : message.value;
        const normalizedMsg = {
          ...msg,
          activity_type: msg.activity_type ?? msg.activityType,
          activity_id: msg.activity_id ?? msg.activityId,
          studyId: msg.studyId ?? msg.simlet_id,
          groupId: msg.groupId ?? msg.group_id,
          user: msg.user ?? msg.username,
          userId: msg.userId ?? msg.user_id ?? msg.participant_id
        };

        var clients=sseClientsListManager.getClientList(normalizedMsg);
        logger.info(JSON.stringify(clients));
        sseManager.sendMessageToClientList(clients, normalizedMsg);
    }
  

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/schedule/events/getPresignedUrl', auth, redirectToLogin, async (req, res, next) => {
    try {
        const me = await SimvaAsync.getCurrentUser(req.session.id);
        const userId = me?.user_id ?? resolveUserIdFromSession(req.session.user);
        const options = {
          studyId: req.params['studyid'],
          username: req.session.user.data.username,
          userRole:"student",
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

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/events/getPresignedUrl', auth, redirectToLogin, async (req, res, next) => {
    try {
        const me = await SimvaAsync.getCurrentUser(req.session.id);
        const userId = me?.user_id ?? resolveUserIdFromSession(req.session.user);
        const options = {
          studyId: req.params['studyid'],
          username: req.session.user.data.username,
          userRole:"teacher",
          sessionID: req.session.id,
          ...(userId !== undefined ? { userId } : {})
        };
        const url = `${config.simva.url}/events`;
        params={};
        const result = await createUrl(url, options, config.hmac.hmacKey);
        res.status(200).send(result.data);
    } catch (err) {
        next(err);
    }
  });

  router.get('/', auth, redirectToLogin, function(req, res, next) {
      res.render('studies_list', { 
        config: config, 
        user: req.session.user,
        t : req.t,
        archived: false
     });
  });
  
  router.get('/:studyid', auth, redirectToLogin, function(req, res, next) {
    res.render('study_view', { 
      config: config, 
      user: req.session.user, 
      study: req.params['studyid'],
      t : req.t
   });
  });
  return router;
}