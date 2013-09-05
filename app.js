// Module base dependencies
var express = require('express'),
    path = require('path')
    settings = require('./settings');

// Application instance
var app = express();

// All environments
app.set('port', process.env.PORT || 3000);

// Favicon
app.use(express.favicon(path.join(__dirname, 'static/img/favicon.ico')));

// Swig template engine
app.engine('html', require('swig').renderFile);
app.set('view engine', settings.views.extension);
app.set('views', settings.views.path);
app.set('view cache', settings.views.cache);

// Static files
app.use(express.static(path.join(__dirname, 'static')));

// Other configuration options
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
var routes = require('./routes');
app.get('/', routes.index);
app.get('/library/?(:cursor)?', routes.library);

// Start server
var http = require('http');
var server = http.createServer(app);

// Player
var player = require('./player').listen(server);

// Watchdog
var watchdog = require('./watchdog');

// Startup
server.listen(app.get('port'), function() {
  var address = server.address();
  console.log('Server started at http://%s:%s\nPress Ctrl-C to stop',
    address.address, address.port);
  watchdog.start({ 'logging': false });
});

// Shutdown
process.on('SIGINT', function() {
  console.log('Server shutting down');
  watchdog.stop();
  server.close();
  process.exit();
});

// vim: ft=javascript et sw=2 sts=2
