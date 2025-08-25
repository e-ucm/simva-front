const usertools = require('../lib/usertools.js');

module.exports = function(auth, config){
  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');
  const { createHMACKey } = require("../lib/hMacKey/crypto.js");
  const { createUrl } = require("../lib/hMacKey/tokens.js");
  const sseManager = require('../lib/sseManager');  // Import SSE Manager
  const sseClientsListManager = require('../lib/sseClientsListManager');
  const userClientsListManager = require('../lib/userClientsListManager');
  const KafkaClient = require("../lib/kafka");
  const { convertTimeToCron } = require("../lib/date.js");

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

    const cron = require('node-cron');

    // Schedule a task to run every x minutes
    cron.schedule(convertTimeToCron(config.simva.ping_task/(1000*60)), async () => {
        logger.info('SSE Ping task is running at ' + new Date());
        var clientsWithoutAction=sseClientsListManager.getTimeSuperiorToXMinClientList(5);
        logger.debug(JSON.stringify(clientsWithoutAction));
        sseManager.sendMessageToClientList(clientsWithoutAction, {message:'ping',type:'ping'});
    });
    
    // Schedule a task to run every x minutes
    cron.schedule(convertTimeToCron(config.simva.auth_expired_task/(1000*60)), async () => {
      logger.info('SSE auth expired task is running at ' + new Date())
      var sessionsToRefresh=await usertools.getRefreshSessionsList();
      var clientsToRefresh=userClientsListManager.getRefreshClientList(sessionsToRefresh);
      logger.debug(JSON.stringify(clientsToRefresh));
      sseManager.sendMessageToClientList(clientsToRefresh, {message:'auth expired',type:'refresh_auth'});
  });

    async function processMessage(message) {
        // Broadcast the message to client list
        var msg = JSON.parse(message.value);
        var clients=sseClientsListManager.getClientList(msg);
        logger.info(JSON.stringify(clients));
        sseManager.sendMessageToClientList(clients, msg);
    }
  

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/schedule/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      studyId: req.params['studyid'],
      username: req.session.user.data.username,
      userRole:"student",
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

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      studyId: req.params['studyid'],
      username: req.session.user.data.username,
      userRole:"teacher",
      sessionID: req.session.id
    };

    try {
        const url = `${config.simva.url}/events`;
        params={};
        const result = await createUrl(url, options, config.hmac.hmacKey);
        res.status(200).send(result.data);
    } catch (err) {
        next(err);
    }
  });

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
    res.render('study_view', { 
      config: config, 
      user: req.session.user, 
      study: req.params['studyid'],
      t : req.t
   });
  });
  return router;
}