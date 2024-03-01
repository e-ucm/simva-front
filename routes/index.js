const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('../config');
let usertools = require('./lib/usertools');


const MongoStore = require("connect-mongo")(session);
const mongoose = require('mongoose');

var isTest = (process.env.NODE_ENV === 'test');
mongoose.connect( !isTest ? config.mongo.url : config.mongo.test, {useNewUrlParser: true});
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() {
  console.log('connected');
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
app.use(session({secret: 'simva app', cookie: {}}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/../public')));

// view engine setup
app.engine('ejs', require('express-ejs-extend'));
app.set('views', path.join(__dirname, '/../views'));
app.set('view engine', 'ejs');

var auth = function(level){
  return function(req, res, next) {
    if (req.session && req.session.user)
      return next();
    else if(req.query.jwt){
      let user = {};
      let simvaToken = req.query.jwt;
      let profile = usertools.getProfileFromJWT(simvaToken);
      user.data = profile;
      user.jwt = simvaToken;
      usertools.setUser(req, user);

      //Check if user doesnt exist in SIMVA and it´s the first connexion
      if(!config.sso.allowedRoles.split(",").includes(user.data.role)) {
        if(config.sso.userCanSelectRole == "true") {
          return res.redirect('/users/role_selection');
        } else {
          return res.redirect('/users/contact_admin?error=no_role');
        }
      } else {
        return next();
      }
    }else{
      var pre = '';
      for(var i = 0; i < level; i++){
        pre += '../';
      }
      return res.redirect(pre + 'users/login');
    }
  };
};

router = express.Router();
app.use('/', router);
app.use('/users', require('./routes/users.js')(auth(1), config));
app.use('/studies', require('./routes/studies.js')(auth(1), config));
app.use('/groups', require('./routes/groups.js')(auth(1), config));
app.use('/activities', require('./routes/activities.js')(auth(1), config));
app.use('/scheduler', require('./routes/scheduler.js')(auth(1), config));

router.get('/about', auth(0), function(req, res, next) {
  res.render('about', { config: config, user: req.session.user });
});

router.get('/', auth(0), function(req, res, next) {
  console.log(req.session.user);
  if(req.session.user == 'teacher'){
    res.render('home', { config: config, user: req.session.user });
  }else if(req.session.user == 'student'){
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
  console.log(`Error 404 on ${req.url}.`);
  console.log(req.url);
  res.status(404).send({ message: 'Not found' });
});

// catch errors
app.use((err, req, res, next) => {
  console.log(err);
  const status = err.status || 500;
  const msg = err.error || err.message;
  console.log(`Error ${status} (${msg}) on ${req.method} ${req.url} with payload ${req.body}.`);
  res.status(status).send({ message: msg });
});


module.exports = app;
