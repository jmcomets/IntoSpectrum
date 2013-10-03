function LibraryCtrl($scope, $player, $library) {
  // Loading state
  $scope.loading = true

  // List of song models
  $scope.songs = [];
  // ...current playing song (database id)
  $scope.currentSongId = -1;

  // Library initialization
  $scope.init = function() {
    $library.getSongs().then(function(songs) {
      $scope.loading = false;
      $scope.songs = songs;
    });
  };

  // Play a song
  $scope.play = function(song) {
    $player.play(song.id);
    $scope.currentSongId = song.id;
  };

  // Updating
  $player.bind('info', function() {
    $scope.currentSongId = this.state.id;
  });
}
