var Sequelize = require('sequelize'),
    db = new Sequelize('into_spectrum', 'root', '', {
      'dialect': 'mysql',
      //'logging': false,
      'sync': {
        'force': true
      }
    });

var Song = exports.Song = db.define('Song', {
  'id': {
    'type': Sequelize.INTEGER,
    'primaryKey': true,
    'autoIncrement': true
  },
  'path': {
    'type': Sequelize.STRING,
    'unique': true
  },
  'title': {
    'type': Sequelize.STRING
  },
  'artist': {
    'type': Sequelize.STRING
  },
  'album': {
    'type': Sequelize.STRING
  },
  'year': {
    'type': Sequelize.INTEGER
  },
  'play_count': {
    'type': Sequelize.INTEGER,
    'defaultValue': 0
  }
}, {
  'tableName': 'songs',
  'timestamps': false
});

Song.sync();
