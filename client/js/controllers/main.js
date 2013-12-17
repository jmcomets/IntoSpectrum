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
    $library.getSongs($scope.songs.length).then(function(songs) {
      $scope.songs = $scope.songs.concat(songs);
      $scope.loading = false;
    });
  };

  // Play a song
  $scope.play = function(song) {
    console.log('ok');
    $player.play(song.id);
    $scope.currentSong = song.id;
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

  // Connection handling
  $scope.connected = false;
  $player.bind('connect', function() { $scope.connected = true; });
  $player.bind('disconnect', function() { $scope.connected = false; });

  // Updating
  $player.bind('info', function() {
    $scope.currentSong = this.state.currentSong;
  });
}
