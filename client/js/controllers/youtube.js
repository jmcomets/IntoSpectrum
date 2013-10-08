function YoutubeCtrl($scope, $player, $youtube) {
  $scope.search = function() {
    $scope.results = [];
    $scope.searching = true;
    $youtube.search($scope.query).then(function(results) {
      $scope.searching = false;
      $scope.failed = false;
      $scope.results = results;
    }, function() {
      $scope.searching = false;
      $scope.failed = true;
    });
  };

  $scope.play = function(url) { $player.youtube(url); };
}
