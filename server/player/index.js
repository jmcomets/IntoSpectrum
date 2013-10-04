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
  // return (!isNaN(this._mplayer.timePos.value)
  //   && !isNaN(this._mplayer.length.value)
  //   && this._mplayer.timePos.value >= this._mplayer.length.value)
  //   || this._mplayer.filename.value == undefined;
}

Player.prototype.info = function(callback) {
  var self = this;

  this._mplayer.update(function() {
    console.log('UPDATE');
    var filename =  self._mplayer.getFilename();
    var volume =    self._mplayer.getVolume();
    var length =    self._mplayer.getLength();
    var timePos =  self._mplayer.getTimePos();
    var pause =     self._mplayer.getPause();

    var out = {
      'id': -1,
      'playing': pause ? 0 : 1,
      'volume': volume,
      'time': timePos,
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
};

Player.prototype.addToPlaylist = function(id, pos) {
  pos = parseInt(pos);
  if (!isNaN(id) && !isNaN(pos)) {
    if (pos < 0 || pos > this._playlist.length) {
      pos = this._playlist.length;
    }

    var self = this;
    Song.findById(id, function(err, song) {
      if (song) {
        self._playlist.splice(pos, 0, song);
      }
    });
  }
}

Player.prototype._play = function(song, from_history) {
  if (song == undefined) { return; }

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

  var self = this, volume = this._mplayer.getVolume();
  if (this._currentSong.youtube != undefined) {
    youtube.play(this._currentSong.youtube, function(url) {
      self._mplayer.loadfile(url, 0, function() {
        self._mplayer.set_volume(volume);
      });
    }, function(err) {
      console.log('Youtube error: ', err);
    });
  } else {
    this._mplayer.loadfile(this._currentSong.fullPath(), 0, function() {
      self._mplayer.set_volume(volume);
    });
    this._currentSong.playCount += 1;
    this._currentSong.save();
  }
  // this._mplayer.set_volume(volume);
};

Player.prototype.playRandom = function() {
  var self = this;
  Song.count({}, function(n) {
    Song.find()
      .skip(Math.floor(Math.random() * n))
      .limit(1)
      .exec(function (err, songs) {
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

Player.prototype.playYoutube = function(url) {
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
        // this._mplayer.timePos.set(0);
        this._mplayer.setTimePos(0);
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
        // this._mplayer.timePos.set(time);
        this._mplayer.setTimePos(time);
      }
}

// vim: ft=javascript et sw=2 sts=2
