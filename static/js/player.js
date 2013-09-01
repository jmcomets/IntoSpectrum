// Player class
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

$(window).load(function() {
  // Main player instance
  var player = new Player('/songs');

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
    // Append songs to the #library
    var library = $('#library');
    $.each(songs, function(_, song) {
      var audio = $('<tr></tr>');
      $.each(song, function(key, value) {
        var id = song.id || '',
          title = song.title || '',
          artist = song.artist || '',
          album = song.album || '',
          year = song.year || '',
          play_count = song.play_count || '';
        audio.html(
          '<th>' + id         + '</th>' +
          '<th>' + title      + '</th>' +
          '<th>' + artist     + '</th>' +
          '<th>' + album      + '</th>' +
          '<th>' + year       + '</th>' +
          '<th>' + play_count + '</th>'
          );
      });
      library.append(audio);
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
