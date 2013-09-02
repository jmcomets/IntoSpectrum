var Sequelize = require('sequelize'),
    db = new Sequelize('into_spectrum', 'root', '', {
    'dialect': 'mysql',
    'logging': false,
    'sync': { 'force': true }
});

exports.Song = require('./song').Song(db, Sequelize);

// vim: ft=javascript et sw=2 sts=2
