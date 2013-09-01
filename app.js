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

// Sequelize
var Sequelize = require('sequelize'),
    db = new Sequelize('into_spectrum', 'root', '', {
      'dialect': 'mysql'
    });


// Models
var Song = db.define('Song', {
  'id': {
    'type': Sequelize.INTEGER,
    'primaryKey': true,
    'autoIncrement': true
  },
  'path': {
    'type': Sequelize.STRING
  },
  'title': {
    'type': Sequelize.STRING
  },
  'artist': {
    'type': Sequelize.STRING
  },
  'album': {
    'type': Sequelize.STRING
  },
  'year': {
    'type': Sequelize.INTEGER
  },
  'play_count': {
    'type': Sequelize.INTEGER
  }
});

// Synchronise models
Song.sync();

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

// Start server
var http = require('http');
var server = http.createServer(app);

// Player
var player = require('socket.io').listen(server).of('/player')
      .on('connection', function(socket) {
        socket
          .on('play', function(song_id) { player.emit('play', song_id); })
          .on('pause', function() { player.emit('pause'); })
          .on('stop', function() { player.emit('stop'); });
      });

// Watchdog
var watchdog = require('./watchdog');
watchdog.configure({
  'song_model': Song,
  'media_root': path.join(__dirname, 'media')
});

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
