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
};

// Stop the current playing song
Mplayer.prototype.stop = function() {
  if (this._process) {
    this._send('stop'); // or this._process.kill();
    this._process = null;
    this.paused = true;
  }
};

// unpause the current playing song
Mplayer.prototype.unpause = function() {
  if (this._process && this.paused) {
    this.paused = 1;
    this._send('pause');
  }
};

// Pause the current playing song
Mplayer.prototype.pause = function() {
  if (this._process && !this.paused) {
    this.paused = 0;
    this._send('pause');
  }
};

// Pause/Unpause the current playing song
Mplayer.prototype.togglePause = function() {
  if (this._process) {
    this.paused = 1 - this.paused;
    this._send('pause');
  }
};

// Set the volume
Mplayer.prototype.setVolume = function(volume) {
  if (this._process) {
    this._send('volume ' + volume + ' 1');
  }
};

// Get the song duration
Mplayer.prototype.getTotalTime = function() {
  this._send('get_time_length');
}

// Get the song current time
Mplayer.prototype.getTime = function() {
  this._send('get_time_pos');
}
// ...set
Mplayer.prototype.setTime = function(time) {
  this._send('set_property time_pos ' + time);
}

// Listener export (main function of the module)
exports.listen = function(server) {
  var current_music = {'song': undefined,
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
    socket.on('play', function(id) {
      id = parseInt(id);
      if(id != undefined) {
        Song.find(id).success(function(song) {
          if(song != undefined) {
            mplayer.play(song).then(function() {
              current_song['song'] = song;
              current_song['time'] = 0;
              current_song['playing'] = true;

              out = {'id': sond.id,
                'playing': 1,
                'volume': current_song['volume'],
                'time': 0,
                'time_max': 0//TODO song.duration
              };

              song.playCount += 1;
              song.save();

              io.emit('info', out);
            });
          }
        });
      }
    }).on('pause', function(id) {
      id = parseInt(id);
      if(id != undefined && id == current_song['song'].id) {
        mplayer.pause().then(function() {
          current_song['playing'] = false;
          out = {'id': current_song['song'].id,
            'playing': 0,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': 0 // TODO current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    }).on('unpause', function(id) {
      id = parseInt(id);
      if(id != undefined && id == current_song['song'].id) {
        mplayer.unpause().then(function() {
          current_song['playing'] = true;
          out = {'id': current_song['song'].id,
            'playing': 1,
            'volume': current_song['volume'],
            'time': current_song['time'],
            'time_max': 0 // TODO current_song['song'].duration
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
            'time_max': 0 // TODO current_song['song'].duration
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
            'time_max': 0 // TODO current_song['song'].duration
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
            'time_max': 0 // TODO current_song['song'].duration
          };
          io.emit('info', out);
        });
      }
    });

  // io.on('connection', function(socket) {
  //   socket.on('play', function(song_id) {
  //     Song.find(song_id).success(function(song) {
  //       mplayer.play(song);
  //       song.playCount += 1
  //       song.save();
  //       io.emit('play', song);
  //     });
  //   }).on('togglePause', function() {
  //     mplayer.togglePause();
  //     io.emit('togglePause', mplayer.paused);
  //   }).on('stop', function() {
  //     mplayer.stop();
  //     io.emit('stop');
  //   }).on('setVolume', function(volume) {
  //     volume = parseFloat(volume);
  //     if (volume != undefined) {
  //       mplayer.setVolume(volume);
  //       io.emit('setVolume', volume);
  //     }
  //   }).on('setTime', function(time) {
  //       time = parseInt(time);
  //       if (time != undefined) {
  //         mplayer.setTime(time);
  //         io.emit('setTime', time);
  //       }
  //   }).on('getTotalTime', function() {
  //     mplayer.getTotalTime();
  //   }).on('getTime', function() {
  //     mplayer.getTime();
  //   });
  // });
};

// vim: ft=javascript et sw=2 sts=2
