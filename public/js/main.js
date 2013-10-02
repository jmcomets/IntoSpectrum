// Our main app
var app = angular.module('IntoSpectrum', []);

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
