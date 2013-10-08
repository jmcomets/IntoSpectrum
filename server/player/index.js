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
  this._playlistSize = 200;

  // History
  this._history = [];
  this._historySize = 100;
};

Player.prototype._log = function() {
  var args = [].slice.call(arguments, 0);
  args.unshift('[Player]');
  console.log.apply(console, args);
};


Player.prototype.kill = function(signal) {
  this._mplayer.kill(signal);
};

Player.prototype.quit = function(code) {
  this._mplayer.quit(code);
};

Player.prototype.songIsOver = function() {
  return this._mplayer.songOver();
  // return (!isNaN(this._mplayer.timePos.value)
  //   && !isNaN(this._mplayer.length.value)
  //   && this._mplayer.timePos.value >= this._mplayer.length.value)
  //   || this._mplayer.filename.value === undefined;
}

Player.prototype.info = function(callback) {
  var self = this;

  this._mplayer.update(function() {
    var filename = self._mplayer.getFilename();
    var volume = self._mplayer.getVolume();
    var length = self._mplayer.getLength();
    var timePos = self._mplayer.getTimePos();
    var pause = self._mplayer.getPause();

    var out = {
      'id': -1,
      'playing': pause ? 0 : 1,
      'volume': volume,
      'time': timePos,
      'timeMax': length,
      'playlist': [],
      'playCount': 0
    };

    for (var i = 0 ; i < self._playlist.length ; i++) {
      self._log('self._playlist =', self._playlist);
      // FIXME this must work
      //out['playlist'].push(self._playlist[i].id);
    }

    if (self._currentSong !== undefined) {
      out['id'] = self._currentSong.id;
      out['playCount'] = self._currentSong.playCount;
    }

    if (callback !== undefined) {
      callback(out);
    }
  });
};

Player.prototype.addToPlaylist = function(id, pos) {
  pos = parseInt(pos);
  if (!isNaN(pos)) {
    if (pos < 0 || pos > this._playlist.length) {
      pos = this._playlist.length;
    }

    var self = this;
    Song.findById(id, function(err, song) {
      if (err) {
        this._log('bad id', id);
      } else {
        self._playlist.splice(pos, 0, song);
      }
    });
  }
}

Player.prototype._play = function(song, fromHistory) {
  this._log('_play', song, fromHistory);
  if (!song) { return; }

  if (fromHistory) {
    this._playlist.unshift(this._currentSong);
    if (this._playlist.length > this._playlistSize) {
      this._playlist.pop();
    }
  } else {
    this._history.push(this._currentSong);
    if (this._history.length > this._historySize) {
      this._history.shift();
    }
  }

  this._currentSong = song;

  var self = this, volume = this._mplayer.getVolume();
  if (this._currentSong.youtube !== undefined) {
    youtube.play(this._currentSong.youtube, function(url) {
      self._mplayer.loadFile(url, 0, function() {
        self._mplayer.setVolume(volume);
      });
    }, function(err) {
      self._log('youtube error: ', err);
    });
  } else {
    this._mplayer.loadFile(this._currentSong.fullPath(), 0, function() {
      self._mplayer.setVolume(volume);
    });
    this._currentSong.playCount += 1;
    this._currentSong.save();
  }
  // this._mplayer.setVolume(volume);
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
  this._log('play', id);
  var self = this;
  Song.findById(id, function(err, song) {
    if (err) {
      self._log('bad id', id);
    } else {
      self._play(song);
    }
  });
};

Player.prototype.playYoutube = function(url) {
  if (url !== undefined) {
    var song = {};
    song.youtube = url;
    this._play(song);
  }
};

Player.prototype.pause = function(id) {
  if (this._currentSong !== undefined && this._currentSong.id == id) {
    this._mplayer.forcePause();
  }
}

Player.prototype.unpause = function(id) {
  if (this._currentSong !== undefined && this._currentSong.id == id) {
    this._mplayer.forceUnpause();
  }
}

Player.prototype.stop = function(id) {
  if (this._currentSong !== undefined && this._currentSong.id == id) {
    this._mplayer.forcePause();
    // this._mplayer.timePos.set(0);
    this._mplayer.setTimePos(0);
  }
}

Player.prototype.volume = function(volume) {
  volume = parseFloat(volume);
  if (!isNaN(volume) && volume >= 0 && volume <= 100) {
    // this._mplayer.volume.set(volume);
    this._mplayer.setVolume(volume);
  }
}

Player.prototype.time = function(id, time) {
  time = parseFloat(time);
  if (this._currentSong !== undefined && this._currentSong.id == id
      && !isNaN(time) && time > 0) {
    // this._mplayer.timePos.set(time);
    this._mplayer.setTimePos(time);
  }
}

// vim: ft=javascript et sw=2 sts=2
