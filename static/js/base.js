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
    // Song -> bootstrap-player
    btPlayerMap = {
      'album': 'data-info-album-title',
      'artist': 'data-info-artist',
      'title': 'data-info-title',
      'year': 'data-info-year'
    }

    // Append songs to the #library
    var library = $('#library');
    $.each(songs, function(_, song) {
      var audio = $('<audio controls=""></audio>');
      $.each(btPlayerMap, function(key, value) {
        if (song[key] != undefined) { audio.attr(value, song[key]); }
      });
      audio.playa();
      library.append(audio);
    });
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
