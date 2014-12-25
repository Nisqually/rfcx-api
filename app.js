// check for environmental variable file and load if present
var fs = require("fs");
if (fs.existsSync("./config/env_vars.js")) {
  var env = require("./config/env_vars.js").env;
  for (i in env) { process.env[i] = env[i]; }
}

// New Relic Initialization
if (process.env.NODE_ENV === "production") {
  process.env.NEW_RELIC_HOME = __dirname+"/config"; require("newrelic");
}

var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("morgan");
var multer = require("multer");
var passport = require("passport");
var middleware = {};
var app = express();

app.set("title", "Rainforest Connection API");
app.set("port", process.env.PORT || 8080);
app.use(favicon(__dirname + "/public/img/logo/favicon.ico"));
app.use(logger("dev"));
app.use(multer(require("./config/multer").config(process.env)));
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());

// Define/Load Routes
var routes = {
  "v1": {
    "users": require("./routes/v1/users"),
    "mapping": require("./routes/v1/mapping"),
    "guardians": require("./routes/v1/guardians"),
    "checkins": require("./routes/v1/checkins")
  },
  "v2": {}
};

// Initialize Version-Specific Middleware
for (apiVersion in routes) {
  middleware[apiVersion] = require("./middleware/"+apiVersion+".js").middleware;
  for (middlewareFunc in middleware[apiVersion]) {
     app.use("/"+apiVersion+"/", middleware[apiVersion][middlewareFunc]);
  }
}
// Initialize Routes
for (apiVersion in routes) {
  for (routeName in routes[apiVersion]) {
    app.use("/"+apiVersion+"/"+routeName, routes[apiVersion][routeName]);
  }
}

// Health Check Endpoint
app.get("/health_check",function(req,res){ res.status(200).json({rfcx:"awesome"});});

// Catch & Report Various HTTP Errors (needs some work)

// app.use(function(req, res, next) {
//   var err = new Error("Not Found");
//   err.status = 404;
//   next(err);
// });

// app.use(function(err, req, res, next) {
//   if (process.env.NODE_ENV === "development") { console.log(err); }
//   res.status(err.status || 500).json({
//     message: err.message,
//     error: (process.env.NODE_ENV === "development") ? err : {}
//   });
// });

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500).json({
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
        message: err.message,
        error: {}
    });
});

module.exports = app;
