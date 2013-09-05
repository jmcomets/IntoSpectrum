var path = require('path');

// Database
var Sequelize = exports.Sequelize = require('sequelize');
exports.db = new Sequelize('into_spectrum', 'root', '', {
  'dialect': 'mysql',
  'logging': false,
  'sync': { 'force': true }
});

// Media
exports.media = {
  'root': path.join(__dirname, 'media'),
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
  'path': path.join(__dirname, 'views'),
  'cache': false
};

// vim: ft=javascript et sw=2 sts=2
