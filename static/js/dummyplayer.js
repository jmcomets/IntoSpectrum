function DummyPlayer(update) {
  this.update = update;
  this._updateInterval = -1;
  this._state = { 'id': -1 };
  this._timeMaxIndex = {};
}

DummyPlayer.prototype.log = function(msg) {
  console.log('[DummyPlayer] ' + msg);
};

DummyPlayer.prototype.connect = function(url) {
  this.log('connected');
};

DummyPlayer.prototype.play = function(songId) {
  if (this._timeMaxIndex[songId] == undefined) {
    this._timeMaxIndex[songId] = Math.floor(Math.random()*300) + 100;
  }
  this._state = {
    'id': songId,
    'playing': false,
    'volume': this._state.volume || 50,
    'time': 0,
    'time_max': this._timeMaxIndex[songId]
  };
  this.togglePause();
};

DummyPlayer.prototype.togglePause = function() {
  if (this._state.id == -1) { this.play(); }
  else {
    this._state.playing = 1 - this._state.playing;
    if (this._updateInterval != -1) {
      clearInterval(this._updateInterval);
      this._updateInterval = -1;
    }
    if (this._state.playing) {
      var that = this;
      this._updateInterval = setInterval(function() {
        that._state.time += 1;
        that.update(that._state);
      }, 1000);
    }
    this.update(this._state);
  }
};

DummyPlayer.prototype.stop = function() {
  this._state.time = 0;
  this.togglePause();
};

DummyPlayer.prototype.setVolume = function(volume) {
  this._state.volume = volume;
  this.update(this._state);
};

DummyPlayer.prototype.setTime = function(time) {
  this._state.time = time;
  this.update(this._state);
};

// Override the ClientPlayer class by the dummy one,
// which has the same interface but does nothing
var ClientPlayer = DummyPlayer;

// vim: ft=javascript et sw=2 sts=2
