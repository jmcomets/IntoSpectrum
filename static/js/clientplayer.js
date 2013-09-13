// ClientPlayer class
function ClientPlayer() {
  this.state = {};
}

// Make ClientPlayer an event emitter
MicroEvent.mixin(ClientPlayer);

// Events available (checked -> supported):
//  - [x] connected
//  - [x] disconnected
//  - [x] play
//  - [x] pause
//  - [x] unpause
//  - [x] stop
//  - [x] volume
//  - [] time
//  - [] next
//  - [] previous
//  - [] playlist

// Explicit connect to socket at a given url
ClientPlayer.prototype.connect = function(url) {
  // Stored for convenience
  var that = this;

  // Try to connect until connected
  var socket = io.connect(url);

  // Reconnect interval ID
  var intervalID = -1;
  // ...reconnect setup
  var tryReconnect = function(seconds) {
    intervalID = setInterval(function() {
      if (!socket.socket.connected && !socket.socket.connecting) {
        socket.socket.connect();
      }
    }, seconds*1000);
  };

  // Try to reconnect immediately (applied after 2 seconds, unless failure)
  tryReconnect(2);

  socket.on('connect', function() {
    clearInterval(intervalID);
    that.trigger('connected');
    this
      .on('info', function(info) { that._handleInfo(info); })
      .on('response', function(response) { that._handleResponse(response); })
    ;
    that._socket = socket;
  }).on('disconnect', function() {
    tryReconnect(5);
    that._socket = undefined;
    that.trigger('disconnected');
  });
};

// Info -> regular update (no specific event)
ClientPlayer.prototype._handleInfo = function(info) {
  this.state = info;
  this.trigger('info');
};

// Response -> immediate response (specific event)
ClientPlayer.prototype._handleResponse = function(response) {
  // Change state for event hooks
  var oldState = this.state;
  this.state = response;

  // Play/pause/unpause/stop
  if (oldState.playing != response.playing) {
    if (!response.playing) { // stop/pause
      if (oldState.time === 0) { // stop
        this.trigger('stop'); console.log('triggered: stop');
      } else { // pause
        this.trigger('pause'); console.log('triggered: pause');
      }
    } else { // play/unpause
      if (oldState.id != response.id || response.time === 0) { // play
        this.trigger('play'); console.log('triggered: play');
      } else { // unpause
        this.trigger('unpause'); console.log('triggered: unpause');
      }
    }
  }

  // volume
  if (oldState.volume != response.volume) {
    this.trigger('volume'); console.log('triggered: volume');
  }
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
  this._socket.emit(this.state.playing ? 'pause' : 'unpause', this.state.id);
};

// Ask the server to stop the song playing, and reset the current time
ClientPlayer.prototype.stop = function() {
  this.checkSocketConnection();
  this._socket.emit('stop', this.state.id);
};

// Ast the server to play the next song
ClientPlayer.prototype.playNext = function() {
  this.checkSocketConnection();
  this._socket.emit('play_next');
};

// Ast the server to play the previous song
ClientPlayer.prototype.playPrevious = function() {
  this.checkSocketConnection();
  this._socket.emit('play_prev');
};

// Ask the server player to set the volume
ClientPlayer.prototype.setVolume = function(volume) {
  this.checkSocketConnection();
  this._socket.emit('volume', volume);
};

// Ask the server player to set the current time
ClientPlayer.prototype.setTime = function(time) {
  this.checkSocketConnection();
  this._socket.emit('time', this.state.id, time);
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
