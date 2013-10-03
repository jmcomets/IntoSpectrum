function PlayerCtrl($scope) {
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
