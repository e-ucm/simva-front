module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();
    const logger = require('../../logger');
    const Simva = require('../lib/simva');
    
    /**
    * Register
    * 
    */
    router.post('/users', async (req, res, next) => {
        Simva.register(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });
  
    router.get('/studies', async (req, res, next) => {
        Simva.getStudies(req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.get('/studies/:studyid', async (req, res, next) => {
        Simva.getStudy(req.params['studyid'], req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    router.put('/studies/:studyid', async (req, res, next) => {
        Simva.updateStudy(req.body, req.session.id, (error, result) => {
            if(error) {
                next(error);
            } else {
                res.status(200).send(result);
            }
        });
    });

    return router;
  }