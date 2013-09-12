#!/usr/bin/env node

// Module base dependencies
var express = require('express'),
    path = require('path')
    settings = require('./settings');

// Application instance
var app = express();

// All environments
app.set('port', process.env.PORT || 3000);

// Views
app.set('views', settings.views.path);
app.set('view options', settings.views.options);
app.set('view cache', settings.views.cache);
app.set('view engine', settings.views.engine);

// Static files
var staticFilesDir = path.join(__dirname, 'static'),
    staticMiddleware = express.static(staticFilesDir);
app.use(staticMiddleware);
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));

// Favicon
app.use(express.favicon(path.join(staticFilesDir, 'img/favicon.ico')));

// Other configuration options
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Network
var network = require('./network');

// Routes
var routes = network.routes;
app.get('/', routes.index);
app.get('/library/?(:cursor)?', routes.library);

// Start server
var http = require('http');
var server = http.createServer(app);

// ...player
var listener = new network.player.listener(server);

// Startup
server.listen(app.get('port'), function() {
  var address = server.address();
  console.log('Server started at http://%s:%s\nPress Ctrl-C to stop',
    address.address, address.port);
});

// Shutdown
var shutdown = function() {
  console.log('Server shutting down');
  listener.quit();
  server.close();
  listener.kill(); // Just in case
  process.exit();
};

process.on('SIGINT', shutdown);
// process.on('exit', shutdown);

// Only in debug mode
// process.on('uncaughtException', function(err) {
//   console.log('Exception :' + err);
//   shutdown();
// });


// vim: ft=javascript et sw=2 sts=2
