var path = require('path'),
    EventEmitter = require('events').EventEmitter,
    socketIO = require('socket.io'),
    spawn = require('child_process').spawn,
    settings = require('./settings'),
    Song = require('./models').Song;

// Mplayer class: wrapper for mplayer process
var Mplayer = function() {
  // Current state
  this._paused = false;
  this._timeLength = 0;
  this._timePos = 0;

  // Spawn new process with appropriate file
  this._process = spawn('mplayer', ['-slave', '-idle', '-quiet']);

  // Handle process output
  var self = this;
  this._process.stdout.on('data', function(data) {
    var get_word = function(word, data) {
      if (data.length > word.length && data.slice(0, word.length) == word) {
        console.log('STDOUT : ' + data);
        return data.slice(word.length);
      }
      return undefined;
    };

    var timeLength = parseFloat(get_word('ANS_LENGTH=', data));
    if (timeLength != undefined
      && !isNaN(timeLength)) {
        self._time_length = timeLength;
      }

    var time_pos = parseFloat(get_word('ANS_TIME_POSITION=', data));
    if (time_pos != undefined
      && !isNaN(time_pos)) {
        self._timePos = time_pos;
      }
  });
};

// Inherit from EventEmitter
Mplayer.prototype.__proto__ = EventEmitter.prototype;

// Helper private method for communicating with mplayer (raw data),
// returns true if the data was written, false otherwise
Mplayer.prototype._send = function(line) {
  this._process.stdin.write(line + '\n');
  console.log('STDIN :' +  line);
};

// Play a song brutally, stopping any current playing song
Mplayer.prototype.play = function(song) {
  this._send('loadfile "' + song.fullPath() + '"');
  this.getTimeLength();
  this._paused = false;
  this._timePos = 0;
  this._time_length = 0;
};

// Stop the current playing song
Mplayer.prototype.stop = function() {
  // this._send('stop');
  // this._paused = true;
  this.unpause();
  this.setTimePos(0);
  this.pause();
};

// Pause/Unpause the current playing song
Mplayer.prototype.togglePause = function() {
  this._send('pause');
  this._paused = !this._paused;
};

// unpause the current playing song
Mplayer.prototype.unpause = function() {
  if (this._paused) { this.togglePause(); }
};

// Pause the current playing song
Mplayer.prototype.pause = function() {
  if (!this._paused) { this.togglePause(); }
};

// Set the volume
Mplayer.prototype.set_volume = function(volume) {
  this._send('volume ' + volume + ' 1');
};

// Get the song duration
Mplayer.prototype.getTimeLength = function() {
  this._send('get_time_length');
}

// Get the song current time
Mplayer.prototype.getTimePos = function() {
  this._send('get_time_pos');
}
// ...set
Mplayer.prototype.setTimePos = function(time) {
  this._send('set_property time_pos ' + time);
  this._timePos = time;
}

// Listener export (main function of the module)
exports.listen = function(server) {
  var currentSong = {
    'song': undefined,
    'playing': false,
    'volume': 100,
    'time': 0
  };

  // Socket.IO
  var io = socketIO.listen(server).of(settings.player.url);

  var mplayer = new Mplayer();

  var timer;
  var startUpdate = function() {
    if (timer != undefined) { return; }

    timer = setInterval(function() {
      mplayer.getTimePos();

      // Plus 1s for the late
      currentSong['time'] = mplayer._timePos;
      if (currentSong['time'] != undefined) {
        currentSong['time'] += 1;
      }

      if (currentSong['song'] != undefined) {
        currentSong['song'].duration = mplayer._time_length;
      }

      sendSong();
    }, 1000);
  };

  var stopUpdate = function() {
    if (timer != undefined) {
      clearInterval(timer);
    }
    timer = undefined;
  };

  // Prococol from server to client
  // info ID PLAYING VOLUME TIME TIME_MAX
  // ID is an integer. If ID = -1, no music are used.
  // PLAYING is 0 if the music is paused. Else 1
  // VOLUME is an integer between 0 to 100
  // TIME is an integer (in seconds)
  // TIME_MAX is an integer (in seconds)
  var sendSong = function() {
    var out = {
      'id': -1,
      'playing': currentSong['playing'] ? 1 : 0,
      'volume': currentSong['volume'],
      'time': currentSong['time'],
      'time_max': 0
    };

    if (currentSong['song'] != undefined) {
      out['id'] = currentSong['song'].id;
      out['time_max'] = currentSong['song'].duration;
    }
    if (out['time'] == undefined)      { out['time'] = 0; }
    if (out['time_max'] == undefined)  { out['time_max'] = 0; }

    if (out['playing']) { startUpdate(); }
    else { stopUpdate(); }

    io.emit('info', out);
  };

  // Server setup
  io.on('connection', function(socket) {
    socket.on('get_info', function() {
      sendSong();
    }).on('play', function(id) {
      id = parseInt(id);
      if (id != undefined) {
        Song.find(id).success(function(song) {
          if (song != undefined) {
            mplayer.play(song);

            song.duration = mplayer.timeLength;
            song.playCount += 1;
            song.save();

            currentSong['song'] = song;
            currentSong['time'] = 0;
            currentSong['playing'] = true;

            sendSong();
          }
        });
      }
    }).on('pause', function(id) {
      id = parseInt(id);
      if (id != undefined
        && currentSong['song'] != undefined
        && id == currentSong['song'].id
        && currentSong['playing']) {
          mplayer.pause();
          currentSong['playing'] = false;
          sendSong();
        }
    }).on('unpause', function(id) {
      id = parseInt(id);
      if (id != undefined
        && currentSong['song'] != undefined
        && id == currentSong['song'].id
        && !currentSong['playing']) {
          mplayer.unpause();
          currentSong['playing'] = true;
          sendSong();
        }
    }).on('stop', function(id) {
      id = parseInt(id);
      if (id != undefined
        && currentSong['song'] != undefined
        && id == currentSong['song'].id) {
          mplayer.stop();
          currentSong['time'] = 0;
          currentSong['playing'] = false;
          sendSong();
        }
    }).on('volume', function(volume) {
      volume = parseFloat(volume);
      if (volume != undefined && volume >= 0 && volume <= 100) {
        mplayer.set_volume(volume);
        currentSong['volume'] = volume;
        sendSong();
      }
    }).on('time', function(id, time) {
      id = parseInt(id);
      time = parseFloat(time);
      console.log('timeimemie ' + time);
      if (id != undefined
        && currentSong['song'] != undefined
        && id == currentSong['song'].id
        && time != undefined
        && time >= 0
        && (currentSong['song'].duration == undefined
          || time <= currentSong['song'].duration)) {
            mplayer.setTimePos(time);
            mplayer._timePos = time;
            currentSong['time'] = time;
            sendSong();
          }
    })
  });
};

// vim: ft=javascript et sw=2 sts=2
