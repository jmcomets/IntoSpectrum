var Song = require('../models').Song;

// Songs API
exports.songs = function(req, res, next) {
  var songId = req.params.id;
  if (songId !== undefined) {
    Song.findById(songId, function(err, song) {
      res.json(song);
    });
  } else {
    var limit = 100, offset = parseInt(req.query.offset);
    if (offset < 0) { next(); }
    Song.find()
      .skip(offset)
      .limit(limit)
      .exec(function(err, songs) {
        if (err) { return; }
        res.json({
          'songs': songs,
          'next': songs.length == limit
        });
      });
  }
};

// vim: ft=javascript et sw=2 sts=2
