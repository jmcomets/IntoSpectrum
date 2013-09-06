var SocketIO = require('socket.io'),
    Player = require('../player');

exports.listen = function(server) {
  // Player
  var player = new Player();

  // Socket.IO
  var io = SocketIO.listen(server).of(settings.player.url);
  io.on('connection', function(socket) {
    socket.on('get_info', function() {
      send_info();
    });
    socket.on('play', function(id) {
      player.play(id);
      send_info();
    });
    socket.on('pause', function(id) {
      player.pause(id);
      send_info();
    });
    socket.on('unpause', function(id) {
      player.unpause(id);
      send_info();
    });
    socket.on('stop', function(id) {
      player.stop(id);
      send_info();
    });
    socket.on('volume', function(volume) {
      player.volume(volume);
      send_info();
    });
    socket.on('time', function(id, time) {
      player.time(id, time);
      send_info();
    });
  });

  var send_info = function() {
    var info = player.get_info();
    console.log(info);
    io.emit('info', info);
  };

  // Timer
  var delay = 5000;
  var timer = setInterval(send_info, delay);
};

// vim: ft=javascript et sw=2 sts=2
