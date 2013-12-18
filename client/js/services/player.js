angular.module('IntoSpectrum').factory('$player', function ($rootScope, $q, $library) {
  // Exposed player service
  var player = {
    state: {},
    bind: function(evt, fct) {
      this._events = this._events || {};
      this._events[evt] = this._events[evt] || [];
      this._events[evt].push(fct);
      return this;
    }, unbind: function(evt, fct) {
      this._events = this._events || {};
      if (evt in this._events === false) { return; }
      this._events[evt].splice(this._events[evt].indexOf(fct), 1);
    }, trigger: function(evt/*, args... */) {
      this._events = this._events || {};
      if (evt in this._events === false) { return; }
      var that = this, args = Array.prototype.slice.call(arguments, 1);
      angular.forEach(this._events[evt], function(callback) {
        $rootScope.$safeApply(function() { callback.apply(that, args); });
      });
    }
  };

  // Socket response handlers (info/response)
  var handleStateChange = function(state) {
    player.state = state;
  }, handleInfo = function(info) {
    $library.findSong(info.currentSongId).then(function(song) {
      delete info.currentSongId;
      info.currentSong = song;
      handleStateChange(info);
      player.trigger('info');
    });
  }, handleResponse = function(response) {
    handleStateChange(response);
    player.trigger('update');
  };

  // Player interface
  (function(obj) {
    angular.forEach(obj, function(value, key) {
      if (typeof value == 'function') {
        player[key] = function() {
          if (!player._socket) { throw new Error('Socket not connected'); }
          value.apply(player, arguments);
        };
      } else {
        throw new Error('Only functions can be wrapped in player interface');
      }
    });
  })({
    load:           function() { this._socket.emit('info'); },
    stop:           function() { this._socket.emit('stop', this.state.currentSong.id); },
    next:           function() { this._socket.emit('next'); },
    previous:       function() { this._socket.emit('previous'); },
    togglePause:    function() { this._socket.emit(this.state.playing ? 'pause' : 'unpause', this.state.currentSong.id); },
    youtube:        function(url) { this._socket.emit('youtube', encodeURI(url)); },
    setTime:        function(time) { this._socket.emit('time', this.state.currentSong.id, time); },
    setVolume:      function(volume) { this._socket.emit('volume', volume); },
    play:           function(songId) { this._socket.emit('play', songId); },
    addAsNext:      function(songId) { this._socket.emit('addToPlaylist', songId, 0); },
    addToPlaylist:  function(songId) { this._socket.emit('addToPlaylist', songId, -1); },
    moveInPlaylist: function(from, to) { this._socket.emit('move', from, to); }
  });

  // Socket connection
  (function(url) {
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
      player.trigger('connected');
      this
        .on('info', function(info) { handleInfo(info); })
        .on('response', function(response) { handleResponse(response); })
      ;
    player._socket = socket;
    }).on('disconnect', function() {
      tryReconnect(5);
      player._socket = undefined;
      player.trigger('disconnected');
    });
  })('/player');

  return player
});
