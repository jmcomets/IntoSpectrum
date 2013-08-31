// Module base dependencies
var express = require('express');
var path = require('path');

// Application instance
var app = express();

// All environments
app.set('port', process.env.PORT || 3000);

// Favicon
app.use(express.favicon(path.join(__dirname, 'static/images/favicon.ico')));

// Swig template engine
var swig = require('swig');
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);

// TODO move this in a separate module
var orm = require('orm');
app.use(orm.express('mysql://root@localhost/into_spectrum', {
      define: function(db, models, next) {
        models.song = db.define('song', {
          path: { type: 'text' },
          title: { type: 'text' },
          artist: { type: 'text' },
          album: { type: 'text' },
          track_number: { type: 'number' },
          year: { type: 'number' },
          play_count: { type: 'number' }
        });
      }
}));

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
app.get('/library', routes.library);

// Watchdog
var watchdog = require('./watchdog');

// Start server
var http = require('http');
var server = http.createServer(app);

// Startup
server.listen(app.get('port'), function() {
  var address = server.address();
  console.log('Server started at http://%s:%s\nPress Ctrl-C to stop', address.address, address.port);
  watchdog.start();
});

// Shutdown
process.on('SIGINT', function() {
  console.log('Server shutting down');
  watchdog.stop();
  server.close();
  process.exit();
});

// vim: ft=javascript et sw=2 sts=2
