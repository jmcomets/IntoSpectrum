var path = require('path'),
    socketIO = require('socket.io'),
    spawn = require('child_process').spawn,
    settings = require('./settings'),
    Song = require('./models').Song;

// Mplayer class: wrapper for mplayer process
var Mplayer = function() {
  this._process = null;
};

// Play a song brutally, stopping any current playing song
Mplayer.prototype.play = function(song) {
  // Stored for convenience in callbacks
  var that = this;

  // Reset process if already started
  if (this._process) { this._process.kill(); }

  // Spawn new process with appropriate file
  this._process = spawn('mplayer', ['-slave', '-quiet', song.fullPath()]);

  // Handle process end
  this._process.on('exit', function() {
    that._process = null;
  });
};

// Stop the current playing song, throwing if none is playing
Mplayer.prototype.stop = function() {
  if (this._process) {
    this._process.write('stop');
    this._process.disconnect();
    this._process = null;
  } else {
    throw new Error('Cannot stop, no song currently playing');
  }
};

Mplayer.prototype.pause = function() {
  if (this._process) {
    this._process.write('pause');
  } else {
    throw new Error('Cannot pause, no song currently playing');
  }
};

// Listener export (main function of the module)
exports.listen = function(server) {
  // Socket.IO
  var io = socketIO.listen(server).of(settings.player.url);

  // Mplayer
  var mplayer = new Mplayer();

  // Server setup
  io.on('connection', function(socket) {
    socket.on('play', function(song_id) {
      Song.find(song_id).success(function(song) {
        mplayer.play(song);
        song.playCount += 1
        song.save();
        io.emit('play', song);
      });
    }).on('pause', function() {
      mplayer.pause();
      io.emit('pause');
    }).on('stop', function() {
      mplayer.stop();
      io.emit('stop');
    });
  });
};

// vim: ft=javascript et sw=2 sts=2
