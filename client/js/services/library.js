app.service('$library', function($rootScope, $http, $q) {
  return {
    getSongs: function() {
      var deferred = $q.defer(),
        songs = [], loadSongs = function(c) {
        var cursor = parseInt(c, 10) || 1;
        $http.get('/library/' + cursor).success(function(data) {
          songs = songs.concat(data.songs);
          if (data.next) { loadSongs(cursor + 1); }
          else { $rootScope.$safeApply(function() { deferred.resolve(songs); }); }
        });
      };
      loadSongs();
      return deferred.promise;
    }
  };
});
