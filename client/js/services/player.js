angular.module('IntoSpectrum').factory('$player', function ($rootScope, $q, $library, $events) {
  // Exposed player service
  var player = {
    state: {},
    emit: function() {
      var socket = this.socket;
      console.log('$player.emitting', arguments);
      socket.emit.apply(socket, arguments);
    }
  };
  $events.mixin(player);

  // Socket response handlers (info/response)
  var handleStateChange = function(state, evt) {
    $library.findSong(state.songid).then(function(song) {
      state.song = song;
      state.playing = state.state == 'play';
      state.random = state.random == 1 || state.random == '1';
      state.repeat = state.repeat == 1 || state.repeat == '1';
      player.state = state;
      player.trigger(evt);
    });
  }, handleInfo = function(info) {
    handleStateChange(info, 'info');
  }, handleResponse = function(response) {
    handleStateChange(response, 'response');
  };

  // Player interface
  (function(emitters) {
    angular.forEach(emitters, function(emitter, name) {
      player[name] = emitter;
    });
  })({
    play:           function(songId) { this.emit('play', songId); },
    stop:           function() { this.emit('stop'); },
    next:           function() { this.emit('next'); },
    previous:       function() { this.emit('previous'); },
    pause:          function() { this.emit('pause'); },
    unpause:        function() { this.emit('unpause'); },
    setTime:        function(time) { this.emit('time', time); },
    setRandom:      function(random) { this.emit('random', random); },
    setRepeat:      function(repeat) { this.emit('repeat', repeat); },
    setVolume:      function(volume) { this.emit('volume', volume); },
    load:           function() { this.emit('info'); },


    // Toggle actions
    toggleRandom: function() { this.setRandom(1 - this.state.random); },
    toggleRepeat: function() { this.setRepeat(1 - this.state.repeat); },
    togglePause: function() {
      if (this.state.playing) { this.pause(); }
      else { this.unpause(); }
    }
  });

  // Socket connection
  player.socket = io.connect('/player');

  // Try to connect until connected
  var intervalID = -1, tryReconnect = function(seconds) {
    intervalID = setInterval(function() {
      if (!player.socket.socket.connected && !player.socket.socket.connecting) {
        socket.socket.connect();
      }
    }, seconds*1000);
  };

  // Try to reconnect immediately (applied after 2 seconds, unless failure)
  tryReconnect(2);

  player.socket.on('connect', function() {
    clearInterval(intervalID);
    player.trigger('connected');
  }).on('disconnect', function() {
    tryReconnect(5);
    player.trigger('disconnected');
  }).on('info', function(info) {
    handleInfo(info);
  }).on('response', function(response) {
    handleResponse(response);
  });

  return player;
});
