function LibraryCtrl($scope, libraryService) {
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
    libraryService.getSongs(function(songs) {
      $scope.songs = $scope.songs.concat(songs);
    }, function() {
      $scope.loading = false;
    });
  };

  // Play a song
  $scope.play = function(song) {
    player.play(song.id);
    $scope.currentSongId = song.id;
  };

  // Updating
  player.bind('info', function() {
    var state = this.state;
    $scope.$safeApply(function() {
      $scope.currentSongId = state.id;
    });
  });
}
