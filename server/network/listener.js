var SocketIO = require('socket.io'),
    Player = require('../player');

var Listener = module.exports = function(server) {
  var self = this;

  // Player
  this._player = new Player();

  // Socket.IO
  this._io = SocketIO.listen(server).of(settings.player.url);
  this._io.on('connection', function(socket) {
    socket.on('info', function() {
      self.sendState('info');
    });
    socket.on('play', function(id) {
      self._player.play(id);
      self.sendState('response');
    });
    socket.on('youtube', function(url) {
      self._player.playYoutube(url);
      self.sendState('response');
    });
    socket.on('addToPlaylist', function(id, pos) {
      self._player.addToPlaylist(id, pos);
      self.sendState('response');
    });
    socket.on('next', function() {
      self._player.playNext();
      self.sendState('response');
    });
    socket.on('previous', function() {
      self._player.playPrevious();
      self.sendState('response');
    });
    socket.on('pause', function(id) {
      self._player.pause(id);
      self.sendState('response');
    });
    socket.on('unpause', function(id) {
      self._player.unpause(id);
      self.sendState('response');
    });
    socket.on('stop', function(id) {
      self._player.stop(id);
      self.sendState('response');
    });
    socket.on('volume', function(volume) {
      self._player.volume(volume);
      self.sendState('response');
    });
    socket.on('time', function(id, time) {
      self._player.time(id, time);
      self.sendState('response');
    });
  });

  // Timer
  var timer = function() { self.sendState(); };
  setInterval(timer, 5000);
  timer();
};

Listener.prototype.kill = function(signal) {
  this._player.kill(signal);
};

Listener.prototype.quit = function(code) {
  this._player.quit(code);
};

Listener.prototype.sendState = function(name, callback) {
  if (name == undefined) { name = 'info'; }

  var self = this;
  this._player.info(function(info) {
    self._io.emit(name, info);

    if (self._player.songIsOver()) {
      self._player.playNext();
    }

    if (callback) { callback(); }
  });
};

// vim: ft=javascript et sw=2 sts=2
