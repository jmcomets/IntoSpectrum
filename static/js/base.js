$(window).load(function() {
  // Player: client-server controller
  var player = new ClientPlayer();

  // Volume control -> slider
  var volumeSlider = $('#volume-progress').slider({
    'animate': true,
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
  var playProgress = $('#play-progress');
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

  // Panel interface
  $('#tab-playlist').children().first().sortable();

  // Pause button refactoring
  var setPauseButtonState = function(playing) {
    if (playing) {
      pauseButton.find('.glyphicon-play').show();
      pauseButton.find('.glyphicon-pause').hide();
    } else {
      pauseButton.find('.glyphicon-pause').hide();
      pauseButton.find('.glyphicon-play').show();
    }
  };

  // Active row refactoring
  var setActiveRow = function(songId) {
    $('#library .info').removeClass('info');
    if (songId != undefined) {
      $('#song-id-' + songId).addClass('info');
    }
  };

  // Progress bar refactoring
  var advanceIntervalId = -1, updatesPerSec = 2;
  var startAdvancingProgress = function() {
    if (advanceIntervalId != -1) { clearInterval(advanceIntervalId); }
    advanceIntervalId = setInterval(function() {
      var percentage = parseFloat(playProgress.attr('data-percentage')) || 0,
        percentageInc = 100 / parseFloat(playProgress.attr('data-max-time'));
      percentage += percentageInc / updatesPerSec;
      updateProgress(percentage);
    }, 1000 / updatesPerSec);
  }, stopAdvancingProgress = function() {
    if (advanceIntervalId != -1) {
      clearInterval(advanceIntervalId);
      advanceIntervalId = -1;
    }
  }, updateProgress = function(percentage) {
    playProgress.attr('data-percentage', percentage);
    playProgress.css('width', percentage + '%');
  };

  // Player event hooks
  var percentage = 0;
  player.bind('play', function() {
    setPauseButtonState(true);

    // Active row -> current playing
    setActiveRow(this.state.id);

    // Change play progress max time
    playProgress.attr('data-max-time', this.state.time_max);

    // Advance progress bar automatically
    var updatesPerSec = 1;
  }).bind('stop', function() {
    setPauseButtonState(false);
    stopAdvancingProgress();
    updateProgress(0);
    setActiveRow();
  }).bind('unpause', function() {
    setPauseButtonState(true);
    startAdvancingProgress();
  }).bind('pause', function() {
    setPauseButtonState(false);
    stopAdvancingProgress();
  }).bind('volume', function() {
    volumeSlider.slider('value', this.state.volume);
  }).bind('time', function() {
    percentage = 100 * this.state.time / this.state.time_max;
    updateProgress(percentage);
  }).bind('info', function() {
    // Play/pause button
    if (this.state.playing) {
      pauseButton.find('.glyphicon-play').hide();
      pauseButton.find('.glyphicon-pause').show();
    } else {
      pauseButton.find('.glyphicon-play').show();
      pauseButton.find('.glyphicon-pause').hide();
    }

    // Clear all active rows
    $('#library').children().removeClass('info');

    // Set the player's max-time attribute
    playProgress.attr('data-max-time', this.state.time_max);

    // Update the play count
    if (this.state.playing) {
      startAdvancingProgress();
      var songRow = $('#song-id-' + this.state.id + '');

      // Set as "active" row
      songRow.addClass('info');
    }

    // Play progress section
    updateProgress(100 * this.state.time / this.state.time_max);

    // Set the volume
    volumeSlider.slider('value', this.state.volume);
  });

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
        +  '<td>'  +  (song.album     ||  missing)  +  '</td>';

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
