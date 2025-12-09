const { convertTimeToCron } = require("../routes/lib/date.js");
const cron = require('node-cron');
const logger = require('../logger');
const userClientsListManager = require('../routes/lib/userClientsListManager');
const sseManager = require('../routes/lib/sseManager');  // Import SSE Manager
const sseClientsListManager = require('../routes/lib/sseClientsListManager');
const usertools = require('../routes/lib/usertools.js');
const config = require('../config.js');

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