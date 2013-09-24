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
      self.send_info('response');
    });
    socket.on('play_youtube', function(url) {
      self._player.play_youtube(url);
      self.send_info('response');
    });
    socket.on('add_to_playlist', function(id, pos) {
      self._player.add_to_playlist(id, pos);
      self.send_info('response');
    });
    socket.on('play_next', function() {
      self._player.play_next();
      self.send_info('response');
    });
    socket.on('play_prev', function() {
      self._player.play_prev();
      self.send_info('response');
    });
    socket.on('pause', function(id) {
      self._player.pause(id);
      self.send_info('response');
    });
    socket.on('unpause', function(id) {
      self._player.unpause(id);
      self.send_info('response');
    });
    socket.on('stop', function(id) {
      self._player.stop(id);
      self.send_info('response');
    });
    socket.on('volume', function(volume) {
      self._player.volume(volume);
      self.send_info('response');
    });
    socket.on('time', function(id, time) {
      self._player.time(id, time);
      self.send_info('response');
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

  var self = this;
  var info = this._player.get_info(function(info) {
    self._io.emit(name, info);

    if(self._player.song_over())
    self._player.play_next();
  });
};

// vim: ft=javascript et sw=2 sts=2
