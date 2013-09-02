var path = require('path'),
    fs = require('fs'),
    ID3 = require('id3'),
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
  'media_root': path.join(__dirname, 'media'),
  'interval': {
    'hours': 24,
    'minutes': 0,
    'seconds': 0
  }, 'delay': 0,
  'extensions': ['mp3', 'flac', 'ogg', 'wav', 'wma'],
  'logging': false
};

// Internal ID of the current started
var intervalId = null,
    started = false;

var log = function(msg) {
  if (options.logging) {
    console.log('[Watchdog] ' + msg);
  }
}

// Runner
var run = function() {
  log('running');
  walk(options.media_root, function(error, files) {
    // Handle errors
    if (error) { throw error; };

    // Add (or update) songs to the library
    for (var i = 0; i < files.length; i++) {
      var fname = files[i];
      if (options.extensions.indexOf(fname.split('.').pop()) != -1) {
        log('reading: ' + fname);
        var data = fs.readFileSync(fname);
        // Don't insert songs which can't be read
        if (!data) {
          log('failed reading: ' + fname);
          return;
        }

        // Otherwise parse id3 tags and save
        var id3 = new ID3(data);
        if (id3.parse()) {
          Song.findOrCreate({
            'path': fname
          }).success(function(song, created) {
            // Log creation/find
            if (created) {
              log('created: ' + fname);
            } else {
              log('found: ' + fname);
            }

            // Parsed tags
            var tags = {
              'title': id3.get('title'),
              'artist': id3.get('artist'),
              'album': id3.get('album'),
              'year': id3.get('year')
            }

            // Update instance attributes and decide if save is needed
            var save = false;
            for (var key in tags) {
              if (tags[key] && !song[key]) {
                song[key] = tags[key];
                save = true;
              }
            }

            // Save and emit success (if that is)
            var success = function() { log('updated: ' + song.path); }
            if (save) {
              song.save().success(success);
            } else {
              success();
            }
          }).error(function() {
            log('error:' + fname);
          });
        } else {
          log('failed tag parsing: ' + fname);
        }
      }
    }

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

// Start watchdog, reapplying all options
var start = exports.start = function(opts) {
  // Fail if already started
  if (started) { throw new Error('Already started'); }

  // Configuration
  log('will run every ' + total_seconds
      + ' seconds, starting after ' + delay + ' seconds.');

  // Initial wait
  started = true;
  var total_seconds = (options.seconds || 0)
    + (60*((options.minutes || 0) + 60*(options.hours || 0)));
  setTimeout(function() {
    run();
    intervalId = setInterval(run, 1000*total_seconds);
  }, 1000*delay);
}

// Stop watchdog
var stop = exports.stop = function() {
  if (started == false) { throw new Error('Not started'); }
  if (intervalId != null) { clearInterval(intervalId); }
  started = false;
  intervalId = null;
}

if (require.main == module) { run(); }

// vim: ft=javascript et sw=2 sts=2
