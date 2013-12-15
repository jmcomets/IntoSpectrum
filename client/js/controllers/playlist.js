function PlaylistCtrl($scope, $player) {
  $scope.playlist = [];

  $scope.play = function($index) {
    alert('Playlist.play() not implemented!'); // TODO
  };

  $scope.remove = function($index) {
    alert('Playlist.remove() not implemented!'); // TODO
  };

  $player.bind('info', function() {
    if ($scope.playlist != this.state.playlist) {
      $scope.playlist = this.state.playlist;
    }
  });
}
