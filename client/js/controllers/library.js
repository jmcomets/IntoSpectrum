function LibraryCtrl($scope, $player, $library) {
  // List of song models
  $scope.songs = [];
  // ...current playing song (database id)
  $scope.currentSongId = -1;

  // Loading
  $scope.load = function() {
    $scope.loading = true
    $library.getSongs().then(function(songs) {
      $scope.loading = false;
      $scope.songs = songs;
    });
  };

  // Pagination
  $scope.paginate = function() {
    $library.getSongs($scope.songs.length).then(function(songs) {
      $scope.songs = $scope.songs.concat(songs);
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
