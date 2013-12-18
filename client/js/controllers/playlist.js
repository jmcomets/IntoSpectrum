function PlaylistCtrl($scope, $player, $library) {
  $scope.playlist = [];

  $scope.remove = function($index) {
    console.error('Playlist.remove() not implemented!'); // TODO
  };

  $player.bind('info', function() {
    if ($scope.playlist.length != this.state.playlist.length) {
      var playlist = this.state.playlist, newPlaylist = [];
      angular.forEach(playlist, function(songId) {
        $library.findSong(songId).then(function(song) {
          newPlaylist.push(song);
          if (newPlaylist.length == playlist.length) {
            $scope.playlist = newPlaylist;
          }
        });
      });
    }
  });
}
