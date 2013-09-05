var path = require('path'),
    db = require('./database.json'),
    root = path.join(__dirname, '..');

// Database
var Sequelize = exports.Sequelize = require('sequelize');
exports.db = new Sequelize(db.name, db.user, db.password, {
  'dialect': db.engine,
  'logging': false,
  'sync': { 'force': true }
});

// Media
exports.media = {
  'root': path.join(root, 'media'),
  'extensions': ['mp3', 'flac', 'ogg', 'wav', 'wma']
};

// Player
exports.player = {
  'url': '/player'
};

// Watchdog
exports.watchdog = {
  'interval': {
    'hours': 24,
    'minutes': 0,
    'seconds': 0
  }, 'delay': 0,
  'logging': true
};

// Views
exports.views = {
  'extension': 'html',
  'path': path.join(root, 'views'),
  'cache': false
};

// vim: ft=javascript et sw=2 sts=2
