// ClientPlayer class
function ClientPlayer(update) {
  this.update = update;
  this._songId = -1;
  this._playing = undefined;
}

// Explicit connect to socket at a given url
ClientPlayer.prototype.connect = function(url) {
  var socket = io.connect(url), tryReconnect = function() {
    if (!socket.socket.connected && !socket.socket.connecting) {
      socket.socket.connect();
    }
  }, intervalID = setInterval(tryReconnect, 2000);

  var that = this;
  socket.on('connect', function () {
    clearInterval(intervalID);
    this.on('info', function(state) {
      that._songId = state.id;
      that._playing = state.playing;
      if (that.update) { that.update(state); }
    });
    that._socket = socket;
  })
};

// Check the socket connection, throwing if the socket is invalid
ClientPlayer.prototype.checkSocketConnection = function() {
  if (!this._socket) {
    throw new Error('[ClientPlayer] Cannot play, socket not connected');
  }
};

// Ask the server to play the song of id songId
ClientPlayer.prototype.play = function(songId) {
  this.checkSocketConnection();
  this._socket.emit('play', songId);
};

// Ask the server to either pause or unpause, depending on
// the player's current state
ClientPlayer.prototype.togglePause = function() {
  this.checkSocketConnection();
  this._socket.emit(this._playing ? 'pause' : 'unpause', this._songId);
};

// Ask the server to stop the song playing, and reset the current time
ClientPlayer.prototype.stop = function() {
  this.checkSocketConnection();
  this._socket.emit('stop', this._songId);
};

// Ast the server to play the next song
ClientPlayer.prototype.playNext = function() {
  this.checkSocketConnection();
  this._socket.emit('play_next');
};

// Ast the server to play the previous song
ClientPlayer.prototype.playPrevious = function() {
  throw new Error('[ClientPlayer] "previous" action not yet implemented');
};

// Ask the server player to set the volume
ClientPlayer.prototype.setVolume = function(volume) {
  this.checkSocketConnection();
  this._socket.emit('volume', volume);
};

// Ask the server player to set the current time
ClientPlayer.prototype.setTime = function(time) {
  this.checkSocketConnection();
  this._socket.emit('time', this._songId, time);
};

// Ask the server to add a song to play next
ClientPlayer.prototype.addAsNext = function(songId) {
  this.checkSocketConnection();
  this._socket.emit('add_to_playlist', songId, 0);
};

// Ask the server to add a song to the play queue
ClientPlayer.prototype.addToPlayQueue = function(songId) {
  this.checkSocketConnection();
  this._socket.emit('add_to_playlist', songId, -1);
};

// vim: ft=javascript et sw=2 sts=2
