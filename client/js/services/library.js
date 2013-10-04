angular.module('IntoSpectrum').service('$library', function($rootScope, $http, $q) {
  return {
    getSongs: function(c) {
      var cursor = parseInt(c) || 0, deferred = $q.defer();
      $http.get('/api/songs/' + cursor).success(function(data) {
        angular.forEach(data.songs, function(song) {
          song.title = (song.title) ? song.title : function(str) {
            str = str.substring(str.lastIndexOf('/') + 1, str.length);
            return str.substring(0, str.lastIndexOf('.'));
          } (song.path);
        });
        $rootScope.$safeApply(function() {
          deferred.resolve(data.songs);
        });
      }).error(function() {
        $rootScope.$safeApply(function() {
          deferred.error();
        });
      });
      return deferred.promise;
    }
  };
});
