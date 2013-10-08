function YoutubeCtrl($scope, $player, $youtube) {
  $scope.results = [];

  $scope.search = function() {
    $scope.searching = true;
    $youtube.search($scope.query).then(function(results) {
      $scope.searching = false;
      $scope.results = results;
    });
  };

  $scope.play = function(url) { $player.youtube(url); };
}
