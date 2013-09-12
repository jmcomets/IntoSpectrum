var Song = require('../models').Song;

// Home page
exports.index = function(req, res) {
  res.render('index');
};

// Library
exports.library = function(req, res) {
  var cursor = (parseInt(req.params.cursor) || 1) - 1,
      limit = 100,
      offset = limit*cursor;
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
