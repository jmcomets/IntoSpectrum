function LibraryCtrl($scope, $http) {
  // Flag indicating if the library is loading
  $scope.loading = true;

  // List of song models
  $scope.songs = [];

  // Library initialization
  $scope.init = function() {
    // Load songs protocol (data handler, current cursor, end handler)
    var loadSongs = function(fn, end, c) {
      var cursor = parseInt(c, 10) || 1;
      $http({
        'method': 'GET',
        'url': '/library/' + cursor
      }).success(function(data) {
        fn(data);
        if (data.next) {
          loadSongs(fn, end, cursor + 1);
        } else { end(); }
      });
    };

    // Load songs
    loadSongs(function(data) {
      // Append songs to the library
      $scope.songs = $scope.songs.concat(data.songs);

      // Update load progress
      // TODO
    }, function() {
      $scope.loading = false;
      //$scope.$apply();
    });
  };
}
