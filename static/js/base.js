$(window).load(function() {
  // Player: client-server controller
  var player = new ClientPlayer();

  // Volume control -> slider
  volumeSlider = $('#volume-progress').slider({
    'animate': 'fast',
    'orientation': 'vertical',
    'min': 0,
    'max': 100,
    'slide': function(ev, ui) {
      player.setVolume(ui.value);
    }
  });

  // Pause/Unpause -> same button
  pauseButton = $('#pause-control');

  // Stop -> button
  stopButton = $('#stop-control');

  // Track progress control
  trackSlider = $('#play-progress').slider({
    'animate': 'fast',
    'orientation': 'horizontal',
    'min': 0,
    'max': 242,
    'slide': function(ev, ui) {
      player.setTime(ui.value);
    }
  });

  // Pause/Unpause control
  pauseButton.on('click', function() { player.togglePause(); });

  // Stop control
  stopButton.on('click', function() { player.stop(); });

  // Player event hooks
  player.update = function(data) {
    // Setup the play/pause button
    if (data.playing) {
      pauseButton.find('.icon-play').hide();
      pauseButton.find('.icon-pause').show();
    } else {
      pauseButton.find('.icon-play').show();
      pauseButton.find('.icon-pause').hide();
    }

    // Update the play count
    if (data.playing) {
      $('[song-id="' + data.id + '"]').siblings().last().text(data.play_count);
    }

    // Set the volume
    volumeSlider.slider('value', data.volume);

    // Set the time
    trackSlider.slider('value', data.time);
    trackSlider.slider('option', 'max', data.time_max);
  };

  // Explicitly connect the player
  player.connect('/player');

  // Load songs protocol (data handler, current cursor, end handler)
  var loadSongs = function(fn, end, c) {
    var cursor = parseInt(c) || 1;
    $.getJSON('/library/' + cursor, function(data) {
      fn(data);
      if (data.next) {
        loadSongs(fn, end, cursor + 1);
      } else { end(); }
    });
  };

  // Load songs
  var loadContainer = $('#library-loading'),
    loadCurrent = $('#library-loading-current');
  loadSongs(function(data) {
    // Append songs to the #library
    var library = $('#library');
    $.each(data.songs, function(_, song) {
      var title = song.title || '',
        artist = song.artist || '',
        album = song.album || '',
        year = song.year || '';

      // Create the DOM element
      var row = $('<tr></tr>');
      row.html(
        '<td song-id="' + song.id + '">' + song.id + '</td>' +
        '<td>' + title      + '</td>' +
        '<td>' + artist     + '</td>' +
        '<td>' + album      + '</td>' +
        '<td>' + year       + '</td>' +
        '<td>' + song.playCount + '</td>'
        );

      // Hook events
      row.on('click', function() {
        player.play($(this).children().first().text());
      });

      // Update the modal's "current" loading
      var songTitle = song.title || song.path;
      loadCurrent.text('Loaded song "' + songTitle + '"');

      // Add to the library container
      library.append(row);
    });
  }, function() {
    // Loading finished
    loadContainer.hide();
  });
});

// vim: ft=javascript et sw=2 sts=2
