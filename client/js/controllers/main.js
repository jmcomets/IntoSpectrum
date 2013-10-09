function MainCtrl($scope, $player, $library) {
  // List of song models
  $scope.songs = [];
  // ...current playing song (database id)
  $scope.currentSongId = -1;

  // Pagination
  $scope.paginate = function() {
    $scope.loading = true;
    $library.getSongs($scope.songs.length).then(function(songs) {
      $scope.songs = $scope.songs.concat(songs);
      $scope.loading = false;
    });
  };

  // Play a song
  $scope.play = function(song) {
    $player.play(song.id);
    $scope.currentSongId = song.id;
  };

  // Add a song to the playlist
  $scope.addToPlaylist = function(song) {
    $player.addToPlaylist(song.id);
  };

  $scope.playNext = function(song) {
    $player.addAsNext(song.id);
  };

  // Context menu
  $scope.menu = {
    open: function($evt, song) {
      this.visible = true;
      this.position = { x: $evt.pageX, y: $evt.pageY };
      this.song = song;
    }
  };

  // Updating
  $player.bind('info', function() {
    $scope.currentSongId = this.state.id;
  });
}
