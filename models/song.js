exports.Song = function(db, Sequelize) {
  var Song = db.define('Song', {
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
    }, 'play_count': {
      'type': Sequelize.INTEGER,
         'defaultValue': 0
    }
  }, {
    'tableName': 'songs',
    'timestamps': false
  });

  Song.sync();

  return Song;
};

// vim: ft=javascript et sw=2 sts=2
