var Song = require('../models').Song,
    Mplayer = require('./mplayer').Mplayer;
    youtube = require('./youtube');

var Player = module.exports = function() {
  // mplayer
  this._mplayer = new Mplayer();
  this._mplayer.start();

  // Current song
  this._currentSong = undefined;

  // Playlist
  this._playlist = [];
  this._playlist_size = 200;

  // History
  this._history = [];
  this._history_size = 100;
};

Player.prototype.kill = function(signal) {
  this._mplayer.kill(signal);
};

Player.prototype.quit = function(code) {
  this._mplayer.quit(code);
};

Player.prototype.songIsOver = function() {
  return this._mplayer.song_over();
  // return (!isNaN(this._mplayer.time_pos.value)
  //   && !isNaN(this._mplayer.length.value)
  //   && this._mplayer.time_pos.value >= this._mplayer.length.value)
  //   || this._mplayer.filename.value == undefined;
}

Player.prototype.info = function(callback) {
  var self = this;

  this._mplayer.update(function() {
    var filename =  self._mplayer.get_filename();
    var volume =    self._mplayer.get_volume();
    var length =    self._mplayer.get_length();
    var time_pos =  self._mplayer.get_time_pos();
    var pause =     self._mplayer.get_pause();

    var out = {
      'id': -1,
      'playing': pause ? 0 : 1,
      'volume': volume,
      'time': time_pos,
      'time_max': length,
      'playlist': [],
      'play_count': 0
    };

    for (var i = 0 ; i < self._playlist.length ; i++) {
      out['playlist'].push(self._playlist[i].id);
    }

    if (self._currentSong != undefined) {
      out['id'] = self._currentSong.id;
      out['play_count'] = self._currentSong.playCount;
    }

    if (callback != undefined) {
      callback(out);
    }
  });

  // return out;

  // this._mplayer.filename.get();
  // this._mplayer.volume.get();
  // this._mplayer.time_pos.get();
  // this._mplayer.length.get();
  // this._mplayer.pause.get();

  // var self = this;
  // var wait_out = function() {
  //   if (!self._mplayer.waiting()) {
  //     var out = {
  //       'id': -1,
  //       'playing': self._mplayer.pause.value ? 0 : 1,
  //       'volume': self._mplayer.volume.value,
  //       'time': self._mplayer.time_pos.value,
  //       'time_max': self._mplayer.length.value,
  //       'playlist': [],
  //       'play_count': 0
  //     };

  //     for (var i = 0 ; i < self._playlist.length ; i++) {
  //       out['playlist'].push(self._playlist[i].id);
  //     }

  //     if (self._currentSong != undefined) {
  //       out['id'] = self._currentSong.id;
  //       out['play_count'] = self._currentSong.playCount;
  //     }

  //     if (success) { success(out); }
  //   }
  //   else {
  //     setTimeout(wait_out, 100);
  //   }
  // };
  // wait_out();
};

Player.prototype.addToPlaylist = function(id, pos) {
  pos = parseInt(pos);
  if (!isNaN(id) && !isNaN(pos)) {
    if (pos < 0 || pos > this._playlist.length) {
      pos = this._playlist.length;
    }

    var self = this;
    Song.find({ id: id }, function(song) {
      if (song) {
        self._playlist.splice(pos, 0, song);
      }
    });
  }
}

Player.prototype._play = function(song, from_history) {
  if (song != undefined) {
    var self = this;

    if (from_history == undefined) {
      from_history = false;
    }

    if (from_history) {
      this._playlist.unshift(this._currentSong);
      if (this._playlist.length > this._playlist_size) {
        this._playlist.pop();
      }
    } else {
      this._history.push(this._currentSong);
      if (this._history.length > this._history_size) {
        this._history.shift();
      }
    }

    this._currentSong = song;

    var volume = this._mplayer.get_volume();
    if (this._currentSong.youtube != undefined) {
      youtube.play(this._currentSong.youtube, function(url) {
        self._mplayer.loadfile(url, 0, function() {
          self._mplayer.set_volume(volume);
        });
      }, function(err) {
        console.log('Youtube error: ' + err);
      });
    } else {
      this._mplayer.loadfile(this._currentSong.fullPath(), 0, function() {
        self._mplayer.set_volume(volume);
      });
      this._currentSong.playCount += 1;
      this._currentSong.save();
    }
    // this._mplayer.set_volume(volume);
  }
};

Player.prototype.playRandom = function() {
  var self = this;
  Song.count({}, function(n) {
    Song.find({}, {
      limit: 1,
      offset: Math.floor(Math.random() * n)
    }, function (err, songs) {
      if (err) { throw new Error(err); }
      if (songs.length > 0 && songs[0]) { self._play(songs[0], true); }
    });
  });
}

Player.prototype.playNext = function() {
  if (this._playlist.length > 0) {
    this._play(this._playlist.shift());
  } else {
    this.playRandom();
  }
};

Player.prototype.playPrevious = function() {
  if (this._history.length > 0) {
    this._play(this._history.pop(), true);
  } else {
    this.playRandom();
  }
}

Player.prototype.play = function(id) {
  if (!isNaN(id)) {
    var self = this;
    Song.findById(id, function(song) {
      if (song != undefined) {
        self._play(song);
      }
    });
  }
};

Player.prototype.play_youtube = function(url) {
  if (url != undefined) {
    var song = {};
    song.youtube = url;
    this._play(song);
  }
};

Player.prototype.pause = function(id) {
  if (!isNaN(id)
      && this._currentSong != undefined
      && this._currentSong.id == id) {
        this._mplayer.force_pause();
      }
}

Player.prototype.unpause = function(id) {
  if (!isNaN(id)
      && this._currentSong != undefined
      && this._currentSong.id == id) {
        this._mplayer.force_unpause();
      }
}

Player.prototype.stop = function(id) {
  if (!isNaN(id)
      && this._currentSong != undefined
      && this._currentSong.id == id) {
        this._mplayer.force_pause();
        // this._mplayer.time_pos.set(0);
        this._mplayer.set_time_pos(0);
      }
}

Player.prototype.volume = function(volume) {
  volume = parseFloat(volume);
  if (!isNaN(volume)
      && volume >= 0 && volume <= 100) {
        // this._mplayer.volume.set(volume);
        this._mplayer.set_volume(volume);
      }
}

Player.prototype.time = function(id, time) {
  time = parseFloat(time);
  if (!isNaN(id)
      && this._currentSong != undefined
      && this._currentSong.id == id
      && !isNaN(time)
      && time > 0) {
        // this._mplayer.time_pos.set(time);
        this._mplayer.set_time_pos(time);
      }
}

// vim: ft=javascript et sw=2 sts=2
