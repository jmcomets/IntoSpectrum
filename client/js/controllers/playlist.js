function PlaylistCtrl($scope, $player) {
  $scope.playlist = [];

  $scope.play = function($index) {
    $player.play($scope.playlist[song]);
    $scope.playlist.slice(1, $index);
  };

  $scope.remove = function($index) {
  };

  $player.bind('info', function() {
    $scope.playlist = this.state.playlist;
    //console.log($scope.playlist);
  });
}
