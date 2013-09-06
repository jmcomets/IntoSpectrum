$(window).load(function() {
  // Player: client-server controller
  var player = new ClientPlayer();

  // Volume control -> slider
  volumeSlider = $('#volume-progress').slider({
    'animate': 'fast',
    'range': 'min',
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
    'animate': 'slow',
    'range': 'min',
    'orientation': 'horizontal',
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
      var html = '', titleColSpan = 1;

      // Artist section
      if (song.artist) {
        html += '<td>' + song.artist + '</td>';
      } else {
        titleColSpan += 1;
      }

      // Album section
      if (song.album) {
        html += '<td>' + song.album + '</td>';
      } else {
        titleColSpan += 1;
      }

      // Year section
      if (song.year) {
        html += '<td>' + song.year + '</td>';
      } else {
        titleColSpan += 1;
      }

      // Play count section
      html += '<td>' + song.playCount + '</td>';

      // Title is either given or file basename without extension
      var title = (song.title) ? song.title : function(str) {
        str = str.substring(str.lastIndexOf('/') + 1, str.length);
        return str.substring(0, str.lastIndexOf('.'));
      } (song.path);
      html = '<td colspan="' + titleColSpan + '">' + title + '</td>' + html;

      // Create the DOM element
      var row = $('<tr></tr>');
      row.attr('song-id', song.id);
      row.html(html);

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
