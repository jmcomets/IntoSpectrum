$(window).load(function() {
  // Inplace objects: define with a dictionary,
  // constructor is the (optional) init method
  var init = function(obj) {
    if (obj.init != undefined) { obj.init(); }
    return obj;
  };
  // ...same with JQuery objects, passing a selector to the $ function
  // and setting the "$" member as a reference to its return value
  var $init = function(selector, obj) {
    obj.$ = $(selector);
    return init(obj);
  };

  // Player: client-server controller
  var player = new ClientPlayer();

  // Volume control -> slider
  var volumeControl = $init('#volume-progress', {
    'init': function() {
      this.$.slider({
        'range': 'min',
        'slide': function(ev, ui) {
          player.setVolume(ui.value);
        }
      });
    }, 'setVolume': function(volume) {
      this.$.slider('value', volume);
    }
  });

  // Pause/Unpause -> same button
  var pauseButton = $init('#pause-control', {
    'init': function() {
      this.$.on('click', function() { player.togglePause(); });
    }, 'setPlaying': function(playing) {
      if (playing) {
        this.$.find('.glyphicon-play').show();
        this.$.find('.glyphicon-pause').hide();
      } else {
        this.$.find('.glyphicon-pause').hide();
        this.$.find('.glyphicon-play').show();
      }
    }
  });

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

  // Right-click context menu for songs
  var songMenu = $init('#song-context-menu', {
    'init': function() {
      this.dropdown = this.$.children().first();
    }, 'action': function(fn) {
      var that = this;
      return function(e) {
        e.stopPropagation();
        e.preventDefault();
        fn(that.dropdown.attr('data-song-id'));
        that.$.removeClass('open');
      };
    }, 'open': function(x, y) {
      this.dropdown.dropdown('toggle');
      this.$.css('position', 'absolute');
      if (x != undefined && y != undefined) {
        this.$.css({ 'top': y, 'left': x });
      }
    }, 'close': function() {
      this.$.removeClass('open');
    }, 'setSongId': function(songId) {
      this.dropdown.attr('data-song-id', songId);
    }
  });
  // ...play song
  $('#song-action-play').click(songMenu.action(function(songId) { player.play(songId); }));
  // ...play song next
  $('#song-action-next').click(songMenu.action(function(songId) { player.addAsNext(songId); }));
  // ...add song to play queue
  $('#song-action-queue').click(songMenu.action(function(songId) { player.addToPlayQueue(songId); }));

  // Panel interface
  $('#tab-playlist').children().first().sortable();

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
    pauseButton.setPlaying(true);

    // Active row -> current playing
    setActiveRow(this.state.id);

    // Change play progress max time
    playProgress.attr('data-max-time', this.state.time_max);

    // Advance progress bar automatically
    var updatesPerSec = 1;
  }).bind('stop', function() {
    pauseButton.setPlaying(false);
    stopAdvancingProgress();
    updateProgress(0);
    setActiveRow();
  }).bind('unpause', function() {
    pauseButton.setPlaying(true);
    startAdvancingProgress();
  }).bind('pause', function() {
    pauseButton.setPlaying(false);
    stopAdvancingProgress();
  }).bind('volume', function() {
    volumeControl.setVolume(this.state.volume);
  }).bind('time', function() {
    percentage = 100 * this.state.time / this.state.time_max;
    updateProgress(percentage);
  }).bind('info', function() {
    // Play/pause button
    pauseButton.setPlaying(this.state.playing);

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
    volumeControl.setVolume(this.state.volume);
  }).bind('disconnected', function() {
    stopAdvancingProgress();
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
        songMenu.close();
      }).on('contextmenu', function(e) {
        // Disable context menu
        e.preventDefault();

        // Song selected
        var songId = $(this).attr('id').substring(idPrefix.length);
        songMenu.setSongId(songId);

        // Toggle dropdown and move to cursor position
        songMenu.open(e.pageX, e.pageY);
      });

      // Add to the library container
      library.append(row);

      // Update load progress
      //updateLoadProgress();
    });
  }, function() {
    // Loading finished
    $('#library-loading').hide();
  });
});

// vim: ft=javascript et sw=2 sts=2
