var Song = require('../models').Song,
    mplayer = require('./mplayer').mplayer;

var player = module.exports = function() {
  // mplayer
  this._mplayer = new mplayer();

  // Current song
  this._current_song = undefined;
};

player.prototype.close = function() {
  this.mplayer.quit();
};

player.prototype.get_info = function(success) {
  this._mplayer.volume.get();
  this._mplayer.time_pos.get();
  this._mplayer.length.get();
  this._mplayer.pause.get();

  var self = this;
  var wait_out = function() {
    if(!self._mplayer.waiting()) {
      var out = {
        'id': -1,
        'playing': self._mplayer.pause.value ? 0 : 1,
        'volume': self._mplayer.volume.value,
        'time': self._mplayer.time_pos.value,
        'time_max': self._mplayer.length.value
      };

      if (self._current_song != undefined) {
        out['id'] = self._current_song.id;
      }

      if(success) { success(out); }
    }
    else {
      setTimeout(wait_out, 100);
    }
  };
  wait_out();
};

player.prototype.play = function(id) {
  id = parseInt(id);
  if(!isNaN(id)) {
    var self = this;
    Song.find(id).success(function(song) {
      if(song != undefined) {
        self._mplayer.loadfile(song.fullPath(), 0);
        self._current_song = song;
        song.playCount += 1;
        song.save();
      }
    });
  }
};

player.prototype.pause = function(id) {
  id = parseInt(id);
  if(!isNaN(id)
      && this._current_song != undefined
      && this._current_song.id == id) {
        this._mplayer.force_pause();
      }
}

player.prototype.unpause = function(id) {
  id = parseInt(id);
  if(!isNaN(id)
      && this._current_song != undefined
      && this._current_song.id == id) {
        this._mplayer.force_unpause();
      }
}

player.prototype.stop = function(id) {
  id = parseInt(id);
  if(!isNaN(id)
      && this._current_song != undefined
      && this._current_song.id == id) {
        this._mplayer.force_pause();
        this._mplayer.time_pos.set(0);
      }
}

player.prototype.volume = function(volume) {
  volume = parseFloat(volume);
  if(!isNaN(volume)
      && volume >= 0 && volume <= 100) {
        this._mplayer.volume.set(volume);
      }
}

player.prototype.time = function(id, time) {
  id = parseInt(id);
  time = parseFloat(time);
  if(!isNaN(id)
      && this._current_song != undefined
      && this._current_song.id == id
      && !isNaN(time)
      && time > 0) {
        this._mplayer.time_pos.set(time);
      }
}

// vim: ft=javascript et sw=2 sts=2
