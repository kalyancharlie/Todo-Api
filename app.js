const createError = require("http-errors");
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const usersRouter = require("./routes/users");
const todosRouter = require("./routes/todos");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost/todo_app";
const LOG_MODE = process.env.LOG_MODE == "development" ? "dev" : "common";
const WHITELISTED_ORIGINS =
  process.env.LOG_MODE == "development"
    ? ["*"]
    : JSON.parse(process.env.ALLOW_ORIGIN);

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`CORS: origin: ${origin} | mode: ${process.env.LOG_MODE} | WHITELISTED_ORIGINS: ${WHITELISTED_ORIGINS}`)
    if (WHITELISTED_ORIGINS.includes('*')) {
      return callback(null, true)
    }
    if(WHITELISTED_ORIGINS.indexOf(origin) === -1) {
      let msg = `${origin} is not allowed to access API.`
      return callback(new Error(msg), false)
    }
    callback(null, true)
  },
  allowedHeaders: ['Content-Type', 'x-api-key', 'Access-Control-Max-Age'],
  credentials: true
}

const app = express();

app.use(cors(corsOptions));
app.use(logger(LOG_MODE));

// Mongoose Connection
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  })
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
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", usersRouter);
app.use("/todos", todosRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500).json({ message: "Route Not Found" });
});

module.exports = app;
