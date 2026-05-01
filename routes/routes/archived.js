module.exports = function(auth, config){
    var express = require('express'),
    router = express.Router();

    router.get('/', auth, function(req, res, next) {
        if(req.session.user.data.role === 'teacher' || req.session.user.data.role === 'administrator'){
            res.render('studies_list', { 
                config: config, 
                user: req.session.user,
                t : req.t,
                archived: true
            });
        }
    });

    return router;
}