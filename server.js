const express = require("express");
const bodyParser = require("body-parser");
const nodemon = require("nodemon");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const router = require("./routes");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);

// -----------setup started---------
const app = express();
app.set('view engine', 'ejs');
const path = require("path");
app.use(express.static(path.join(__dirname, "/public")));

app.use(bodyParser.urlencoded({ extended: true }));
var methodOverride = require('method-override');
app.use(methodOverride('_method'));

// MongoDB connection details from environment variables
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const port = process.env.PORT;
const db = process.env.DB;

const mongoUri = `mongodb://${username}:${password}@${host}:${port}/${db}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("db connected....");
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

const store = new mongodbSession({
  uri: mongoUri,
  collection: 'sessions'
});

app.use(session({
  secret: 'this is secret project',
  resave: false,
  saveUninitialized: false,
  store: store
}));

// ----------middle wares---------
app.use(function user(req, res, next) {
  res.locals.user = req.session.user;
  next();
});

// -------use routes-------
app.use('/', router);

// -----start server------
app.listen(4000, () => {
  console.log('port running on 4000...');
});
