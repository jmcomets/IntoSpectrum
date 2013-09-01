var path = require('path'),
    fs = require('fs'),
    Song = require('./models').Song;

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
  'media_root': __dirname,
  'interval': {
    'hours': 24,
    'minutes': 0,
    'seconds': 0
  }, 'delay': 0,
  'extensions': ['mp3', 'flac', 'ogg', 'wav', 'wma'],
  'logging': true
};

// Configuration via options
var configure = exports.configure = function(opts) {
  if (opts.interval != undefined) { options.interval = opts.interval; }
  if (opts.delay != undefined) { options.delay = opts.delay; }
  if (opts.extensions != undefined) { options.extensions = opts.extensions; }
  if (opts.media_root != undefined) { options.media_root = opts.media_root; }
  if (opts.logging != undefined) { options.logging = opts.logging; }
}

// Internal ID of the current started
var intervalId = null,
    started = false;

// Start watchdog, reapplying all options
exports.start = function(opts) {
  // Fail if already started
  if (started) { throw new Error('Already started'); }

  // Configure if extra options are given
  if (opts) { configure(opts); }
  var seconds = options.interval.seconds || 0,
      minutes = options.interval.minutes || 0,
      hours = options.interval.hours || 0,
      delay = options.delay || 0,
      extensions = options.extensions || [],
      total_seconds = seconds + 60*(minutes + 60*hours),
      media_root = options.media_root || __dirname,
      logging = options.logging || true;

  // Logging
  var log = (logging)
    ? function(msg) { console.log('[Watchdog] ' + msg) }
    : function(msg) {}
  ;

  // Configuration
  log('will run every ' + total_seconds
      + ' seconds, starting after ' + delay + ' seconds.');

  // Initial wait
  started = true;
  setTimeout(function() {
    var worker = function() {
      log('running');
      walk(media_root, function(error, files) {
        // Handle errors
        if (error) { throw error; };

        // Add (or update) songs to the library
        files.forEach(function(fname) {
          if (extensions.indexOf(fname.split('.').pop()) != -1) {
            Song.findOrCreate({ 'path': fname })
              .success(function(song, created) {
                if (created) { log('creating song ' + song.path); }
                // TODO update with parsed id3 tags
              });
          }
        });

        // Delete the broken songs
        Song.findAll().success(function(songs) {
          songs.forEach(function(song) {
            var fname = song.path;
            if (fs.exists(song.path) == false) {
              song.destroy().success(function() {
                log('destroying bad song ' + fname);
              });
            }
          });
        });
      });
    };
    worker();
    intervalId = setInterval(worker, 1000*total_seconds);
  }, 1000*delay);
}

// Stop watchdog
exports.stop = function() {
  if (started == false) { throw new Error('Not started'); }
  if (intervalId != null) { clearInterval(intervalId); }
  started = false;
  intervalId = null;
}

// vim: ft=javascript et sw=2 sts=2
