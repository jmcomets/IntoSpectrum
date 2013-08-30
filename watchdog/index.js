var path = require('path');

// Options for watchdog
var options = {
  interval: {
    hours: 24,
    minutes: 0,
    seconds: 0
  }, delay: 0
};

// Worker setup
var worker = require('child_process').fork(path.join(__dirname, 'worker.js'));

// Configuration via options
var configure = exports.configure = function(opts) {
  options.interval.seconds = opts.interval.seconds;
  options.interval.minutes = opts.interval.minutes;
  options.interval.hours = opts.interval.hours;
  options.delay = opts.delay || 0;
}

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

  // Now notify the worker process
  var total_seconds = seconds + 60*(minutes + 60*hours);
  console.log('total_seconds = ' + total_seconds);
  setTimeout(function() { worker.send('run'); }, total_seconds);
}

// Stop watchdog (brutally)
exports.stop = function() { worker.kill(); }

// Callbacks (exported via on)
var callbacks = {
  started: function() {},
  finished: function() {}
};
// callbacks configuring
exports.on = function(evt, fn) { callbacks.evt = fn; };

// Communication with the worker
process.on('message', function(msg) {
  if (msg == 'finished') { callbacks.finished(); }
  else if (msg == 'started') { callbacks.started(); }
  else { throw new Error('watchdog: unknown message ' + msg); }
});

// vim: ft=javascript et sw=2 sts=2
