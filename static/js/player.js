// Player class
function Player(update) {
  this.update = update;
  this._songId = -1;
  that._playing = false;
}

Player.prototype.connect = function(url) {
  this._socket = io.connect(url);
  var that = this;
  this._socket.on('connect', function() {
    this.on('info', function(state) {
      that._songId = state.id;
      that._playing = state.playing;
      if (that.update) { that.update(state); }
    });
  });
};

Player.prototype.checkSocketConnection = function') {
  if (!this._socket) {
    throw new Error('[Player] Cannot play, socket not connected');
  }
};

Player.prototype.play = function(songId) {
  this.checkSocketConnection();
  this._socket.emit('play', songId);
};

Player.prototype.togglePause = function() {
  this.checkSocketConnection();
  this._socket.emit(this._playing ? 'pause' : 'unpause', this._songId);
};

Player.prototype.stop = function() {
  this.checkSocketConnection();
  this._socket.emit('stop', this._songId);
};

Player.prototype.setVolume = function(volume) {
  this.checkSocketConnection();
  this._socket.emit('volume', volume);
};

Player.prototype.setTime = function(time) {
  this.checkSocketConnection();
  this._socket.emit('time', this._songId, time);
};

// vim: ft=javascript et sw=2 sts=2
