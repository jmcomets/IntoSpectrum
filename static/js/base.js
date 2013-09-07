$(window).load(function() {
  // Player: client-server controller
  var player = new ClientPlayer();

  // Volume control -> slider
  var volumeSlider = $('#volume-progress').slider({
    'animate': 'fast',
    'range': 'min',
    'orientation': 'horizontal',
    'min': 0,
    'max': 100,
    'slide': function(ev, ui) {
      player.setVolume(ui.value);
    }
  });

  // Pause/Unpause -> same button
  var pauseButton = $('#pause-control');

  // Other controls
  $('#stop-control').on('click', function() { player.stop(); });
  $('#next-control').on('click', function() { player.playNext(); });
  $('#previous-control').on('click', function() { player.playPrevious(); });

  // Track progress control
  var playProgress = $('#play-progress').tooltip();
  playProgress.parents().first().on('click', function(e) {
    var ratio = (e.pageX - $(this).position().left) / $(this).width(),
      maxTime = parseInt(playProgress.attr('data-max-time'));
    if (maxTime) {
      player.setTime(maxTime * ratio);
    }
  });

  // Pause/Unpause control
  pauseButton.on('click', function() { player.togglePause(); });

  // Right-click context menu for songs
  var songContextMenu = $('#song-context-menu'),
      songContextMenuDropdown = songContextMenu.children().first(),
      songAction = function(fn) {
        return function(e) {
          e.stopPropagation();
          e.preventDefault();
          fn(songContextMenuDropdown.attr('data-song-id'));
          songContextMenu.removeClass('open');
        };
      };
  // ...play song
  $('#song-action-play').on('click', songAction(function(songId) {
    player.play(songId);
  }));
  // ...play song next
  $('#song-action-next').on('click', songAction(function(songId) {
    player.addAsNext(songId);
  }));
  // ...add song to play queue
  $('#song-action-queue').on('click', songAction(function(songId) {
    player.addToPlayQueue(songId);
  }));

  // Player update
  var advanceIntervalId = -1, percentage = 0;
  player.update = function(data) {
    // Setup the play/pause button
    if (data.playing) {
      pauseButton.find('.icon-play').hide();
      pauseButton.find('.icon-pause').show();
    } else {
      pauseButton.find('.icon-play').show();
      pauseButton.find('.icon-pause').hide();
    }

    // Clear all active rows
    $('#library').children().removeClass('info');

    // Set the player's max-time attribute
    playProgress.attr('data-max-time', data.time_max);

    // Update the play count
    if (data.playing) {
      var songRow = $('#song-id-' + data.id + '');

      // Set as "active" row
      songRow.addClass('info');

      // Update play count
      songRow.siblings().last().text(data.play_count);

      // Advance progress bar automatically
      var updatesPerSec = 1;
      if (advanceIntervalId == -1) {
        advanceIntervalId = setInterval(function() {
          var percentageInc = 100 / parseFloat(playProgress.attr('data-max-time'));
          percentage += percentageInc / updatesPerSec;
          playProgress.css('width', percentage + '%');
        }, 1000 / updatesPerSec);
      }
    } else {
      if (advanceIntervalId != -1) {
        clearInterval(advanceIntervalId);
        advanceIntervalId = -1;
      }
    }

    // Play progress section
    percentage = 100 * data.time / data.time_max;
    playProgress.css('width', percentage + '%');

    // Set the volume
    volumeSlider.slider('value', data.volume);
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
      var missing = 'N/A', html = ''
        +  '<td>'  +  (song.artist    ||  missing)  +  '</td>'
        +  '<td>'  +  (song.album     ||  missing)  +  '</td>'
        +  '<td>'  +  (song.year      ||  missing)  +  '</td>'
        +  '<td>'  +  song.playCount  +   '</td>';

      // Title is either given or file basename without extension
      var title = (song.title) ? song.title : function(str) {
        str = str.substring(str.lastIndexOf('/') + 1, str.length);
        return str.substring(0, str.lastIndexOf('.'));
      } (song.path);
      html = '<td>' + title + '</td>' + html;

      // Create the DOM element
      var idPrefix = 'song-id-', row = $('<tr id="' + idPrefix + song.id + '"></tr>');
      row.html(html);

      // Hook events
      row.on('click', function() {
        var id = $(this).attr('id').substring(idPrefix.length);
        player.play(id);
        songContextMenu.removeClass('open');
      }).on('contextmenu', function(e) {
        // Disable context menu
        e.preventDefault();

        // Song selected
        var songId = $(this).attr('id').substring(idPrefix.length);
        songContextMenuDropdown.attr('data-song-id', songId);

        // Toggle dropdown and move to cursor position
        songContextMenuDropdown.dropdown('toggle');
        songContextMenu.css({
          'position': 'absolute',
          'top': e.pageY,
          'left': e.pageX
        });
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
