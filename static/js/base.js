$(window).load(function() {
  // Main player instance
  var player = new Player('/player');

  // Load songs protocol (data handler, current cursor, end handler)
  var loadSongs = function(fn, end, c) {
    var cursor = parseInt(c) || 1;
    $.getJSON('/library/' + cursor, function(data) {
      if (data.next) {
        fn(data);
        loadSongs(fn, end, cursor + 1);
      } else { end(); }
    });
  };

  // Load songs
  var loadModal = $('#library-loading-modal').modal(),
    loadModalCurrent = $('#library-loading-current');
  loadSongs(function(data) {
    // Append songs to the #library
    var library = $('#library');
    $.each(data.songs, function(_, song) {
      var id = song.id || '',
        title = song.title || '',
        artist = song.artist || '',
        album = song.album || '',
        year = song.year || '',
        play_count = song.play_count || '';

      // Create the DOM element
      var tr = $('<tr></tr>');
      tr.html(
        '<td>' + id         + '</td>' +
        '<td>' + title      + '</td>' +
        '<td>' + artist     + '</td>' +
        '<td>' + album      + '</td>' +
        '<td>' + year       + '</td>' +
        '<td>' + play_count + '</td>'
        );

      // Hook events
      tr.on('click', function() {
        player.play($(this).children().first().text());
      });

      // Update the modal's "current" loading
      var songTitle = song.title || song.path;
      loadModalCurrent.text('Loaded song "' + songTitle + '"');

      // Add to the library container
      library.append(tr);
    });
  }, function() {
    // Loading finished
    loadModal.modal('hide');

    // Player event hooks
    player.on('play', function(song) {
      console.log('play event');
    }).on('pause', function() {
      console.log('pause event');
    }).on('stop', function() {
      console.log('stop event');
    });
  });
});

// vim: ft=javascript et sw=2 sts=2
