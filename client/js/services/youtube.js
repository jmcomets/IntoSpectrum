angular.module('IntoSpectrum').service('$youtube', function($rootScope, $http, $q) {
  return {
    search: function(query) {
      var url = 'https://gdata.youtube.com/feeds/api/videos?alt=json&q=' + encodeURI(query),
        deferred = $q.defer();
      $http.get(url).success(function(data) {
        results = [];
        angular.forEach(data.feed.entry, function(entry) {
          // Get appropriate (formatted) data
          var title = function(title) {
            var maxLength = 30;
            if (title.length > maxLength) {
              return title.substring(0, maxLength) + '...';
            } else {
              return title;
            }
          } (entry.title.$t), url = entry.link[0].href,
            time = function(inputTime) {
            var totalSeconds = inputTime.seconds,
              time = {
                'seconds': Math.floor(totalSeconds % 60),
                'hours': Math.floor(totalSeconds / 3600),
                'minutes': Math.floor(totalSeconds / 60) % 60
              }, repr = '';
            angular.forEach(time, function(value, key) {
              if (value < 10) { time[key] = '0' + value; }
            });
            if (totalSeconds >= 3600) {
              repr += time.hours + ':' + time.minutes + ':' + time.seconds;
            } else if (totalSeconds >= 60) {
              repr += time.minutes + ':' + time.seconds;
            } else {
              repr += time.seconds;
            }
            return repr;
          } (entry.media$group.yt$duration), thumb = entry.media$group.media$thumbnail[0].url;

          // Append to results
          results.push({
            title: title,
            time: time,
            url: url,
            thumb: thumb
          });
        });

        // Apply callback
        $rootScope.$safeApply(function() {
          deferred.resolve(results);
        });
      }).error(function() {
        $rootScope.$safeApply(function() {
          deferred.reject();
        });
      });
      return deferred.promise;
    }
  };
});
