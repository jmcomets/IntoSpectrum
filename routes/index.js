// Home page
exports.index = function(req, res) {
  res.render('index', {
    'title': 'Home'
  });
};

// Library
exports.library = function(req, res) {
  res.render('library', {
    'title': 'Library'
  });
};

// vim: ft=javascript et sw=2 sts=2
