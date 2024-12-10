module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();
    const logger = require('../../logger');
    const { validateUrl } = require("../lib/hMacKey/tokens.js");
    const sseManager = require('../lib/sseManager');  // Import SSE Manager
    const sseClientsListManager = require('../lib/sseClientsListManager');

    router.get('/', async function(req, res, next) {
        // Extract the token from the query parameters
        const ts = req.query.ts;
        const signature = req.query.signature;
        if (!signature) {
        return res.status(401).json({ message: 'No signature provided' });
        }
        if (!ts) {
        return res.status(401).json({ message: 'No timestamp provided' });
        }

        const url = config.simva.url + req.baseUrl;
        const query = req.query;
        try {
        if(await validateUrl(url, query, config.hmac.hmacKey)) {
            let studyid = req.query.studyId;
            let user = req.query.username;
            let userRole = req.query.userRole;
            logger.debug(user);
            var clientId = sseManager.addClient(req, res);
            const options = {
                id: studyid,
                user: user,
                userRole: userRole,
                clientId: clientId
            };
            logger.debug(JSON.stringify(options));
            sseClientsListManager.addActivityAndUserToMap(options.id,options.user, options.userRole, options.clientId);
            sseClientsListManager.displayClients();
            sseManager.sendMessageToClientList([clientId], {message:'ping',type:'ping'});
        } else {
            res.status(401).send({ message: 'Signature not valid' });
        }
        } catch (err) {
            next(err);
        }
    });
  
    return router;
  }