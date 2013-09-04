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
  io.on('connection', function(socket) {
    socket.on('play', function(song_id) {
      Song.find(song_id).success(function(song) {
        mplayer.play(song);
        song.playCount += 1
        song.save();
        io.emit('play', song);
      });
    }).on('togglePause', function() {
      mplayer.togglePause();
      io.emit('togglePause', mplayer.paused);
    }).on('stop', function() {
      mplayer.stop();
      io.emit('stop');
    }).on('setVolume', function(volume) {
      volume = parseFloat(volume);
      if (volume != undefined) {
        mplayer.setVolume(volume);
        io.emit('setVolume', volume);
      }
    });
  }).on('setTime', function(time) {
      time = parseInt(time);
      if (time != undefined) {
        mplayer.setTime(time);
        io.emit('setTime', time);
      }
  }).on('getTotalTime', function() {
    mplayer.getTotalTime();
  }).on('getTime', function() {
    mplayer.getTime();
  });
};

// vim: ft=javascript et sw=2 sts=2
