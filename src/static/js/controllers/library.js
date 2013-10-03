function LibraryCtrl($scope, $http) {
  // Loader: handles loading state
  $scope.loader = {
    percentage: 0,
    running: true
  };

  // List of song models
  $scope.songs = [];
  // ...current playing song
  $scope.currentSong = {};
  // ...song sorting
  $scope.songSort = '';

  // Library initialization
  $scope.init = function() {
    // Load songs protocol (data handler, current cursor, end handler)
    var loadSongs = function(c) {
      var cursor = parseInt(c, 10) || 1;
      $http({
        method: 'GET',
        url: '/library/' + cursor
      }).success(function(data) {
        // Append songs to the library
        $scope.songs = $scope.songs.concat(data.songs);

        // Update load progress
        $scope.loader.percentage = 100 * $scope.songs.length / data.count;

        // Recursion for next load
        if (data.next) { loadSongs(cursor + 1); }
        else { $scope.loader.running = false; }
      });
    };
    loadSongs();
  };

  // Play a song
  $scope.play = function(song) {
    player.play(song.id);
    $scope.currentSongId = song.id;
  };

  // Updating
  player.bind('info', function() {
    $scope.currentSongId = this.state.id;
    $scope.$digest();
  });
}
