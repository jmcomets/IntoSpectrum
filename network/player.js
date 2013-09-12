var SocketIO = require('socket.io'),
    Player = require('../player');

var listener = exports.listener = function(server) {
  var self = this;

  // To pause the first music
  this._first_song = true;

  // Player
  this._player = new Player();

  // Socket.IO
  var io = SocketIO.listen(server).of(settings.player.url);
  io.on('connection', function(socket) {
    socket.on('get_info', function() {
      // send_info('info');
    });
    socket.on('play', function(id) {
      self._player.play(id);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('play_youtube', function(url) {
      self._player.play_youtube(url);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('add_to_playlist', function(id, pos) {
      self._player.add_to_playlist(id, pos);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('play_next', function() {
      self._player.play_next();
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('play_prev', function() {
      self._player.play_prev();
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('pause', function(id) {
      self._player.pause(id);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('unpause', function(id) {
      self._player.unpause(id);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('stop', function(id) {
      self._player.stop(id);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('volume', function(volume) {
      self._player.volume(volume);
      setTimeout(function() { send_info('response'); }, 200);
    });
    socket.on('time', function(id, time) {
      self._player.time(id, time);
      setTimeout(function() { send_info('response'); }, 200);
    });
  });

  var send_info = function(name) {
    if(name == undefined)
      name = 'info';

    var info = self._player.get_info();
    io.emit(name, info);

    if(self._player.song_over())
      self._player.play_next();
  };

  // Timer
  var delay = 5000;
  var timer = setInterval(send_info, delay);
};

listener.prototype.kill = function(signal) {
  this._player.kill(signal);
};

listener.prototype.quit = function(code) {
  this._player.quit(code);
};

// vim: ft=javascript et sw=2 sts=2
