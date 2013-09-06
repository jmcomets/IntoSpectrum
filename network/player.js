var SocketIO = require('socket.io'),
    Player = require('../player');

exports.listen = function(server) {
  // Player
  var player = new Player();

  // Socket.IO
  var io = SocketIO.listen(server).of(settings.player.url);
  io.on('connection', function(socket) {
    socket.on('get_info', function() {
      player.send_info();
    });
    socket.on('play', function(id) {
      player.play(id);
    });
    socket.on('pause', function(id) {
      player.pause(id);
    });
    socket.on('unpause', function(id) {
      player.unpause(id);
    });
    socket.on('stop', function(id) {
      player.stop(id);
    });
    socket.on('volume', function(volume) {
      player.volume(volume);
    });
    socket.on('time', function(id, time) {
      player.time(id, time);
    });
  });

  // Timer
  var delay = 420;
  var timer = setInterval(function() {
    var info = player.get_info();
    console.log(info);
    io.emit('info', info);
  }, delay);
};

// vim: ft=javascript et sw=2 sts=2
