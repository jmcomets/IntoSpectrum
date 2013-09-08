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
      send_info('info');
    });
    socket.on('play', function(id) {
      self._player.play(id);
      send_info('response');
    });
    socket.on('play_youtube', function(url) {
      self._player.play_youtube(url);
      send_info('response');
    });
    socket.on('add_to_playlist', function(id, pos) {
      self._player.add_to_playlist(id, pos);
      send_info('response');
    });
    socket.on('play_next', function() {
      self._player.play_next();
      send_info('response');
    });
    socket.on('play_prev', function() {
      self._player.play_prev();
      send_info('response');
    });
    socket.on('pause', function(id) {
      self._player.pause(id);
      send_info('response');
    });
    socket.on('unpause', function(id) {
      self._player.unpause(id);
      send_info('response');
    });
    socket.on('stop', function(id) {
      self._player.stop(id);
      send_info('response');
    });
    socket.on('volume', function(volume) {
      self._player.volume(volume);
      send_info('response');
    });
    socket.on('time', function(id, time) {
      self._player.time(id, time);
      send_info('response');
    });
  });

  var send_info = function(name) {
    name = 'info'; // TODO on client side
    if(name == undefined)
      name = 'info';

    var info = self._player.get_info(function(info) {
      if(self._player.song_over()) {
        self._player.play_next();
      }
      else {
        // console.log(info);
        io.emit(name, info);
      }
    });
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
