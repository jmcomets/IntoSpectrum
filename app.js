// Module dependencies
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var orm = require('orm');

// Application instance
var app = express();

// All environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon(path.join(__dirname, 'static/images/favicon.ico')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
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
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'static')));
app.use(app.router);

// Watchdog child process
var watchdog = require('child_process').fork('watchdog.js');

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Base routes
app.get('/', routes.index);

// Start server
var server = http.createServer(app);

// Startup
server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

// vim: ft=javascript et sw=2 sts=2
