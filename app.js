var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
//connect_database
require('./service/connect_DB')
var cors = require('cors')


//routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
const roomsRouter = require('./routes/rooms');
const feedbacksRouter = require('./routes/feedback');
const upload_photoRouter = require('./routes/upload_photo');
const loginRouter = require('./service/authentication');
const synconeid = require('./routes/synconeid')
const votes_mg = require('./routes/votes')
const votes = require('./routes/votes_jitsi')
const onechatroom = require('./routes/OnechatRoom')
const onebox = require('./routes/onebox')
const admin = require('./routes/admin')
const otp = require('./routes/OTP')
const History_rooms = require('./routes/History_rooms')
const remove = require('./routes/remove')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json()); // middlewares
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, './public')));
app.get('/image/profile/:user_id', async function (req, res) {
  let img = req.params.user_id
  res.sendFile(path.join(__dirname, "./assets/profile/" + img));
})

if (process.env.NODE_ENV == 'development') {
  //use api route
  app.use('/', indexRouter);
  app.use('/secret/api/users', usersRouter);
  app.use('/secret/api/roles', rolesRouter);
  app.use('/secret/api/rooms', roomsRouter);
  app.use('/secret/api/auth', loginRouter);
  app.use('/secret/api/feedback', feedbacksRouter);
  app.use('/secret/api/avatar', upload_photoRouter);
  app.use('/secret/api/votes', votes)
  app.use('/secret/api/votes_manage', votes_mg)
  app.use('/secret/api/onechatroom', onechatroom)
  app.use('/secret/api/synconeid', synconeid)
  app.use('/secret/api/onebox', onebox)
  app.use('/secret/api/admin', admin)
  app.use('/secret/api/otp', otp)
  app.use('/secret/api/History_rooms', History_rooms)
  app.use('/secret/api/remove', remove)
} else {
  //use api route
  app.use('/', indexRouter);
  app.use('/secret/api/users', usersRouter);
  app.use('/secret/api/roles', rolesRouter);
  app.use('/secret/api/admin', admin)
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
})
module.exports = app;
