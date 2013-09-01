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
  'song_model': null,
  'media_root': __dirname,
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
  if (opts.media_root != undefined) { options.media_root = opts.media_root; }
  if (opts.song_model != undefined) { options.song_model = opts.song_model; }
}

// Logging
var log = exports.log = function(msg) { console.log('[Watchdog] ' + msg); }

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
      song_model = options.song_model || null;

  // Fail if badly configured
  if (!song_model) { throw new Error('Song model not defined'); }

  // Log configuration
  log('Starting watchdog: will run every ' + total_seconds
      + ' seconds, starting after ' + delay + ' seconds.');

  // Initial wait
  started = true;
  setTimeout(function() {
    var worker = function() {
      log('Watchdog running');
      walk(media_root, function(error, files) {
        // Handle errors
        if (error) { throw error; };

        // Get the songs to add to the library
        var songsFound = [];
        files.forEach(function(fname) {
          if (extensions.indexOf(fname.split('.').pop()) != -1) {
            var relFname = fname; // TODO format to relative path
            songsFound.push({
              'path': relFname // TODO parse id3 tags
            });
          }
        });

        song_model.findAll().success(function(songs) {
          // Updating for songs which are already in the database,
          // returning if the song should be destroyed
          var update = function(indexInSongsFound, songInstance) {
            songsFound.splice(indexInSongsFound, 1);
            // TODO update id3 tags
            return false;
          }

          // Clear the library's "bad" songs (eg: inexisting files)
          songs.forEach(function(song) {
            var shouldDestroy = true;
            for (var i = 0; i < songsFound.length; i++) {
              var match_song = songsFound[i];
              if (song.path == match_song.path) {
                shouldDestroy = update(i, song);
                break;
              }
            }

            // Delete the "bad" song
            if (shouldDestroy) {
              log('destroying bad song ' + song.path);
              song.destroy();
            }
          });

          // Insert the new songs
          songsFound.forEach(function(song) {
            log('creating song ' + song.path);
            song_model.create(song);
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
