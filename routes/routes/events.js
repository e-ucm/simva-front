module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();
    const logger = require('../../logger');
    const { validateUrl , createUrl } = require("../lib/hMacKey/tokens.js");
    const sseManager = require('../lib/sseManager');  // Import SSE Manager
    const sseClientsListManager = require('../lib/sseClientsListManager');
    const userClientsListManager = require('../lib/userClientsListManager');

    /**
     * To get presigned url for others page events
     * 
    */
    router.get('/getPresignedUrl', auth, async (req, res, next) => {
        const options = {
            username: req.session.user.data.username,
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
            let sessionID = req.query.sessionID;
            var clientId = sseManager.addClient(req, res);
            userClientsListManager.addClient(sessionID, clientId);
            if(studyid) {
                const options = {
                    id: studyid,
                    user: user,
                    userRole: userRole,
                    clientId: clientId
                };
                logger.debug(JSON.stringify(options));
                sseClientsListManager.addActivityAndUserToMap(options.id,options.user, options.userRole, options.clientId);
            }
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