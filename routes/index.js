const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('../config');

const app = express();

app.use(bodyParser.json({limit: '1mb'}));
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
    else{
      var pre = '';
      for(var i = 0; i < level; i++){
        pre += '../';
      }
      return res.redirect(pre + 'users/login');
    }
  };
};


router = express.Router();
router.get('/', auth(0), function(req, res, next) {
  res.render('home', { config: config, user: req.session.user });
});

app.use('/', router);
app.use('/users', require('./routes/users.js')(auth(1), config));
app.use('/studies', require('./routes/studies.js')(auth(1), config));
app.use('/groups', require('./routes/groups.js')(auth(1), config));
//app.use('/activities', require('./activities.js')(auth(1)));

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
