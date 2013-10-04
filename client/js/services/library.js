app.service('$library', function($rootScope, $http, $q) {
  return {
    getSongs: function(c) {
      var cursor = parseInt(c) || 0, deferred = $q.defer();
      $http.get('/api/songs/' + cursor).success(function(data) {
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
