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
  var playProgress = $init('#play-progress', {
    'init': function() {
      var that = this;
      this._maxTime = undefined;
      this._percentage = 0;

      // Event hook
      this.$.parents().first().on('click', function(e) {
        var ratio = (e.pageX - $(this).position().left) / $(this).width();
        if (that._maxTime) { player.setTime(that._maxTime * ratio); }
      });
    }, 'autoUpdate': function(enabled) {
      if (enabled == true || enabled == undefined) {
        var that = this, updatesPerSec = 2;
        if (this._autoId != -1) { clearInterval(this._autoId); }
        this._autoId = setInterval(function() {
          that.setPercentage(that._percentage + 100 / (that._maxTime * updatesPerSec));
        }, 1000 / updatesPerSec);
      } else if (this._autoId != -1) {
        clearInterval(this._autoId);
        this._autoId = -1;
      }
    }, 'setPercentage': function(percentage) {
      percentage = parseFloat(percentage);
      if (percentage != undefined) {
        this._percentage = percentage;
        this.$.css('width', this._percentage + '%');
      }
    }, 'setMaxTime': function(maxTime) {
      maxTime = parseFloat(maxTime);
      if (maxTime != undefined) { this._maxTime = maxTime; }
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

  // Player event hooks
  var percentage = 0;
  player.bind('play', function() {
    pauseButton.setPlaying(true);

    // Active row -> current playing
    setActiveRow(this.state.id);

    // Change play progress max time
    playProgress.setMaxTime(this.state.time_max);

    // Advance progress bar automatically
    playProgress.autoUpdate();
  }).bind('stop', function() {
    pauseButton.setPlaying(false);
    playProgress.autoUpdate(false);
    playProgress.setPercentage(0);
    setActiveRow();
  }).bind('unpause', function() {
    pauseButton.setPlaying(true);
    playProgress.autoUpdate();
  }).bind('pause', function() {
    pauseButton.setPlaying(false);
    playProgress.autoUpdate(false);
  }).bind('volume', function() {
    volumeControl.setVolume(this.state.volume);
  }).bind('time', function() {
    percentage = 100 * this.state.time / this.state.time_max;
    playProgress.setPercentage(percentage);
  }).bind('info', function() {
    // Play/pause button
    pauseButton.setPlaying(this.state.playing);

    // Clear all active rows
    $('#library').children().removeClass('info');

    // Set the player's max-time attribute
    playProgress.setMaxTime(this.state.time_max);

    // Update the play count
    if (this.state.playing) {
      playProgress.autoUpdate();
      var songRow = $('#song-id-' + this.state.id + '');

      // Set as "active" row
      songRow.addClass('info');
    }

    // Play progress section
    playProgress.setPercentage(100 * this.state.time / this.state.time_max);

    // Set the volume
    volumeControl.setVolume(this.state.volume);
  }).bind('disconnected', function() {
    playProgress.autoUpdate(false);
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
