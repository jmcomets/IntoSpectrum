$(window).load(function() {
  // Main player instance
  function Player(url) {
    // Socket
    this._player = io.connect(url);

    // Base callbacks
    this._callbacks = {
      'play': [],
      'pause': [],
      'stop': [],
    };

    // Socket event hooks
    var that = this;
    this._player
      .on('connect', function() { that.log('connected on ' + url); })
      .on('play', function() { that.emit('play'); })
      .on('pause', function() { that.emit('pause'); })
      .on('pause', function() { that.emit('stop'); });
  }

  // Logging
  Player.prototype.log = function(msg) {
    console.log('[Player] ' + msg);
  }

  // Event listening
  Player.prototype.on = function(evt, fn) {
    if (this._callbacks[evt] == undefined) {
      throw new Error('Unknown event: ' + evt);
    } else {
      this._callbacks[evt].push(fn);
    }
    return this;
  };
  // ...firing
  Player.prototype.emit = function(evt) {
    this.log('emitting: ' + evt);
    var callbacks = this._callbacks[evt];
    for (var i = 0; i < callbacks.length; i++) { callbacks[i](); }
  };

  Player.prototype.play = function(song_id) {
    this.log('playing: ' + song_id);
    this._player.emit('play', song_id);
  };

  Player.prototype.pause = function() {
    this.log('pausing');
    this._player.emit('pause');
  };

  Player.prototype.stop = function() {
    this.log('stopping');
    this._player.emit('stop');
  };

  // Setup the player
  function setupPlayer(audio) {
    $(audio).before(function() {
      // Create player skeleton
      audio.controls = false;
      var player_box = document.createElement('div');
      $(player_box).addClass($(audio).attr('class') + ' well container-fluid playa');
      var data_sec = document.createElement('section');
      $(data_sec).addClass('collapse');
      var toggle_holder = document.createElement('div');
      $(toggle_holder).addClass('btn-group row-fluid');
      var data_toggle = document.createElement('a');
      $(data_toggle).html('<i class="icon-reorder"></i>');
      $(data_toggle).addClass('btn btn-block');
      $(data_toggle).attr('style', 'opacity:0.3');
      $(data_toggle).click(function (){$(data_sec).collapse('toggle');});
      $(data_toggle).attr('title', 'Details');
      $(data_toggle).tooltip({'container': 'body', 'placement': 'top', 'html': true});
      $(toggle_holder).append(data_toggle);
      var data_table = document.createElement('table');
      $(data_table).addClass('table table-condensed');
      var player = document.createElement('section');
      $(player).addClass('btn-group row-fluid');

      // Error handler (for loading)
      var loadError = function() {
        $(player_box).find('.btn').addClass('disabled');
        $(player_box).find('input[type="range"]').hide();
        $(player_box).find('.icon-spin').text('Error');
        $(player_box).find('.icon-spin').parent().attr('title', 'There was an error loading the audio.');
        $(player_box).find('.icon-spin').parent().tooltip('fixTitle');
        $(player_box).find('.icon-spin').removeClass('icon-spinner icon-spin');
      };

      // Add play action
      var addPlay = function() {
        var play = document.createElement('button');
        $(play).addClass('btn disabled span1');
        play.setPlayState = function(toggle) {
          $(play).removeClass('disabled');
          if (toggle == 'play') {
            $(play).html('<i class="icon-play"></i>');
            $(play).click(function () { audio.play(); });
          }
          if (toggle == 'pause') {
            $(play).html('<i class="icon-pause"></i>');
            $(play).click(function () {
              audio.pause();
            });
          }
        };
        $(audio).on('play', function() { play.setPlayState('pause'); });
        $(audio).on('canplay', function() { play.setPlayState('play'); });
        $(audio).on('pause', function() { play.setPlayState('play'); });
        $(player).append(play);
      };

      // Add the seek action
      var addSeek = function() {
        var seek = document.createElement('input');
        $(seek).attr( {
          'type': 'range',
          'min': 0,
          'value': 0,
          'class': 'seek'
        });
        seek.progress = function () {
          var bg = 'rgba(223, 240, 216, 1) 0%';
          bg += ', rgba(223, 240, 216, 1) ' + ((audio.currentTime/audio.duration) * 100) + '%';
          bg += ', rgba(223, 240, 216, 0) ' + ((audio.currentTime/audio.duration) * 100) + '%';
          for (var i = 0; i < audio.buffered.length; i++) {
            if (audio.buffered.end(i) > audio.currentTime
                && isNaN(audio.buffered.end(i)) == false
                && isNaN(audio.buffered.start(i)) == false) {
                  var bufferedstart;
                  var bufferedend;
                  if (audio.buffered.end(i) < audio.duration) {
                    bufferedend = (audio.buffered.end(i) / audio.duration) * 100;
                  }
                  else {
                    bufferedend = 100;
                  }
                  if (audio.buffered.start(i) > audio.currentTime) {
                    bufferedstart = (audio.buffered.start(i) / audio.duration) * 100;
                  }
                  else {
                    bufferedstart = (audio.currentTime / audio.duration) * 100;
                  }
                  bg += ', rgba(217, 237, 247, 0) ' + bufferedstart + '%';
                  bg += ', rgba(217, 237, 247, 1) ' + bufferedstart + '%';
                  bg += ', rgba(217, 237, 247, 1) ' + bufferedend + '%';
                  bg += ', rgba(217, 237, 247, 0) ' + bufferedend + '%';
                }
          }
          $(seek).css('background', '-webkit-linear-gradient(left, ' + bg + ')')
              };
              seek.set = function () {
                $(seek).val(audio.currentTime);
                seek.progress();
              };
              seek.slide = function () {
                audio.currentTime = $(seek).val();
                seek.progress();
              };
              seek.init = function () {
                $(seek).attr( {
                  'max': audio.duration,
                  'step': audio.duration / 100
                });
                seek.set();
              };
              seek.reset = function () {
                $(seek).val(0);
                audio.currentTime = $(seek).val();
                if (!audio.loop){audio.pause();}
                else {audio.play();}
              };
              var seek_wrapper = document.createElement('div');
              $(seek_wrapper).addClass('btn disabled span4');

              $(seek_wrapper).append(seek);
              $(seek).on('change', seek.slide);
              $(audio).on('timeupdate', seek.init);
              $(audio).on('loadedmetadata', seek.init);
              $(audio).on('loadeddata', seek.init);
              $(audio).on('progress', seek.init);
              $(audio).on('canplay', seek.init);
              $(audio).on('canplaythrough', seek.init);
              $(audio).on('ended', seek.reset);
              if (audio.readyState > 0) {
                seek.init();
              }
              $(player).append(seek_wrapper);
      };

      // Add the time display
      var addTime = function() {
        var time = document.createElement('a');
        $(time).addClass('btn span3');
        $(time).tooltip({'container': 'body', 'placement': 'right', 'html': true});
        time.twodigit = function (myNum) {
          return ('0' + myNum).slice(-2);
        };
        time.timesplit = function (a) {
          if (isNaN(a)){return '<i class="icon-spinner icon-spin"></i>';}
          var hours = Math.floor(a / 3600);
          var minutes = Math.floor(a / 60) - (hours * 60);
          var seconds = Math.floor(a) - (hours * 3600) - (minutes * 60);
          var timeStr = time.twodigit(minutes) + ':' + time.twodigit(seconds);
          if (hours > 0) {
            timeStr = hours + ':' + timeStr;
          }
          return timeStr;
        };
        time.showtime = function () {
          $(time).html(time.timesplit(audio.duration));
          $(time).attr({'title': 'Click to Reset<hr style="padding:0; margin:0;" />Position: ' + (time.timesplit(audio.currentTime))});
          if (!audio.paused) {
            $(time).html(time.timesplit(audio.currentTime));
            $(time).attr({'title': 'Click to Reset<hr style="padding:0; margin:0;" />Length: ' + (time.timesplit(audio.duration))});
          }
          $(time).tooltip('fixTitle');
        };
        $(time).click(function () {
          audio.pause();
          audio.currentTime = 0;
          time.showtime();
          $(time).tooltip('fixTitle');
          $(time).tooltip('show');
        });
        $(time).tooltip('show');
        $(audio).on('loadedmetadata', time.showtime);
        $(audio).on('loadeddata', time.showtime);
        $(audio).on('progress', time.showtime);
        $(audio).on('canplay', time.showtime);
        $(audio).on('canplaythrough', time.showtime);
        $(audio).on('timeupdate', time.showtime);
        if (audio.readyState > 0) {
          time.showtime();
        }
        else {
          $(time).html('<i class="icon-spinner icon-spin"></i>');
        }
        $(player).append(time);
      };

      // Add the mute action
      var addMute = function() {
        var mute = document.createElement('button');
        $(mute).addClass('btn span1');
        mute.checkVolume = function () {
          if (audio.volume > 0.5 && !audio.muted) {
            $(mute).html('<i class="icon-volume-up"></i>');
          } else if (audio.volume < 0.5 && audio.volume > 0 && !audio.muted) {
            $(mute).html('<i class="icon-volume-down"></i>');
          } else {
            $(mute).html('<i class="icon-volume-off"></i>');
          }
        };
        $(mute).click(function () {
          if (audio.muted) {
            audio.muted = false;
            audio.volume = audio.oldvolume;
          } else {
            audio.muted = true;
            audio.oldvolume = audio.volume;
            audio.volume = 0;
          }
          mute.checkVolume();
        });
        mute.checkVolume();
        $(audio).on('volumechange', mute.checkVolume);
        $(player).append(mute);
      };

      // Add the volume action
      var addVolume = function() {
        var volume = document.createElement('input');
        $(volume).attr( {
          'type': 'range',
          'min': 0,
          'max': 1,
          'step': 1 / 100,
          'value': 1
        });
        volume.slide = function () {
          audio.muted = false;
          audio.volume = $(volume).val();
        };
        volume.set = function () {
          $(volume).val(audio.volume);
        };
        var vol_wrapper = document.createElement('div');
        $(vol_wrapper).addClass('btn disabled span3');
        $(vol_wrapper).append(volume);
        $(volume).on('change', volume.slide);
        $(audio).on('volumechange', volume.set);
        $(player).append(vol_wrapper);
      };

      // Add the album art display
      var addAlbumArt = function() {
        var albumArt = document.createElement('img');
        $(albumArt).addClass('thumbnail');
        $(albumArt).attr('src', $(audio).data('infoAlbumArt'));
        $(data_sec).append(albumArt);
      };

      // Add the information display
      var addInfo = function(title, dataId) {
        var row = document.createElement('tr');
        var head = document.createElement('th');
        var data = document.createElement('td');
        $(head).html(title);
        $(data).html($(audio).data(dataId));
        $(row).append(head);
        $(row).append(data);
        $(data_table).append(row);
      };

      // Add all data to the audio element
      var addData = function() {
        if (typeof($(audio).data('infoAlbumArt')) != 'undefined') { addAlbumArt(); }
        if (typeof($(audio).data('infoArtist')) != 'undefined') { addInfo('Artist', 'infoArtist');}
        if (typeof($(audio).data('infoTitle')) != 'undefined') { addInfo('Title', 'infoTitle'); }
        if (typeof($(audio).data('infoAlbumTitle')) != 'undefined') { addInfo('Album', 'infoAlbumTitle'); }
        if (typeof($(audio).data('infoLabel')) != 'undefined') { addInfo('Label', 'infoLabel'); }
        if (typeof($(audio).data('infoYear')) != 'undefined') { addInfo('Year', 'infoYear'); }
        if ($(data_table).html() != '') {
          $(data_sec).append(data_table);
          $(player_box).append(toggle_holder);
          $(player_box).append(data_sec);
        }
      };

      // Player
      var addPlayer = function() {
        if ($(audio).data('play') != 'off') { addPlay(); }
        if ($(audio).data('seek') != 'off') { addSeek(); }
        if ($(audio).data('time') != 'off') { addTime(); }
        if ($(audio).data('mute') != 'off') { addMute(); }
        if ($(audio).data('volume') != 'off') { addVolume(); }
        $(player_box).append(player);
      };

      // Attribution
      var addAttribution = function() {
        var attribution = document.createElement('small');
        $(attribution).addClass('pull-right muted');
        if (typeof($(audio).data('infoAttLink')) != 'undefined') {
          var attribution_link = document.createElement('a');
          $(attribution_link).addClass('muted');
          $(attribution_link).attr('href', $(audio).data('infoAttLink'));
          $(attribution_link).html($(audio).data('infoAtt'));
          $(attribution).append(attribution_link);
        } else { $(attribution).html($(audio).data('infoAtt')); }
        $(player_box).append(attribution);
      };

      // Fill the player box
      var fillPlayerBox = function() {
        addData();
        addPlayer();
        if (typeof($(audio).data('infoAtt')) != 'undefined') { addAttribution(); }
      };
      fillPlayerBox();

      // Errors
      $(audio).on('error', function() { loadError(); });
      return player_box;
    });
  }

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
      var audio = $('<audio></audio>');
      $.each(btPlayerMap, function(key, value) {
        if (song[key] != undefined) { audio.attr(value, song[key]); }
      });
      library.append(audio);
      setupPlayer(audio);
    });
  });

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
