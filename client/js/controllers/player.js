function PlayerCtrl($scope, $player, $shortcuts) {
  $scope.playing = false;
  $scope.random = false;
  $scope.repeat = false;
  $scope.volume = 0;
  $scope.time = 0;
  $scope.maxTime = 0;

  $scope.next = function() {
    if ($scope.playing == false) { $scope.playing = true; }
    $player.next();
  };

  $scope.previous = function() {
    if ($scope.playing == false) { $scope.playing = true; }
    $player.previous();
  };

  $scope.togglePause = function() {
    $scope.playing = 1 - $scope.playing;
    $player.togglePause();
  };

  $scope.toggleRandom = function() {
    $scope.random = 1 - $scope.random;
    $player.toggleRandom();
  };

  $scope.toggleRepeat = function() {
    $scope.repeat = 1 - $scope.repeat;
    $player.toggleRepeat();
  };

  $scope.setVolume = function(volume) {
    if (volume === undefined) { volume = $scope.volume; }
    else { $scope.volume = volume; }
    $player.setVolume(volume);
  }

  // Auto-update logic
  $scope.$watch('playing', function() {
    if (this.id) { clearInterval(this.id); };

    // Update every half-second
    var secs = 1/2;
    if ($scope.playing) {
      this.id = setInterval(function() {
        $scope.$apply(function() {
          $scope.time += secs;
        });
      }, 1000*secs);
    }
  });

  var handleStateChange = function() {
    $scope.playing = this.state.playing;
    $scope.random = this.state.random;
    $scope.repeat = this.state.repeat;
    $scope.volume = parseFloat(this.state.volume);
    $scope.time = parseFloat(this.state.time);
    $scope.maxTime = parseFloat(this.state.timeMax);
  };

  $player.bind('info', handleStateChange);
  $player.bind('update', handleStateChange);
  $player.bind('response', handleStateChange);

  $shortcuts.bind('space', function() { $scope.togglePause(); });
  $shortcuts.bind('n', function() { $scope.next(); });
  $shortcuts.bind('p', function() { $scope.previous(); });
}
