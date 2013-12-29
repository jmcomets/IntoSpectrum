angular.module('IntoSpectrum').service('$library', function($rootScope, $http, $q) {
  var $library = { songs: [] };

  var formatSong = function(song) {
    return song;
  };

  $library.loadSongs = function() {
    var deferred = $q.defer();
    $http.get('/api/songs/?offset=' + this.songs.length).success(function(data) {
      angular.forEach(data.songs, function(song) {
        song.title = (song.title) ? song.title : function(str) {
          str = str.substring(str.lastIndexOf('/') + 1, str.length);
          return str.substring(0, str.lastIndexOf('.'));
        } (song.file);
        $library.songs.push(formatSong(song));
      });
      $rootScope.$safeApply(function() {
        deferred.resolve();
      });
    });
    return deferred.promise;
  };

  return $library;
});
