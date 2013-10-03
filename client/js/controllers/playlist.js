function PlaylistCtrl($scope, $player) {
  $scope.playlist = [];

  $player.bind('info', function() {
    $scope.playlist = this.state.playlist;
  });
}
