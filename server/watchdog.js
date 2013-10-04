var path = require('path'),
    fs = require('fs'),
    ID3 = require('id3'),
    file = require('file'),
    settings = require('./settings'),
    options = settings.watchdog,
    media = settings.media,
    Song = require('./models').Song;

var Watchdog = module.exports = function() {
};

Watchdog.prototype.log = function() {
  var args = [].slice.call(arguments, 0);
  args.unshift('[Watchdog]');
  console.log.apply(console, args);
};

Watchdog.prototype.run = function() {
  // Empty the old library
  this.log('deleting old library');
  Song.find().remove();

  // Collect new files
  var that = this;
  this.log('collecting all songs in: ' + media.root);
  file.walkSync(media.root, function(dirPath, _, files) {
    // Add songs to the library
    for (var i = 0; i < files.length; i++) {
      if (media.extensions.indexOf(files[i].split('.').pop()) != -1) {
        // Read and parse file
        var data, fname = path.join(dirPath, files[i]), song = {
          path: fname.substring(media.root.length + 1)
        };
        try {
          data = fs.readFileSync(fname);
          // Don't insert songs which can't be read
          if (!data) {
            that.log('failed reading: ' + song.path);
            return;
          }
        } catch (error) {
          that.log('failed reading: ' + song.path + ', reason: ' + error);
          song.destroy();
          return;
        }

        // Update parsed tags
        var id3 = new ID3(data);
        if (id3.parse()) {
          that.log('parsed: ' + song.path);
          song.title = id3.get('title');
          song.artist = id3.get('artist');
          song.album = id3.get('album');
          song.year = id3.get('year');
          that.log('creating:', song);
          Song.create(song, function() { that.log('created:', song); });
        } else {
          that.log('failed tag parsing: ' + song.path);
        }
      }
    }
  });
};

if (require.main == module) {
  var wd = new Watchdog();
  wd.run();
  //process.exit();
}
