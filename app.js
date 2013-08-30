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

// Watchdog child process
var watchdog = require('child_process').fork('watchdog.js');

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Base routes
var routes = require('./routes');
app.get('/', routes.index);

// Start server
var http = require('http');
var server = http.createServer(app);

// Startup
server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

// vim: ft=javascript et sw=2 sts=2
