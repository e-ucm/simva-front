module.exports = function(auth, config){
  var express = require('express'),
  router = express.Router();
  const logger = require('../../logger');
  const { createHMACKey } = require("../lib/hMacKey/crypto.js");
  const { createUrl } = require("../lib/hMacKey/tokens.js");
  const sseManager = require('../lib/sseManager');  // Import SSE Manager
  const sseClientsListManager = require('../lib/sseClientsListManager');
  const KafkaClient = require("../lib/kafka");

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

    // Schedule a task to run every 3 minutes
    cron.schedule('*/3 * * * *', () => {
        logger.info('SSE Ping task is running every 3 minutes at ' + new Date());
        var clientsNotReaded=sseClientsListManager.getTimeSuperiorToXMinClientList(5);
        logger.debug(JSON.stringify(clientsNotReaded));
        sseManager.sendMessageToClientList(clientsNotReaded, {message:'ping',type:'ping'});
    });

    async function processMessage(message) {
        // Broadcast the message to client list
        var msg = JSON.parse(message.value);
        var clients=sseClientsListManager.getClientList(msg);
        logger.debug(JSON.stringify(clients));
        sseManager.sendMessageToClientList(clients, msg);
        var clientsNotReaded=sseClientsListManager.getTimeSuperiorToXMinClientList(5);
        logger.debug(JSON.stringify(clientsNotReaded));
        sseManager.sendMessageToClientList(clientsNotReaded, {message:'ping',type:'ping'});
    }
  

  /**
   * To get presigned url for schedule events
   * 
   */
  router.get('/:studyid/schedule/events/getPresignedUrl', async (req, res, next) => {
    const options = {
      studyId: req.params['studyid'],
      username: req.session.user.data.username,
      userRole:"student"
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
      userRole:"teacher"
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