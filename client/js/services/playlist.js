angular.module('IntoSpectrum').service('$playlist', function($rootScope, $q, $events) {
  var playlist = {};
  $events.mixin(playlist);
  return playlist;
});
