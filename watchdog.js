var path = require('path'),
    fs = require('fs'),
    ID3 = require('id3'),
    media = require('./settings').media,
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
  'interval': {
    'hours': 24,
    'minutes': 0,
    'seconds': 0
  }, 'delay': 0,
  'logging': true
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
// FIXME implement with a QueryChainer
var run = function() {
  log('collecting all songs in: ' + media.root);
  walk(media.root, function(error, files) {
    // Handle errors
    if (error) { throw error; };

    // Add (or update) songs to the library
    for (var i = 0; i < files.length; i++) {
      if (media.extensions.indexOf(files[i].split('.').pop()) != -1) {
        Song.findOrCreate({
          'path': files[i].substring(media.root.length + 1)
        }).success(function(song, created) {
          var fname = path.join(media.root, song.path);
          if (created || (song.title == undefined
              && song.artist == undefined
              && song.album == undefined
              && song.year == undefined)) {
            // Read and parse file
            var data;
            try {
              data = fs.readFileSync(fname);
              // Don't insert songs which can't be read
              if (!data) {
                log('failed reading: ' + song.path);
                return;
              }
            } catch (error) {
              log('failed reading: ' + song.path + ', reason: ' + error);
              song.destroy();
              return;
            }

            // Update parsed tags
            var id3 = new ID3(data);
            if (id3.parse()) {
              log('parsed: ' + song.path);
              song.updateAttributes({
                'title': id3.get('title'),
                'artist': id3.get('artist'),
                'album': id3.get('album'),
                'year': id3.get('year')
              }).success(function(song) {
                log('updated: { title: ' + song.title + ', artist: '
                  + song.artist + ', album: ' + song.album
                  + ', year: ' + song.year + ' }');
              });
            } else {
              log('failed tag parsing: ' + song.path);
            }
          }
        });
      }
    }

    // Delete the broken songs
    Song.findAll().success(function(songs) {
      songs.forEach(function(song) {
        var fname = path.join(media.root, song.path);
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
  for (var key in opts) {
    if (options[key] != undefined) {
      options[key] = opts[key];
    }
  }

  // Initial wait
  started = true;
  var delay = options.delay, total_seconds = (options.seconds || 0)
    + (60*((options.minutes || 0) + 60*(options.hours || 0)));
  log('will run every ' + total_seconds
      + ' seconds, starting after ' + delay + ' seconds.');
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
