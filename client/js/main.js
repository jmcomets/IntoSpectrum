(function() {
  // Our main app
  var app = angular.module('IntoSpectrum', ['infinite-scroll', 'jquery-ui']);

  // Right click markup -> "ng-right-click"
  app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
      var fn = $parse(attrs.ngRightClick);
      element.bind('contextmenu', function(e) {
        scope.$apply(function() {
          e.preventDefault();
          fn(scope, { $event: e });
        });
      });
    };
  });

  // Helper adding a safe $apply
  app.run(['$rootScope', function($rootScope) {
    $rootScope.$safeApply = function(fn) {
      var phase = this.$root.$$phase;
      if (phase == '$apply' || phase == '$digest') {
        if (fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        this.$apply(fn);
      }
    };
  }]);

  // Fix for remote server access (Youtube API for example)
  app.config(function($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  });

  // TODO make this cleaner
  (function($) { $('.has-tooltip').tooltip(); }) (jQuery);
})();
