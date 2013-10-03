$(window).load(function() {
  // Inplace objects: define with a dictionary,
  // constructor is the (optional) init method
  var init = function(obj) {
    if (obj.init !== undefined) { obj.init(); }
    return obj;
  };
  // ...same with JQuery objects, passing a selector to the $ function
  // and setting the "$" member as a reference to its return value
  var $init = function(selector, obj) {
    if (obj === undefined) { obj = {}; }
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
      this._playIcon = this.$.find('.glyphicon-play');
      this._pauseIcon = this.$.find('.glyphicon-pause');
    }, 'setPlaying': function(playing) {
      if (playing || playing === undefined) {
        this._playIcon.hide();
        this._pauseIcon.show();
      } else {
        this._playIcon.show();
        this._pauseIcon.hide();
      }
    }
  });

  // Library widget
  var songLibrary = $init('#library', {
    'init': function() {
      this.songIdPrefix = 'song-id-';

      // Shortcut to go to current
      var that = this;
      $(document).on('keypress', function(e) {
        if (String.fromCharCode(e.charCode || e.keyCode) == 'M')
        {
          var currentRow = that.$.find('tr.warning');
          if (currentRow) {
            var topOffset = currentRow.offset().top - $(window).height() / 2;
            $('html, body').animate({ 'scrollTop': topOffset }, 1000);
          }
        }
      }); // TODO clean this up
    }, 'getSongById': function(songId) {
      return this.$.find('#' + this.songIdPrefix + songId);
    }, 'addSong': function(song) {
      var missing = 'Unknown', html = '' +
        '<td>'   +  (song.artist  ||  missing)     +
        '</td>'  +  '<td>'        +   (song.album  ||  missing)  +  '</td>';

      // Title is either given or file basename without extension
      var title = (song.title) ? song.title : function(str) {
        str = str.substring(str.lastIndexOf('/') + 1, str.length);
        return str.substring(0, str.lastIndexOf('.'));
      } (song.path);
      html = '<td>' + title + '</td>' + html;

      // Create the DOM element
      var row = $('<tr id="' + this.songIdPrefix + song.id + '"></tr>');
      row.html(html);

      // Hook events
      var that = this;
      row.on('click', function() {
        var id = $(this).attr('id').substring(that.songIdPrefix.length);
        player.play(id);
        songMenu.close();
      }).on('contextmenu', function(e) {
        // Disable context menu
        e.preventDefault();

        // Song selected
        var songId = $(this).attr('id').substring(that.songIdPrefix.length);
        songMenu.setSongId(songId);

        // Toggle dropdown and move to cursor position
        songMenu.open(e.pageX, e.pageY);
      });

      // Add to the library container
      this.$.append(row);
    }, 'activateSong': function(songId) {
      var emphasisClass = 'warning';
      this.$.find('.' + emphasisClass).removeClass(emphasisClass);
      if (songId !== undefined) { this.getSongById(songId).addClass(emphasisClass); }
    }
  });

  // Playlist
  var playlist = $init('#playlist', {
    'init': function () {
      this.$.sortable({
        'start': function(evt, ui) {
          $(this).attr('data-prev-index', ui.item.index());
        }, 'update': function(evt, ui) {
          var oldIndex = $(this).attr('data-prev-index'), newIndex = ui.item.index();
          player.moveInPlaylist(oldIndex, newIndex);
        }
      });
    }, '_makeElement': function(songId) {
      return $(''
        + '<li class="list-group-item row">'
        + '<div class="col-md-9">'
        + songLibrary.getSongById(songId).children().first().text()
        + '</div>'
        + '<div class="col-md-1"><a href="#"><span class="glyphicon glyphicon-play"></span></a></div>'
        + '<div class="col-md-1"><a href="#"><span class="glyphicon glyphicon-remove"></span></a></div>'
        + '</li>'
      );
    }, 'addAsNext': function(songId) {
      this.$.prepend(this._makeElement(songId));
    }, 'addToPlayQueue': function(songId) {
      this.$.append(this._makeElement(songId));
    }
  });

  // Search on Youtube
  var youtubeSearch = $init('#youtube-search-results', {
    'init': function() {
      this.loader = $('#youtube-loading');
    }, 'search': function(query) {
      var url = 'https://gdata.youtube.com/feeds/api/videos?alt=json&q=' + encodeURI(query),
        that = this;
      that.loader.show();
      $.getJSON(url, function(data) {
        that.loader.hide();
        that._handleResults(data);
      });
    }, '_handleResults': function(data) {
      var that = this;
      this.$.html('');
      $.each(data.feed.entry, function(_, entry) {
        // Get appropriate (formatted) data
        var title = function(title) {
          var maxLength = 30;
          if (title.length > maxLength) {
            return title.substring(0, maxLength) + '...';
          } else {
            return title;
          }
        } (entry.title.$t), videoUrl = entry.link[0].href,
          time = function(inputTime) {
          var totalSeconds = inputTime.seconds,
            time = {
              'seconds': Math.floor(totalSeconds % 60),
              'hours': Math.floor(totalSeconds / 3600),
              'minutes': Math.floor(totalSeconds / 60) % 60
            }, repr = '';
          $.each(time, function(key, value) {
            if (value < 10) { time[key] = '0' + value; }
          });
          if (totalSeconds >= 3600) {
            repr += time.hours + ':' + time.minutes + ':' + time.seconds;
          } else if (totalSeconds >= 60) {
            repr += time.minutes + ':' + time.seconds;
          } else {
            repr += time.seconds;
          }
          return repr;
        } (entry.media$group.yt$duration), thumb = entry.media$group.media$thumbnail[0].url;

        // Append to search results
        var result = $(''
          + '<div class="media">'
          +   '<img class="pull-left media-object img-thumbnail" src="' + thumb + '" '
          +   '<div class="media-body">'
          +     '<h4 class="media-heading">' + title + '</h4>'
          +     '<em class="text-right">' + time + '</em>'
          +   '</div>'
          + '</div>'
        ).on('click', function() {
          player.playYoutube(videoUrl);
        });
        that.$.append(result);
      });
    }
  });
  // ...events in UI
  $('input.search-youtube').on('change', function() { youtubeSearch.search($(this).val()); });
  $('a.search-youtube, button.search-youtube').on('click', function() { $(this).closest('input').change(); });

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
      if (enabled || enabled === undefined) {
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
      if (percentage !== undefined) {
        this._percentage = percentage;
        this.$.css('width', this._percentage + '%');
      }
    }, 'setMaxTime': function(maxTime) {
      maxTime = parseFloat(maxTime);
      if (maxTime !== undefined) { this._maxTime = maxTime; }
    }
  });

  // Right-click context menu for songs
  var songMenu = $init('#song-context-menu', {
    'init': function() {
      this._songId = -1;
      this._dropdown = this.$.children().first();
    }, 'action': function(fn) {
      var that = this;
      return function(e) {
        e.stopPropagation();
        e.preventDefault();
        fn(that._songId);
        that.close();
      };
    }, 'open': function(x, y) {
      var that = this;
      this._dropdown.dropdown('toggle');
      this.$.css('position', 'absolute');
      if (x !== undefined && y !== undefined) {
        this.$.css({ 'top': y, 'left': x });
      }
      $(window).one('click', function() { that.close(); });
    }, 'close': function() {
      this.$.removeClass('open');
    }, 'setSongId': function(songId) {
      this._songId = songId;
    }
  });
  // ...play song
  $('#song-action-play').click(songMenu.action(function(songId) { player.play(songId); }));
  // ...play song next
  $('#song-action-next').click(songMenu.action(function(songId) {
    playlist.addAsNext(songId);
    player.addAsNext(songId);
  }));
  // ...add song to play queue
  $('#song-action-queue').click(songMenu.action(function(songId) {
    playlist.addToPlayQueue(songId);
    player.addToPlayQueue(songId);
  }));
  // ...random mode
  // TODO

  // Connection modal (showing when client is disconnected)
  var connectionModal = $init('#disconnected-modal', {
    'init': function() {
      this.$.modal({
        'show': false,
        'keyboard': false,
        'backdrop': 'static'
      });
    }, 'setVisible': function(visible) {
      if (visible || visible === undefined) {
        this.$.modal('show');
      } else {
        this.$.modal('hide');
      }
    }
  });

  // Player event hooks
  var percentage = 0;
  player.bind('play', function() {
    // Switch the pause button
    pauseButton.setPlaying();

      // Set the current active row
    songLibrary.activateSong(this.state.id);

    // Set the player's new max-time, start/continue updating the progress
    playProgress.setMaxTime(this.state.time_max);
    playProgress.autoUpdate();
  }).bind('stop', function() {
    // Switch the pause button
    pauseButton.setPlaying(false);

    // Stop updating the progress, reset as well
    playProgress.autoUpdate(false);
    playProgress.setPercentage(0);

    // Deactivate all rows
    songLibrary.activateSong();
  }).bind('unpause', function() {
    // Switch the pause button
    pauseButton.setPlaying();

    // Start/continue updating the progress
    playProgress.autoUpdate();
  }).bind('pause', function() {
    // Switch the pause button
    pauseButton.setPlaying(false);

    // Stop updating the progress
    playProgress.autoUpdate(false);
  }).bind('volume', function() {
    volumeControl.setVolume(this.state.volume);
  }).bind('time', function() {
    playProgress.setPercentage(100 * this.state.time / this.state.time_max);
  }).bind('info', function() {
    // Play/pause button
    pauseButton.setPlaying(this.state.playing);

    // Set the player's new max-time
    playProgress.setMaxTime(this.state.time_max);

    // Update the play state
    if (this.state.playing) {
      // Start/continue updating the progress
      playProgress.autoUpdate();

      // Set the current active row
      songLibrary.activateSong(this.state.id);
    } else {
      // Clear all active rows
      songLibrary.activateSong();
    }

    // Update the play progress' percentage
    playProgress.setPercentage(100 * this.state.time / this.state.time_max);

    // Update the volume
    volumeControl.setVolume(this.state.volume);
  }).bind('connected', function() {
    // Explicitly hide the modal
    connectionModal.setVisible(false);
  }).bind('disconnected', function() {
    // Stop updating the progress
    playProgress.autoUpdate(false);

    // Show the modal
    connectionModal.setVisible();
  });

  // Loading progress
  var loadProgress = $init('#library-loading', {
    'init': function() {
      this._index = 0;
      this._count = undefined;
      this._bar = this.$.find('.progress').children().first();
      this._text = this.$.find('#library-loading-current');
    }, 'update': function() {
      this._text.text('Loaded ' + this._index + '/' + this._count + ' songs');
      // Remove old CSS class for load state
      this._bar.removeClass(function(index, css) {
        return (css.match (/\progress-bar-\S+/g) || []).join(' ');
      });
      var percentage = 100 * this._index / this._count;
      if (percentage >= 100) {
        this._bar.addClass('progress-bar-success');
      } else if (percentage < 34) {
        this._bar.addClass('progress-bar-danger');
      } else if (percentage < 67) {
        this._bar.addClass('progress-bar-warning');
      } else {
        this._bar.addClass('progress-bar-info');
      }
      this._bar.css('width', percentage + '%');
    }, 'step': function() {
      this._index += 1;
    }, 'setCount': function(count) {
      count = parseInt(count, 10);
      if (count !== undefined) { this._count = count; }
    }, 'finish': function() {
      this.$.fadeOut();
    }
  });

  // Explicitly connect the player
  player.connect('/player');

  // Load songs protocol (data handler, current cursor, end handler)
  var loadSongs = function(fn, end, c) {
    var cursor = parseInt(c, 10) || 1;
    $.getJSON('/library/' + cursor, function(data) {
      fn(data);
      if (data.next) {
        loadSongs(fn, end, cursor + 1);
      } else { end(); }
    });
  };

  // Load songs
  loadSongs(function(data) {
    $.each(data.songs, function(_, song) {
      // Append song to the library
      songLibrary.addSong(song);

      // Update load progress
      loadProgress.setCount(data.count);
      loadProgress.step();
    });
    loadProgress.update();
  }, function() {
    // Loading finished
    loadProgress.finish();
  });
});