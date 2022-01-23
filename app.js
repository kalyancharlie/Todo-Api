var createError = require('http-errors');
const mongoose = require('mongoose')
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var todosRouter = require('./routes/todos');

const MONGO_URI = 'mongodb://localhost/todo_app'

var app = express();

app.use(logger('dev'));

// Mongoose Connection
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true})
    .then()
    .catch((err) => console.log(err));
mongoose.connection
    .once("open", () => {
        console.log("Connected to DB");
    })
    .on("error", (err) => console.warn("MongoDB Connection Error", err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/todos', todosRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('<h1>Error 404</h1>');
});

module.exports = app;
