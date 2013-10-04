var Song = require('../models').Song;

// Songs API
exports.songs = function(req, res, next) {
  if (offset < 0) { next(); }
  var limit = 100, offset = parseInt(req.params.offset);
  Song.find({}, {
    'offset': offset,
    'limit': limit
  }, function(songs) {
    res.json({
      'songs': songs,
      'next': songs.length == limit
    });
  });
};

// vim: ft=javascript et sw=2 sts=2
