var path = require('path'),
    fs = require('fs');

// Walk through a directory (parallel loop), found on SO:
//  >> http://stackoverflow.com/a/5827895/1441984
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.join(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

// Options for watchdog
var options = {
  'interval': {
    'hours': 24,
    'minutes': 0,
    'seconds': 0
  }, 'delay': 0,
  'extensions': ['mp3', 'flac', 'ogg', 'wav', 'wma']
};

// Configuration via options
var configure = exports.configure = function(opts) {
  if (opts.interval != undefined) { options.interval = opts.interval; }
  if (opts.delay != undefined) { options.delay = opts.delay; }
  if (opts.extensions != undefined) { options.extensions = opts.extensions; }
}

// Callbacks (exported via on)
var callbacks = {
  'started': function() {},
  'finished': function() {}
};
// callbacks configuring
exports.on = function(evt, fn) { callbacks.evt = fn; };

// Internal ID of the current started
var intervalId = null,
    started = false;

// Start watchdog, reapplying all options
exports.start = function(opts) {
  // Fail if already started
  if (started) { throw new Error('Watchdog already started'); }

  // Configure if extra options are given
  if (opts) { configure(opts); }
  var seconds = options.interval.seconds || 0,
      minutes = options.interval.minutes || 0,
      hours = options.interval.hours || 0,
      delay = options.delay || 0,
      extensions = options.extensions || [],
      total_seconds = seconds + 60*(minutes + 60*hours);

  // Log configuration
  console.log('Starting watchdog: will run every ' + total_seconds
      + ' seconds, starting after ' + delay + ' seconds.');

  // Initial wait
  started = true;
  setTimeout(function() {
    var worker = function() {
      console.log('Working'); // TODO
      walk('media', function(error, files) {
        // Handle errors
        if (error) { throw error; };

        // Get the songs to add to the library
        var songs = [];
        files.forEach(function(fname) {
          if (extensions.indexOf(fname.split('.').pop()) != -1) {
            // TODO
          }
        });
      });
    };
    worker();
    intervalId = setInterval(worker, 1000*total_seconds);
  }, 1000*delay);
}

// Stop watchdog
exports.stop = function() {
  if (started == false) { throw new Error('Watchdog not started'); }
  if (intervalId != null) { clearInterval(intervalId); }
  started = false;
  intervalId = null;
}

// vim: ft=javascript et sw=2 sts=2
