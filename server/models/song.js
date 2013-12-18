var path = require('path'),
    settings = require('../settings'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SongSchema = new Schema({
  path: {
    type: String,
    unique: true
  }, playCount: {
    type: Number,
    default: 0
  },
  title: String,
  artist: String,
  album: String,
  year: Number,
  duration: Number
}, { versionKey: false });

SongSchema.methods.fullPath = function() {
  return path.join(settings.media.root, this.path);
};

exports.Song = mongoose.model('Song', SongSchema);

// vim: ft=javascript et sw=2 sts=2
