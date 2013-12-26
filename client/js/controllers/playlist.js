function PlaylistCtrl($scope, $playlist, $library) {
  $scope.playlist = [];

  $scope.remove = function($index) {
    console.error('Playlist.remove() not implemented!'); // TODO
  };

  $playlist.bind('update', function() {
    if ($scope.playlist.length != this.playlist.length) {
      var playlist = this.playlist, newPlaylist = [];
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
