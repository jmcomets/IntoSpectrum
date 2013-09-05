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
  this._time_lenght = 0;
  this._time_pos = 0;

  // Spawn new process with appropriate file
  this._process = spawn('mplayer', ['-slave', '-idle', '-quiet']);

  // Handle process output
  var self = this;
  this._process.stdout.on('data', function(data) {
    var get_word = function(word, data) {
      if(data.length > word.length && data.slice(0, word.length) == word) {
        console.log('STDOUT : ' + data);
        return data.slice(word.length);
      }
      return undefined;
    };

    var time_length = parseFloat(get_word('ANS_LENGTH=', data));
    if(time_length != undefined
      && !isNaN(time_length)) {
        self._time_length = time_length;
      }

    var time_pos = parseFloat(get_word('ANS_TIME_POSITION=', data));
    if(time_pos != undefined
      && !isNaN(time_pos)) {
        self._time_pos = time_pos;
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
  this.get_time_length();
  this._paused = false;
  this._time_pos = 0;
  this._time_length = 0;
};

// Stop the current playing song
Mplayer.prototype.stop = function() {
  // this._send('stop');
  // this._paused = true;
  this.unpause();
  this.set_time_pos(0);
  this.pause();
};

// Pause/Unpause the current playing song
Mplayer.prototype.togglePause = function() {
  this._send('pause\n');
  this._paused = !this._paused;
};

// unpause the current playing song
Mplayer.prototype.unpause = function() {
  if(this._paused) { this.togglePause(); }
};

// Pause the current playing song
Mplayer.prototype.pause = function() {
  if(!this._paused) { this.togglePause(); }
};

// Set the volume
Mplayer.prototype.set_volume = function(volume) {
  this._send('volume ' + volume + ' 1');
};

// Get the song duration
Mplayer.prototype.get_time_length = function() {
  this._send('get_time_length');
}

// Get the song current time
Mplayer.prototype.get_time_pos = function() {
  this._send('get_time_pos');
}
// ...set
Mplayer.prototype.set_time_pos = function(time) {
  this._send('set_property time_pos ' + time);
  this._time_pos = time;
}

// Listener export (main function of the module)
exports.listen = function(server) {
  var current_song = {'song': undefined,
    'playing': false,
    'volume': 100,
    'time': 0
  };

  // Socket.IO
  var io = socketIO.listen(server).of(settings.player.url);

  var mplayer = new Mplayer();

  var timer;
  var start_update = function() {
    if(timer != undefined)
      return;

    timer = setInterval(function() {
      mplayer.get_time_pos();

      // Plus 1s for the late
      current_song['time'] = mplayer._time_pos;
      if(current_song['time'] != undefined) { current_song['time'] += 1; }

      if(current_song['song'] != undefined) {
        current_song['song'].duration = mplayer._time_length;
      }

      send_song();
    }, 1000);
  };

  var stop_update = function() {
    if(timer != undefined)
      clearInterval(timer);
    timer = undefined;
  };

  // Prococol from server to client
  // info ID PLAYING VOLUME TIME TIME_MAX
  // ID is an integer. If ID = -1, no music are used.
  // PLAYING is 0 if the music is paused. Else 1
  // VOLUME is an integer between 0 to 100
  // TIME is an integer (in seconds)
  // TIME_MAX is an integer (in seconds)
  var send_song = function() {
    var out = {'id': -1,
      'playing': current_song['playing'] ? 1 : 0,
      'volume': current_song['volume'],
      'time': current_song['time'],
      'time_max': 0
    };

    if(current_song['song'] != undefined) {
      out['id'] = current_song['song'].id;
      out['time_max'] = current_song['song'].duration;
    }
    if(out['time'] == undefined)      { out['time'] = 0; }
    if(out['time_max'] == undefined)  { out['time_max'] = 0; }

    if(out['playing'])
      start_update();
    else
      stop_update();

    io.emit('info', out);
  };

  // Server setup
  io.on('connection', function(socket) {
    socket.on('get_info', function() {
      send_song();
    }).on('play', function(id) {
      id = parseInt(id);
      if(id != undefined) {
        Song.find(id).success(function(song) {
          if(song != undefined) {
            mplayer.play(song);

            song.duration = mplayer.time_length;
            song.playCount += 1;
            song.save();

            current_song['song'] = song;
            current_song['time'] = 0;
            current_song['playing'] = true;

            send_song();
          }
        });
      }
    }).on('pause', function(id) {
      id = parseInt(id);
      if(id != undefined
        && current_song['song'] != undefined
        && id == current_song['song'].id
        && current_song['playing']) {
          mplayer.pause();
          current_song['playing'] = false;
          send_song();
        }
    }).on('unpause', function(id) {
      id = parseInt(id);
      if(id != undefined
        && current_song['song'] != undefined
        && id == current_song['song'].id
        && !current_song['playing']) {
          mplayer.unpause();
          current_song['playing'] = true;
          send_song();
        }
    }).on('stop', function(id) {
      id = parseInt(id);
      if(id != undefined
        && current_song['song'] != undefined
        && id == current_song['song'].id) {
          mplayer.stop();
          current_song['time'] = 0;
          current_song['playing'] = false;
          send_song();
        }
    }).on('volume', function(volume) {
      volume = parseFloat(volume);
      if(volume != undefined && volume >= 0 && volume <= 100) {
        mplayer.set_volume(volume);
        current_song['volume'] = volume;
        send_song();
      }
    }).on('time', function(id, time) {
      id = parseInt(id);
      time = parseFloat(time);
      console.log('timeimemie ' + time);
      if(id != undefined
        && current_song['song'] != undefined
        && id == current_song['song'].id
        && time != undefined
        && time >= 0
        && (current_song['song'].duration == undefined
          || time <= current_song['song'].duration)) {
            mplayer.set_time_pos(time);
            mplayer._time_pos = time;
            current_song['time'] = time;
            send_song();
          }
    })
  });
};

// vim: ft=javascript et sw=2 sts=2
