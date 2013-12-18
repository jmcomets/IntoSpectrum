angular.module('IntoSpectrum').service('$library', function($rootScope, $http, $q) {
  var $library = { songs: [] };

  var formatSong = function(song) {
    song.id = song._id;
    delete song._id;
    delete song.__v;
    return song;
  };

  $library.loadSongs = function() {
    var deferred = $q.defer();
    $http.get('/api/songs/?offset=' + this.songs.length).success(function(data) {
      angular.forEach(data.songs, function(song) {
        song.title = (song.title) ? song.title : function(str) {
          str = str.substring(str.lastIndexOf('/') + 1, str.length);
          return str.substring(0, str.lastIndexOf('.'));
        } (song.path);
        $library.songs.push(formatSong(song));
      });
      $rootScope.$safeApply(function() {
        deferred.resolve();
      });
    });
    return deferred.promise;
  };

  $library.findSong = function(songId) {
    var deferred = $q.defer();
    for (var key in this.songs) {
      var song = this.songs[key];
      if (song.id == songId) {
        $rootScope.$safeApply(function() {
          deferred.resolve(song);
        });
      }
    }
    $http.get('/api/songs/' + songId).success(function(song) {
      deferred.resolve(formatSong(song));
    }).error(function() {
      deferred.reject();
    });
    return deferred.promise;
  };

  return $library;
});
