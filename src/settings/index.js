var path = require('path'),
    db = require('./database.json'),
    media = require('./media.json'),
    root = path.join(__dirname, '..', '..');

// Database
var Sequelize = exports.Sequelize = require('sequelize');
exports.db = new Sequelize(db.name, db.user, db.password, {
  'dialect': db.engine,
  'logging': false,
  'sync': { 'force': true }
});

// Media
exports.media = {
  'root': path.join(root, media.path),
  'extensions': media.extensions
};

// Player
exports.player = {
  'url': '/player'
};

// Watchdog
exports.watchdog = require('./watchdog.json');

// vim: ft=javascript et sw=2 sts=2
