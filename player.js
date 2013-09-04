var path = require('path'),
    EventEmitter = require('events').EventEmitter,
    socketIO = require('socket.io'),
    spawn = require('child_process').spawn,
    settings = require('./settings'),
    Song = require('./models').Song;

// Mplayer class: wrapper for mplayer process
var Mplayer = function() {
  this._process = null;
  this._normalExit = true;
  this.paused = false;
};

// Inherit from EventEmitter
Mplayer.prototype.__proto__ = EventEmitter.prototype;

// Helper private method for communicating with mplayer (raw data),
// returns true if the data was written, false otherwise
Mplayer.prototype._send = function(line) {
  if (this._process) {
    this._process.stdin.write(line + '\n');
    return true;
  } else {
    return false;
  }
};


// TODO
var _then = function() {
  then = function(f) {
    f();
  }
  return this;
};

// Play a song brutally, stopping any current playing song
Mplayer.prototype.play = function(song) {
  // Stored for convenience in callbacks
  var that = this;

  // Reset process if already started
  if (this._process) {
    this._normalExit = false;
    this._process.kill();
  }

  // Spawn new process with appropriate file
  this._process = spawn('mplayer', ['-slave', '-really-quiet', song.fullPath()]);
  this.paused = false;

  // Handle process end
  this._process.on('exit', function() {
    if (that._normalExit) {
      that._process = null;
    } else {
      this._normalExit = true;
    }
  });

  // Handle process output
  that._process.stdout.on('data', function(data) {
    console.log('data: ' + data);
  });

  return _then();
};

// Stop the current playing song
Mplayer.prototype.stop = function() {
  if (this._process) {
    this._send('stop'); // or this._process.kill();
    this._process = null;
    this.paused = true;
  }

  return _then();
};

// Pause/Unpause the current playing song
Mplayer.prototype.togglePause = function() {
  if (this._process) {
    this.paused = 1 - this.paused;
    this._send('pause');
  }

  return _then();
};

// unpause the current playing song
Mplayer.prototype.unpause = function() {
  if (this._process && this.paused) {
    return this.togglePause();
  }

  return _then();
};

// Pause the current playing song
Mplayer.prototype.pause = function() {
  if (this._process && !this.paused) {
    return this.togglePause();
  }

  return _then();
};

// Set the volume
Mplayer.prototype.setVolume = function(volume) {
  if (this._process) {
    this._send('volume ' + volume + ' 1');
  }

  return _then();
};

// Get the song duration
Mplayer.prototype.getTotalTime = function() {
  this._send('get_time_length');

  return _then();
}

// Get the song current time
Mplayer.prototype.getTime = function() {
  this._send('get_time_pos');

  return _then();
}
// ...set
Mplayer.prototype.setTime = function(time) {
  this._send('set_property time_pos ' + time);

  return _then();
}

// Listener export (main function of the module)
exports.listen = function(server) {
  var current_song = {'song': undefined,
    'playing': false,
    'volume': 50,
    'time': 0
  };

  // Socket.IO
  var io = socketIO.listen(server).of(settings.player.url);

  // Mplayer
  var mplayer = new Mplayer();
  mplayer.on('getVolume', function(volume) {
    io.emit('getVolume', volume);
  }).on('getTotalTime', function(time) {
    io.emit('getTotalTime', time);
  }).on('getTime', function(time) {
    io.emit('getTime', time);
  });

  // Server setup
  // Prococol from server to client
  // info ID PLAYING VOLUME TIME TIME_MAX
  // ID is an integer. If ID = -1, no music are used.
  // PLAYING is 0 if the music is paused. Else 1
  // VOLUME is an integer between 0 to 100
  // TIME is an integer (in seconds)
  // TIME_MAX is an integer (in seconds)
  io.on('connection', function(socket) {
    socket.on('get_info', function() {
      out = {'id': current_song['song'].id,
        'playing': current_song['playing'] ? 1 : 0,
        'volume': current_song['volume'],
        'time': current_song['time'],
        'time_max': current_song['song'].duration
      };
      io.emit('info', out);
    }).on('play', function(id) {
      id = parseInt(id);
      if(id != undefined) {
        Song.find(id).success(function(song) {
          if(song != undefined) {
            mplayer.play(song).then(function() {
              current_song['song'] = song;
              current_song['time'] = 0;
              current_song['playing'] = true;

              if (song.duration = undefined) {
                song.duration = 60;
              }
              song.playCount += 1;
              song.save();

              out = {'id': song.id,
                'playing': 1,
                'volume': current_song['volume'],
                'time': 0,
                'time_max': song.duration
              };

              io.emit('info', out);
            });
          }
        });
      }
    }).on('pause', function(id) {
      id = parseInt(id);
      if(id != undefined && id == current_song['song'].id
        && current_song['playing']) {
        mplayer.pause().then(function() {
          current_song['playing'] = false;
          out = {'id': current_song['song'].id,
            'playing': 0,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    }).on('unpause', function(id) {
      id = parseInt(id);
      if(id != undefined && id == current_song['song'].id
        && !current_song['playing']) {
        mplayer.unpause().then(function() {
          current_song['playing'] = true;
          out = {'id': current_song['song'].id,
            'playing': 1,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    }).on('stop', function(id) {
      id = parseInt(id);
      if(id != undefined && id == current_song['song'].id) {
        mplayer.stop().then(function() {
          current_song['time'] = 0;
          current_song['playing'] = false;
          out = {'id': current_song['song'].id,
            'playing': 0,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    }).on('volume', function(id, volume) {
      id = parseInt(id);
      volume = parseFloat(volume);
      if(id != undefined && id == current_song['song'].id
        && volume != undefined && volume >= 0 && volume <= 100) {
        mplayer.setVolume(volume).then(function() {
          current_song['volume'] = volume;
          out = {'id': current_song['song'].id,
            'playing': current_song['playing'] == true ? 1 : 0,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    }).on('time', function(id, time) {
      id = parseInt(id);
      time = parseInt(time);
      if(id != undefined && id == current_song['song'].id
        && time != undefined
        && time >= 0 && time <= current_song['song'].duration) {
        mplayer.setTime(time).then(function() {
          current_song['time'] = time;
          out = {'id': current_song['song'].id,
            'playing': current_song['playing'] == true ? 1 : 0,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    })
  });
};

// vim: ft=javascript et sw=2 sts=2
