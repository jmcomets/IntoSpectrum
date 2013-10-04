angular.module('jquery-ui').directive('slider', function ($parse) {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, element, attrs, model) {
      var slider = $(element).slider({
        orientation: attrs.sliderOrientation || 'vertical',
        min:   parseFloat(attrs.sliderMin || 0),
        max:   parseFloat(attrs.sliderMax || 10),
        step:  parseFloat(attrs.sliderStep || 1),
        range: attrs.sliderRange || 'min',
        value: model.$viewValue,
        slide: function(event, ui) {
          scope.$apply(function() {
            model.$setViewValue(ui.value);
            if (attrs.sliderSlide) {
              scope.$eval(attrs.sliderSlide);
            }
          });
        }
      });

      scope.$watch(attrs.ngModel, function(value) {
        slider.slider('value', value);
      });
    }
  };
});
