const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('../config');
let usertools = require('./lib/usertools');
const logger = require('../logger');

const MongoStore = require("connect-mongo")(session);
const mongoose = require('mongoose');

var isTest = (process.env.NODE_ENV !== 'production');
mongoose.connect( !isTest ? config.mongo.url : config.mongo.test, {useNewUrlParser: true});
mongoose.connection.on('error', logger.error.bind(logger, 'connection error:'));
mongoose.connection.once('open', function() {
  logger.info('connected');
});

const app = express();

app.use(bodyParser.json({limit: '1mb'}));
/*app.use(session(
  {
    secret: 'simva app',
    name: 'sessionID',
    cookie: {
      httpOnly: false,
      sameSite: 'none',
      secure: true
    },
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60 * 24 * 1000,
    })
  })
);*/
app.use(session(
  {
    secret: 'simva app', 
    cookie: {},
    resave: false, // Set this to false
    saveUninitialized: false, // Set this to false
  }
));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/../public')));

// view engine setup
app.engine('ejs', require('express-ejs-extend'));
app.set('views', path.join(__dirname, '/../views'));
app.set('view engine', 'ejs');

var auth = function(level){
  return function(req, res, next) {
    if (req.session && req.session.user){
      usertools.authExpired(req.session, config, function(error, result){
        if(error){
          var pre = '/';
          for(var i = 0; i < level; i++){
            pre += '../';
          }
          req.session.intendedUrl=`${req.originalUrl}`;
          if(req.session.intendedUrl.toLowerCase().includes("scheduler")) {
            logger.info("scheduler");
            const keyword = "scheduler/";
            // Find the index of the keyword
            const index = req.session.intendedUrl.indexOf(keyword);
            var result;
            if (index !== -1) {
              // Extract everything after "scheduler/"
              result = req.session.intendedUrl.substring(index + keyword.length);
            } else {
              result=""
            }
            return res.redirect(`${pre}users/openidscheduler?study=${result}`);
          } else {
            return res.redirect(`${pre}users/openid`); 
          }
        } else if(result) {
          logger.info("auth() - Refreshing token");
          let user = req.session.user;
          logger.debug(`auth() - User:${JSON.stringify(user, null, 2)}`);
          logger.info(`auth() - Access Token : ${result.access_token}`);
          user.jwt = result.access_token;
          user.refreshToken = result.refresh_token;
          usertools.setUser(req, user);
          logger.info("auth() - Refreshing token done");
          logger.debug(`auth() - User: ${JSON.stringify(user, null, 2)}`);
          return next();
        } else {
          logger.info("auth() - Token OK");
          return next();
        }
      });
    }else if(req.query.jwt){
      logger.info("auth() - New token");
      let user = {};
      let simvaToken = req.query.jwt;
      let profile = usertools.getProfileFromJWT(simvaToken);
      user.data = profile;
      user.jwt = simvaToken;
      usertools.setUser(req, user);
      logger.info("auth() - New token done");
      return next();
    }else{
      var pre = '';
      for(var i = 0; i < level; i++){
        pre += '../';
      }
      if(req.originalUrl == '/' || req.originalUrl == '') {
        return res.redirect(`${pre}users/login`);
      } else {
        req.session.intendedUrl=`${req.originalUrl}`;
        if(req.session.intendedUrl.toLowerCase().includes("scheduler")) {
          logger.info("scheduler");
          const keyword = "scheduler/";
          // Find the index of the keyword
          const index = req.session.intendedUrl.indexOf(keyword);
          var result;
          if (index !== -1) {
            // Extract everything after "scheduler/"
            result = req.session.intendedUrl.substring(index + keyword.length);
          } else {
            result=""
          }
          return res.redirect(`${pre}users/openidscheduler?study=${result}`);
        } else {
          return res.redirect(`${pre}users/openid`); 
        }
      }
    }
  };
};

router = express.Router();
app.use('/', router);
app.use('/users', require('./routes/users.js')(auth(1), config));
app.use('/events', require('./routes/events.js')(auth(1), config));
app.use('/studies', require('./routes/studies.js')(auth(1), config));
app.use('/groups', require('./routes/groups.js')(auth(1), config));
app.use('/previous-groups', require('./routes/previous-groups.js')(auth(1), config));
app.use('/activities', require('./routes/activities.js')(auth(1), config));
app.use('/scheduler', require('./routes/scheduler.js')(auth(1), config));

router.get('/about', auth(0), function(req, res, next) {
  res.render('about', { config: config, user: req.session.user });
});

router.get('/', auth(0), function(req, res, next) {
  if(req.session.user.data.role == 'teacher'){
    res.render('home', { config: config, user: req.session.user });
  }else if(req.session.user.data.role == 'student'){
    res.render('studenthome', { config: config, user: req.session.user });
  } else {
    if(config.sso.userCanSelectRole == "true") {
      return res.redirect('/users/role_selection');
    } else {
      return res.redirect('/users/contact_admin?error=no_role');
    }
  }
});

// catch 404
app.use((req, res, next) => {
  logger.info(`Error 404 on ${req.url}.`);
  res.status(404).send({ message: 'Not found' });
});

// catch errors
app.use((err, req, res, next) => {
  logger.info(err);
  const status = err.status || 500;
  const msg = err.error || err.message;
  logger.info(`Error ${status} (${msg}) on ${req.method} ${req.url} with payload ${req.body}.`);
  res.status(status).send({ message: msg });
});


module.exports = app;
