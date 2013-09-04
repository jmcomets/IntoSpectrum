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
      .on('play', function(song) { that.trigger('play', song); })
      .on('togglePause', function(paused) { that.trigger('togglePause', paused); })
      .on('stop', function() { that.trigger('stop'); })
      .on('getVolume', function(volume) { that.trigger('getVolume', volume); })
      .on('setVolume', function(volume) { that.trigger('setVolume', volume); })
      .on('getTime', function(time) { that.trigger('getTime', time); })
      .on('setTime', function(time) { that.trigger('setTime', time); })
      .on('getTotalTime', function(time) { that.trigger('totalTimeChanged', time); })
    ;
  });
}

// Observer pattern with MicroEvent, credit:
//  -> https://github.com/jeromeetienne/microevent.js
MicroEvent.mixin(Player);

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
