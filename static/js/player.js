// Player class
function Player(url) {
  // Socket
  this._socket = io.connect(url);

  // Base callbacks
  this._callbacks = {
    'play': [],
    'togglePause': [],
    'stop': [],
    'getVolume': [],
    'setVolume': [],
    'getTime': [],
    'setTime': [],
    'totalTimeChanged': []
  };

  // Socket event hooks
  var that = this;
  this._socket.on('connect', function() {
    this
      .on('play', function(song) { that.emit('play', song); })
      .on('togglePause', function(paused) { that.emit('togglePause', paused); })
      .on('stop', function() { that.emit('stop'); })
      .on('getVolume', function(volume) { that.emit('getVolume', volume); })
      .on('setVolume', function(volume) { that.emit('setVolume', volume); })
      .on('getTime', function(time) { that.emit('getTime', time); })
      .on('setTime', function(time) { that.emit('setTime', time); })
      .on('getTotalTime', function(time) { that.emit('totalTimeChanged', time); })
    ;
  });
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
Player.prototype.emit = function(evt, data) {
  var callbacks = this._callbacks[evt];
  for (var i = 0; i < callbacks.length; i++) { callbacks[i](data); }
};

Player.prototype.play = function(song_id) {
  this._socket.emit('play', song_id);
};

Player.prototype.togglePause = function() {
  this._socket.emit('togglePause');
};

Player.prototype.stop = function() {
  this._socket.emit('stop');
};

Player.prototype.setVolume = function(volume) {
  this._socket.emit('setVolume', volume);
};

Player.prototype.getVolume = function() {
  this._socket.emit('getVolume');
};

// vim: ft=javascript et sw=2 sts=2
