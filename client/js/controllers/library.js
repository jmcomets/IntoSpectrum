function LibraryCtrl($scope, $player, $library) {
  // Loading state
  $scope.loading = true

  // List of song models
  $scope.songs = [];
  // ...current playing song
  $scope.currentSong = {};
  // ...song sorting
  $scope.songSort = '';

  // Library initialization
  $scope.init = function() {
    $library.getSongs().then(function(songs) {
      $scope.songs = songs;
      $scope.loading = false;
    });
  };

  // Play a song
  $scope.play = function(song) {
    $player.play(song.id);
    $scope.currentSongId = song.id;
  };

  // Updating
  $player.bind('info', function() {
    var state = this.state;
    $scope.$safeApply(function() {
      $scope.currentSongId = state.id;
    });
  });
}
