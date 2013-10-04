var Song = require('../models').Song;

// Songs API
exports.songs = function(req, res, next) {
  if (offset < 0) { next(); }
  var limit = 100, offset = parseInt(req.params.offset);
  Song.count().success(function(count) {
    songs = Song.findAll({
      'offset': offset,
      'limit': limit
    }).success(function(songs) {
      res.json({
        'songs': songs,
        'count': count,
        'next': songs.length == limit
      });
    });
  });
};

// vim: ft=javascript et sw=2 sts=2
