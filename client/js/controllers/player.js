function PlayerCtrl($scope, $player, $shortcuts) {
  $scope.playing = false;
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
    $scope.volume = parseFloat(this.state.volume);
    $scope.time = parseFloat(this.state.time);
    $scope.maxTime = parseFloat(this.state.timeMax);
  };

  $player.bind('info', handleStateChange);
  $player.bind('update', handleStateChange);
  $player.bind('connect', function() { $player.load(); });
  $player.bind('disconnect', function() { });

  $shortcuts.bind('space', function() { $scope.togglePause(); });
  $shortcuts.bind('n', function() { $scope.next(); });
  $shortcuts.bind('p', function() { $scope.previous(); });
}
