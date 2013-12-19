function MainCtrl($scope, $player, $library) {
  // List of song models
  $scope.songs = [];
  // ...current playing song
  $scope.currentSong = { id: -1 };

  // Song list sorting
  $scope.predicate = "";
  $scope.reverse = false;
  $scope.toggleSongsSort = function(key) {
    $scope.predicate = "artist";
    $scope.reverse = !$scope.reverse;
  };

  // Pagination
  $scope.paginate = function() {
    $scope.loading = true;
    $library.loadSongs().then(function() {
      $scope.songs = $library.songs;
      $scope.loading = false;
    });
  };

  // Play a song
  $scope.play = function(song) {
    $player.play(song.id);
    $scope.currentSong = song;
  };

  // Add a song to the playlist
  $scope.addToPlaylist = function(song) {
    $player.addToPlaylist(song.id);
  };

  $scope.playNext = function(song) {
    $player.addAsNext(song.id);
  };

  // Connection handling
  $scope.connected = false;
  $player.bind('connect', function() { $scope.connected = true; });
  $player.bind('disconnect', function() { $scope.connected = false; });

  // Updating
  $player.bind('info', function() {
    $scope.currentSong = this.state.currentSong;
  });

  // Context menu
  $scope.menu = {
    visible: false,
    position: { x: 0, y: 0},
    song: null,
    open: function($evt, song) {
      this.visible = true;
      this.position = { x: $evt.pageX, y: $evt.pageY };
      this.song = song;
    }
  };
}
