function LibraryCtrl($scope, $http) {
  // Loader: handles loading state
  $scope.loader = {
    percentage: 0,
    running: true
  };

  // List of song models
  $scope.songs = [];

  // Library initialization
  $scope.init = function() {
    // Load songs protocol (data handler, current cursor, end handler)
    var loadSongs = function(c) {
      var cursor = parseInt(c, 10) || 1;
      $http({
        method: 'GET',
        url: '/library/' + cursor
      }).success(function(data) {
        // Append songs to the library
        $scope.songs = $scope.songs.concat(data.songs);

        // Update load progress
        $scope.loader.percentage = 100 * $scope.songs.length / data.count;

        // Recursion for next load
        if (data.next) { loadSongs(cursor + 1); }
        else { $scope.loader.running = false; }
      });
    };
    loadSongs();
  };

  // Play a song
  $scope.play = function(song) {
    player.play(song.id);
  };

  // Right click
  $scope.menu = {
    song: {},
    visible: false,
    top: 0, left: 0,
    open: function(evt, song) {
      this.song = song;
      this.visible = true;
      this.top = evt.pageY;
      this.left = evt.pageX;
    }, close: function() {
      this.visible = false;
      this.song = {};
    }, play: function() {
      player.play(this.song.id);
      this.close();
    }, pushQueue: function() {
      player.addToPlayQueue(this.song.id);
      this.close();
    }, pushNext: function() {
      player.addAsNext(this.song.id);
      this.close();
    }
  };
}
;function PlayerCtrl($scope) {
  $scope.random = true;
  $scope.playing = false;
  $scope.volume = 0;

  $scope.next = function() {
    if ($scope.playing == false) { $scope.playing = true; }
    player.playNext();
  };

  $scope.previous = function() {
    if ($scope.playing == false) { $scope.playing = true; }
    player.playPrevious();
  };

  $scope.togglePause = function() {
    $scope.playing = 1 - $scope.playing;
    player.togglePause();
  };

  $scope.toggleRandom = function() {
    $scope.random = 1 - $scope.random;
    // TODO actually change the random mode
  };

  player.bind('info', function(state) {
    $scope.volume = this.state.volume;
    $scope.playing = this.state.playing;
    //$scope.random = this.state.random;
  });
}
;function SidebarCtrl($scope) {
}
;// Our main app
var app = angular.module('IntoSpectrum', []);

// Right click markup -> "ng-right-click"
app.directive('ngRightClick', function($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(e) {
      scope.$apply(function() {
        e.preventDefault();
        fn(scope, { $event: e });
      });
    });
  };
});
;player = {
  'state': {},
  'connect': function(url) {
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
  }, '_handleInfo': function(info) {
    this.state = info;
    this.trigger('info');
  }, '_handleResponse': function(response) {
    // Change state for event hooks
    var oldState = this.state;
    this.state = response;

    // Play/pause/unpause/stop
    if (oldState.playing != response.playing) {
      if (!response.playing) { // stop/pause
        if (oldState.time === 0) { // stop
          this.trigger('stop');
        } else { // pause
          this.trigger('pause');
        }
      } else { // play/unpause
        if (oldState.id != response.id || response.time === 0) { // play
          this.trigger('play');
        } else { // unpause
          this.trigger('unpause');
        }
      }
    }

    // volume
    if (oldState.volume != response.volume) {
      this.trigger('volume');
    }
  }, 'checkSocketConnection': function() {
    if (!this._socket) {
      throw new Error('[ClientPlayer] Cannot play, socket not connected');
    }
  }, 'play': function(songId) {
    this.checkSocketConnection();
    this._socket.emit('play', songId);
  }, 'togglePause': function() {
    this.checkSocketConnection();
    this._socket.emit(this.state.playing ? 'pause' : 'unpause', this.state.id);
  }, 'stop': function() {
    this.checkSocketConnection();
    this._socket.emit('stop', this.state.id);
  }, 'playNext': function() {
    this.checkSocketConnection();
    this._socket.emit('play_next');
  }, 'playPrevious': function() {
    this.checkSocketConnection();
    this._socket.emit('play_prev');
  }, 'setVolume': function(volume) {
    this.checkSocketConnection();
    this._socket.emit('volume', volume);
  }, 'setTime': function(time) {
    this.checkSocketConnection();
    this._socket.emit('time', this.state.id, time);
  }, 'addAsNext': function(songId) {
    this.checkSocketConnection();
    this._socket.emit('add_to_playlist', songId, 0);
  }, 'addToPlayQueue': function(songId) {
    this.checkSocketConnection();
    this._socket.emit('add_to_playlist', songId, -1);
  }, 'moveInPlaylist': function(from, to) {
    this.checkSocketConnection();
    this._socket.emit('move', from, to);
  }, 'playYoutube': function(url) {
    this.checkSocketConnection();
    this._socket.emit('play_youtube', encodeURI(url));
  }
};
// make player an event emitter
MicroEvent.mixin(player);
// connect socket
player.connect('/player');
