$(window).load(function() {
  // Load songs
  (function(fn) {
    var loadSongs = function(c) {
      var cursor = parseInt(c) || 1;
      $.getJSON('/library/' + cursor, function(data) {
        if (data.next) {
          loadSongs(cursor + 1);
          fn(data.songs);
        }
      });
    };
    loadSongs();
  })(function(songs) {
    console.log(songs); // TODO
  });

  // Main player instance
  var player = new Player('/player');

  // Player event hooks
  player.on('play', function() {
    console.log('play event');
  }).on('pause', function() {
    console.log('pause event');
  }).on('stop', function() {
    console.log('stop event');
  });
});

// vim: ft=javascript et sw=2 sts=2
