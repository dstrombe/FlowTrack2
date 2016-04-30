'use strict';

var JsonRouteHandlers = require('./JsonRouteHandlers');
var jsonRoutes = require('./JsonRoutes');
var express = require('express');
var ExpressLogger = require('./ExpressLogger');
var app = express();

function FlowTrack2App(es, logger, config) {
  // Turn on logging (and add logger to the request/response)
  app.use(new ExpressLogger(logger));

  // Add the ElasticSearch module to the request so other handlers/middleware can
  // access it
  app.use(function(req, res, next) {
    req.es = es;
    res.es = es;
    next();
  });

  // Setup static routes
  app.use('/bower_components', express.static('www/bower_components'));
  app.use('/js', express.static(config.get('Application.jsPath')));
  app.use('/css', express.static('www/css'));
  app.use('/', express.static('www/html'));

  // Load the json routes
  jsonRoutes(app, config,
      new JsonRouteHandlers(es, logger, config));

    // Setup static routes
  app.use('/bower_components', express.static('www/bower_components'));
  app.use('/js', express.static(config.get('Application.jsPath')));
  app.use('/dist', express.static('dist/'));
  app.use('/css', express.static('www/css'));
  app.use('/', express.static('www/html'));

    // Load the json routes
  jsonRoutes(app, config,
        new JsonRouteHandlers(es, logger, config));

  return app;
}

module.exports = FlowTrack2App;
