var Song = require('../models').Song;

// Home page
exports.index = function(req, res) {
  res.render('index', {
    'title': 'Player'
  });
};

// Library
exports.library = function(req, res) {
  var cursor = (parseInt(req.params.cursor) || 1) - 1,
      limit = 100,
      offset = limit*cursor;
  console.log(cursor);
  console.log(limit);
  console.log(offset);
  songs = Song.findAll({
    'offset': offset,
    'limit': limit
  }).success(function(songs) {
    res.json({
      'songs': songs,
      'next': songs.length > 0
    });
  });
};

// vim: ft=javascript et sw=2 sts=2
