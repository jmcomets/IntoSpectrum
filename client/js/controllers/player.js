function PlayerCtrl($scope, $player) {
  $scope.random = true;
  $scope.playing = false;
  $scope.volume = 0;

  $scope.next = function() {
    if ($scope.playing == false) { $scope.playing = true; }
    $player.playNext();
  };

  $scope.previous = function() {
    if ($scope.playing == false) { $scope.playing = true; }
    $player.playPrevious();
  };

  $scope.togglePause = function() {
    $scope.playing = 1 - $scope.playing;
    $player.togglePause();
  };

  $scope.toggleRandom = function() {
    $scope.random = 1 - $scope.random;
    // TODO actually change the random mode
  };

  $scope.setTime = function(time) {
    // Change time
    $scope.time = time;

    // Update every half-second
    var secs = 1/2;

    // Interval behaviour
    if (this.id) { clearInterval(this.id); };
    this.id = setInterval(function() {
      $scope.$apply(function() {
        $scope.time += secs;
      });
    }, 1000*secs);
  };

  $player.bind('info', function(state) {
    $scope.playing = this.state.playing;
    //$scope.random = this.state.random;
    $scope.volume = parseFloat(this.state.volume);

    $scope.setTime(parseFloat(this.state.time));
    $scope.maxTime = parseFloat(this.state.time_max);
  });
}
