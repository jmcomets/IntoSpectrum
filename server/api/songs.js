var Song = require('../models').Song;

// Songs API
exports.songs = function(req, res, next) {
  if (offset < 0) { next(); }
  var limit = 100, offset = parseInt(req.params.offset);
    Song.find()
      .skip(offset)
      .limit(limit)
      .exec(function(err, songs) {
        if (err) { throw new Error(err); }
        res.json({
          'songs': songs,
          'next': songs.length == limit
        });
      });
};

// vim: ft=javascript et sw=2 sts=2
