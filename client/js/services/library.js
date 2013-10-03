app.service('libraryService', function($rootScope, $http) {
  return {
    getSongs: function(step, end) {
      var loadSongs = function(c) {
        var cursor = parseInt(c, 10) || 1;
        $http.get('/library/' + cursor).success(function(data) {
          step(data.songs);
          if (data.next) { loadSongs(cursor + 1); }
          else { end(); }
        });
      };
      loadSongs();
    }
  };
});
