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

  $library.cachedSong = undefined;
  $library.findSong = function(songId) {
    var deferred = $q.defer();
    for (var key in this.songs) {
      var song = this.songs[key];
      if (song.id == songId) {
        $rootScope.$safeApply(function() {
          deferred.resolve(song);
        });
        return deferred.promise;
      }
    }

    if ($library.cachedSong !== undefined && $library.cachedSong.id == songId) {
      deferred.resolve($library.cachedSong);
      return deferred.promise;
    }

    $http.get('/api/songs/' + songId).success(function(rawSong) {
      var song = formatSong(rawSong);
      $library.cachedSong= song;
      deferred.resolve(song);
    }).error(function() {
      deferred.reject();
    });
    return deferred.promise;
  };

  return $library;
});
