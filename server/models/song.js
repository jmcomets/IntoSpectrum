var path = require('path'),
    settings = require('../settings'),
    mongoose = require('mongoose');

var Song = exports.Song = mongoose.model('Song', {
  path: {
    type: String,
    unique: true
  }, playCount: {
    type: Number,
    defaultValue: 0
  },
  title: { 'type': String }, artist: { 'type': String }, album: { 'type': String }, year: { type: Number },
  duration: { type: Number }
});

// vim: ft=javascript et sw=2 sts=2
