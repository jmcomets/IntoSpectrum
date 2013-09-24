var SocketIO = require('socket.io'),
    Player = require('../player');

var listener = exports.listener = function(server) {
  var self = this;

  // To pause the first music
  this._first_song = true;

  // Player
  this._player = new Player();

  // Socket.IO
  this._io = SocketIO.listen(server).of(settings.player.url);
  this._io.on('connection', function(socket) {
    socket.on('get_info', function() {
      self.send_info('info');
    });
    socket.on('play', function(id) {
      self._player.play(id);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('play_youtube', function(url) {
      self._player.play_youtube(url);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('add_to_playlist', function(id, pos) {
      self._player.add_to_playlist(id, pos);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('play_next', function() {
      self._player.play_next();
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('play_prev', function() {
      self._player.play_prev();
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('pause', function(id) {
      self._player.pause(id);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('unpause', function(id) {
      self._player.unpause(id);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('stop', function(id) {
      self._player.stop(id);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('volume', function(volume) {
      self._player.volume(volume);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
    socket.on('time', function(id, time) {
      self._player.time(id, time);
      setTimeout(function() { self.send_info('response'); }, 500);
    });
  });

  // Timer
  var delay = 5000;
  var timer = setInterval(function() { self.send_info(); }, delay);
};

listener.prototype.kill = function(signal) {
  this._player.kill(signal);
};

listener.prototype.quit = function(code) {
  this._player.quit(code);
};

listener.prototype.send_info = function(name) {
  if(name == undefined)
    name = 'info';

  var info = this._player.get_info();
  this._io.emit(name, info);

  if(this._player.song_over())
    this._player.play_next();
};

// vim: ft=javascript et sw=2 sts=2
