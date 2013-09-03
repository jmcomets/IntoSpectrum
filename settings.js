var path = require('path');

// Database configuration
var Sequelize = exports.Sequelize = require('sequelize');
exports.db = new Sequelize('into_spectrum', 'root', '', {
  'dialect': 'mysql',
  'logging': false,
  'sync': { 'force': true }
});

// Media configuration
exports.media = {
  'root': path.join(__dirname, 'media'),
  'extensions': ['mp3', 'flac', 'ogg', 'wav', 'wma']
};

// vim: ft=javascript et sw=2 sts=2
