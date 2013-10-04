var path = require('path'),
    db = require('./database.json'),
    media = require('./media.json'),
    root = path.join(__dirname, '..', '..');

// Database
var mongoose = require('mongoose');
mongoose.connect(db.host, db.name, db.port, {
  user: db.user,
  pass: db.password
});

// Media
exports.media = {
  root: path.join(root, media.path),
  extensions: media.extensions
};

// Player
exports.player = {
  url: '/player'
};

// Watchdog
exports.watchdog = require('./watchdog.json');

// vim: ft=javascript et sw=2 sts=2
