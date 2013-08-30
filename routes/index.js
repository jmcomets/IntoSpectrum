// Home page
exports.index = function(req, res) {
  res.render('index', {
    title: 'Home',
    brand: 'IntoSpectrum'
  });
};

// vim: ft=javascript et sw=2 sts=2
