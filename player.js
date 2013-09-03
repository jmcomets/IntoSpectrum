var path = require('path'),
    spawn = require('child_process').spawn,
    Song = require('./models').Song;

// Wrapper for mplayer process
var Mplayer = function() {
  this._process = null;
}

Mplayer.prototype.play = function(song) {
  // Reset process if already started
  if (this._process) { this._process.kill(); }

  // Spawn new process with appropriate file
  this._process = spawn('mplayer', ['-slave', '-quiet', song.fullPath()]);
}

Mplayer.prototype.stop = function() {
  if (this._process) {
    this._process.kill();
    this._process = null;
  }
}

Mplayer.prototype.pause = function() {
  if (this._process) {
    this._process.write('pause');
  }
}

var mplayer = new Mplayer();

// Module initializing
exports.init = function(io) {
  io.of('/player').on('connection', function(socket) {
    socket.on('play', function(song_id) {
      Song.find(song_id).success(function(song) {
        mplayer.play(song);
        socket.broadcast.emit('play', song);
      });
    }).on('pause', function() {
      if (mplayer) {
        mplayer.pause();
        socket.broadcast.emit('pause');
      }
    }).on('stop', function() {
      mplayer.stop();
      socket.broadcast.emit('stop');
    });
  });
};

// vim: ft=javascript et sw=2 sts=2
