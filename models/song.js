var path = require('path'),
    settings = require('../settings'),
    db = settings.db, Sequelize = settings.Sequelize;

var Song = exports.Song = db.define('Song', {
  'id': {
    'type': Sequelize.INTEGER,
  'primaryKey': true,
  'autoIncrement': true
  }, 'path': {
    'type': Sequelize.STRING,
  'unique': true
  }, 'title': {
    'type': Sequelize.STRING
  }, 'artist': {
    'type': Sequelize.STRING
  }, 'album': {
    'type': Sequelize.STRING
  }, 'year': {
    'type': Sequelize.INTEGER
  }, 'playCount': {
    'type': Sequelize.INTEGER,
  'defaultValue': 0
  }
}, {
  'tableName': 'songs',
  'timestamps': false,
  'instanceMethods': {
    'fullPath': function() {
      return path.join(settings.media.root, this.path);
    }
  }
});
Song.sync();

// vim: ft=javascript et sw=2 sts=2
