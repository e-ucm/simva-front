const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('../config');
let usertools = require('./lib/usertools');
const logger = require('../logger');
const profiling = require('../profiling');

const app = express();


// Body parsers
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session(
  {
    secret: 'simva app',
    cookie: { 
      maxAge: config.simva.cookieMaxAgeInMin*60*1000
    },
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

const i18next = require('./routes/i18n.js');
const middleware = require('i18next-http-middleware');
const { setLanguage } = require('../middleware/setLanguageMiddleware.js');
app.use(setLanguage);
app.use(middleware.handle(i18next));

router = express.Router();
app.use('/', router);
app.use('/users', require('./routes/users.js')(usertools.auth(1), usertools.redirectToLogin(1), config));
app.use('/bff', require('./routes/bff.js')(usertools.auth(1), usertools.redirectToLogin(1), config));
app.use('/events', require('./routes/events.js')(usertools.auth(1), usertools.redirectToLogin(1), config));
app.use('/simlets', require('./routes/studies.js')(usertools.auth(1), usertools.redirectToLogin(1), config));
app.use('/activities', require('./routes/activities.js')(usertools.auth(1), usertools.redirectToLogin(1), config));
app.use('/scheduler', require('./routes/scheduler.js')(usertools.auth(1), usertools.redirectToLogin(1), config));
app.use('/archived', require('./routes/archived.js')(usertools.auth(1), usertools.redirectToLogin(1), config));

router.get('/about', function(req, res, next) {
  const isAuthenticated = !!(req.session && req.session.user);
  res.render('about', {
    config: config,
    user: isAuthenticated ? req.session.user : undefined,
    layoutTemplate: isAuthenticated ? 'layout_with_menu_and_sse' : 'layout_logout',
    t: req.t
  });
});

router.get('/e-ucm', function(req, res, next) {
  res.render('logout_e_ucm', { 
    config: config,
    t: req.t
  });
});

router.get('/', usertools.auth(0), usertools.redirectToLogin(0), function(req, res, next) {
  if(req.session.user.data.role == 'teacher' || req.session.user.data.role == 'administrator' || req.session.user.data.role == 'lrsmanager'){
    res.render('home', { 
      config: config, 
      user: req.session.user,
      t : req.t
     });
  }else if(req.session.user.data.role == 'student'){
    res.render('studenthome', { 
      config: config, 
      user: req.session.user,
      t : req.t
     });
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
  logger.error(err);
  
  if(res.frontendRedirect) {
    return res.redirect(res.frontendRedirect);
  }

  if (!req.session.user) {
    return res.redirect('/users/login');
  }
  
  res.status(status).send({ message: msg });
});


module.exports = app;
