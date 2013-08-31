var path = require('path');

// Options for watchdog
var options = {
  interval: {
    hours: 24,
    minutes: 0,
    seconds: 0
  }, delay: 0
};

// Configuration via options
var configure = exports.configure = function(opts) {
  options.interval.seconds = opts.interval.seconds;
  options.interval.minutes = opts.interval.minutes;
  options.interval.hours = opts.interval.hours;
  options.delay = opts.delay || 0;
}

// Callbacks (exported via on)
var callbacks = {
  started: function() {},
  finished: function() {}
};
// callbacks configuring
exports.on = function(evt, fn) { callbacks.evt = fn; };

var intervalId = 0;

// Start watchdog, reapplying all options
exports.start = function(opts) {
  // First of all, configure if extra options are given
  if (opts) { configure(opts); }
  var seconds = options.interval.seconds || 0,
      minutes = options.interval.minutes || 0,
      hours = options.interval.hours || 0,
      delay = options.delay || 0;

  // TODO implement initial wait
  console.log('Configuring with dummy startup delay (' + delay + ')');

  // Now schedule the working process
  var total_seconds = seconds + 60*(minutes + 60*hours);
  console.log('Configuring with repeat interval = ' + total_seconds + ' seconds');
  intervalId = setInterval(function() {
    console.log('Working'); // TODO
  }, total_seconds*1000);
}

// Stop watchdog
exports.stop = function() { clearInterval(intervalId); }

// vim: ft=javascript et sw=2 sts=2
