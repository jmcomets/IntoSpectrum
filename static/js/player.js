// Player class
function Player(update) {
  if (update != undefined) { this.update = options.update; }
  this.songId = -1;
}

Player.prototype.connect = function(url) {
  this._socket = io.connect(url);
  var that = this;
  this._socket.on('connect', function() {
    this.on('info', function(state) {
      that.songId = state.id;
      that.update(state);
    });
  });
};

Player.prototype.play = function(songId) {
  if (!this._socket) { throw new Error('[Player] Cannot play, socket not connected'); }
  this._socket.emit('play', songId);
};

Player.prototype.togglePause = function() {
  if (!this._socket) { throw new Error('[Player] Cannot play, socket not connected'); }
  this._socket.emit('pause', this.songId);
};

Player.prototype.stop = function() {
  if (!this._socket) { throw new Error('[Player] Cannot play, socket not connected'); }
  this._socket.emit('stop', this.songId);
};

Player.prototype.setVolume = function(volume) {
  if (!this._socket) { throw new Error('[Player] Cannot play, socket not connected'); }
  this._socket.emit('volume', volume);
};

// vim: ft=javascript et sw=2 sts=2
