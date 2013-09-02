var Song = require('./models').Song;

exports.init = function(io) {
  io.of('/player').on('connection', function(socket) {
    var broadcast = socket.broadcast;
    socket.on('play', function(song_id) {
      Song.find(song_id).success(function(song) {
        // TODO play the music
        broadcast.emit('play', song);
      });
    }).on('pause', function() {
      // TODO pause the music
      broadcast.emit('pause');
    }).on('stop', function() {
      // TODO stop the music
      broadcast.emit('stop');
    });
  });
};

// vim: ft=javascript et sw=2 sts=2
