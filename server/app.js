// Module base dependencies
var express = require('express'),
    path = require('path')
    settings = require('./settings');

// Application instance
var app = express();

// Debug/release guards
var inDevelopment = (app.get('env') == 'development'),
    debugOnly = function(fn) {
  if (inDevelopment) { fn(); }
}, releaseOnly = function(fn) {
  if (!inDevelopment) { fn(); }
};

// Error handler in debug mode
debugOnly(function() {
  app.use(express.errorHandler());
});

// All environments
app.set('port', process.env.PORT || 3000);

// Static files
var staticFilesDir = path.join(__dirname, '..', 'public');
console.log(staticFilesDir);
app.use(express.static(staticFilesDir));

// Favicon
var iconFile = path.join(staticFilesDir, 'img', 'favicon.ico');
app.use(express.favicon(iconFile));

// Other configuration options
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// Network
var network = require('./network');

// API
var api = require('./api');
// ...library loading
app.get('/api/songs?/(:id)?/?', api.songs);

// Start server
var http = require('http');
var server = http.createServer(app);
// ...player
var listener = new network.Listener(server);

// Startup
var startup = function() {
  debugOnly(function() {
    var address = server.address();
    console.log('Server started at http://%s:%s\nPress Ctrl-C to stop',
      address.address, address.port);
  });
};

// Shutdown
var shutdown = function() {
  debugOnly(function() {
    console.log('Server shutting down');
  });
  listener.quit();
  server.close();
  listener.kill(); // Just in case
  process.exit();
};

// Configure startup/shutdown
server.listen(app.get('port'), startup);
process.on('SIGINT', shutdown);
// ...only in debug mode
debugOnly(function() {
  process.on('uncaughtException', function(err) {
    console.log('Uncaught exception: ' + err);
    shutdown();
  });
});

// vim: ft=javascript et sw=2 sts=2
