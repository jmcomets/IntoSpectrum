angular.module('IntoSpectrum').service('$events', function($rootScope) {
  var events = {
    bind: function(evt, fct) {
      this._events = this._events || {};
      this._events[evt] = this._events[evt] || [];
      this._events[evt].push(fct);
      return this;
    }, unbind: function(evt, fct) {
      this._events = this._events || {};
      if (evt in this._events === false) { return; }
      this._events[evt].splice(this._events[evt].indexOf(fct), 1);
    }, trigger: function(evt/*, args... */) {
      this._events = this._events || {};
      if (evt in this._events === false) { return; }
      var that = this, args = Array.prototype.slice.call(arguments, 1);
      angular.forEach(this._events[evt], function(callback) {
        $rootScope.$safeApply(function() { callback.apply(that, args); });
      });
    }
  };

  return {
    mixin: function(obj) {
      if (typeof obj === 'function') {
        obj = obj.prototype;
      }
      angular.forEach(events, function(fn, key) {
        obj[key] = fn;
      });
    }
  }
});
