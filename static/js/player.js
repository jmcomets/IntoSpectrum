// Player class
function Player(url) {
  // Socket
  this._player = io.connect(url);

  // Base callbacks
  this._callbacks = {
    'play': [],
    'pause': [],
    'stop': [],
  };

  // Socket event hooks
  var that = this;
  this._player.on('connect', function() {
    that.log('connected on ' + url);
    this.on('play', function(song) {
      that.emit('play', song);
    }).on('pause', function() {
      that.emit('pause');
    }).on('pause', function() {
      that.emit('stop');
    });
  });
}

// Logging
Player.prototype.log = function(msg) {
  console.log('[Player] ' + msg);
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
Player.prototype.emit = function(evt) {
  this.log('emitting: ' + evt);
  var callbacks = this._callbacks[evt];
  for (var i = 0; i < callbacks.length; i++) { callbacks[i](); }
};

Player.prototype.play = function(song_id) {
  this.log('playing: ' + song_id);
  this._player.emit('play', song_id);
};

Player.prototype.pause = function() {
  this.log('pausing');
  this._player.emit('pause');
};

Player.prototype.stop = function() {
  this.log('stopping');
  this._player.emit('stop');
};

// vim: ft=javascript et sw=2 sts=2
