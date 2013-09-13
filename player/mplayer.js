var spawn = require('child_process').spawn;

var request = function(input, out_waiting, err_waiting, on_finish) {
    this._input = input;
    this._out_waiting = out_waiting;
    this._err_waiting = err_waiting;

    this._on_finish = on_finish;

    this._checked_out = false;
    this._checked_err = false;
};

request.prototype.ask = function() {
    return this._input;
};

request.prototype.checked = function() {
    return this._checked_out || this._checked_err
      || (this._out_waiting === null && this._err_waiting == null);
};

request.prototype.check_out = function(data) {
    if(this._checked_out)
        return this._checked_out;

    var re = false;
    if(this._out_waiting === null) {
        re = true;
        if(this._err_waiting !== null)
            re = false;
    }
    else if(this._out_waiting == undefined)
        re = false;
    else {
        var word = this._out_waiting;
        if(data.length >= word.length
            && data.slice(0, word.length) == word)
            re = true;
    }

    if(re == true && this._on_finish != undefined)
        this._on_finish(data);
    this._checked_out = re;
    return re;
};

request.prototype.check_err = function(data) {
    if(this._checked_err)
        return this._checked_err;

    var re = false;
    if(this._err_waiting === null) {
        re = true;
        if(this._out_waiting !== null)
            re = false;
    }
    else if(this._err_waiting == undefined)
        re = false;
    else {
        var word = this._err_waiting;
        if(data.length >= word.length
            && data.slice(0, word.length) == word)
            re = true;
    }

    if(re == true && this._on_finish != undefined)
        this._on_finish(data);
    this._checked_err = re;
    return re;
};

var mplayer = exports.mplayer = function() {
    // 3 input/output fifo
    this._in_fifo = new Array();
    this._out_fifo = new Array();
    this._err_fifo = new Array();

    // Current request
    this._request = null;

    // Subproc of mplayer
    this._proc_opened = false;
    this._proc_opening = false;
    this._process = null;

    // Load the list of properties
    this._properties = {
      pause:    {value: undefined,  type: 'flag'},
      filename: {value: undefined,  type: 'string'},
      length:   {value: undefined,  type: 'time'},
      time_pos: {value: undefined,  type: 'time'},
      volume:   {value: undefined,  type: 'float'},
    };

    // Flush, listen and update sometimes
    var self = this;
    var time_to_update = 200;
    var f = function() {
      self._get_filename(function() {
        self._get_volume(function() {
          self._get_length(function() {
            self._get_time_pos(function() {
              self._get_pause(function() {
                setTimeout(f, time_to_update);
              });
            });
          });
        });
      });
    };
    f();
    setInterval(function() { self.flush(); }, time_to_update);
    setInterval(function() { self.listen(); }, time_to_update);
};

mplayer.prototype.start = function() {
    if(this._proc_opened || this._proc_opening)
        return;

    var self = this;
    this._proc_opening = true;
    this._process = spawn('mplayer', ['-slave', '-idle', '-quiet', '-softvol', '-nolirc']);

    // Active the communication with the process after a little time
    // TODO find another way to detect if it's on
    var timer = setTimeout(function() {
      self._proc_opened = true;
      self._proc_opening = false;
    }, this._proc_waiting_time);

    this._process.stdout.on('data', function(data) {
        console.log('STDOUT: ' + data);
        var lines = (new String(data)).split('\n');
        for(var i = 0 ; i < lines.length ; i++) {
            self._out_fifo.push(lines[i]);
        }
        self.listen();
        self.flush();
    });
    this._process.stderr.on('data', function(data) {
        console.log('STDERR: ' + data);
        var lines = (new String(data)).split('\n');
        for(var i = 0 ; i < lines.length ; i++) {
            self._err_fifo.push(lines[i]);
        }
        self.listen();
        self.flush();
    });
    this._process.on('exit', function(code, signal) {
        clearInterval(timer);
        self._proc_opened = false;
        self._proc_opening = false;
        self._process = null;

        // Restart mplayer
        self.start();
    });
};

mplayer.prototype.kill = function(signal) {
    if(signal = undefined)
        signal = 'SIGTERM';
    if(this._process)
        this._process.kill(signal);
};

mplayer.prototype.flush = function() {
  if(!this._proc_opened)
    return;

  while(this._request === null
    && this._in_fifo.length > 0) {
    this._request = this._in_fifo.shift();
    this._write(this._request.ask());
  }
};

mplayer.prototype.listen = function() {
    if(!this._proc_opened)
        return;
    if(this._request === null)
        return;

    // Check output fifo
    while(this._out_fifo.length > 0) {
        var out = this._out_fifo.shift();
        this._request.check_out(out);
    };

    // Check error fifo
    while(this._err_fifo.length > 0) {
        var err = this._err_fifo.shift();
        this._request.check_err(err);
    };

    if(this._request.checked())
        this._request = null;

    // Flush both output fifo
    for(; this._out_fifo.length ; this._out_fifo.shift());
    for(; this._err_fifo.length ; this._err_fifo.shift());
};

mplayer.prototype._write = function(data) {
    if(!this._proc_opened)
        return;

    console.log('STDIN: ' + data);
    this._process.stdin.write(data + '\n');
};

mplayer.prototype._get_property = function(prop, on_finish) {
  // TODO more secured
  if(this._properties[prop] == undefined)
    return;

  var self = this;
  this._in_fifo.push(new request('pausing_keep_force get_property ' + prop,
        'ANS_' + prop + '=',
        'Failed to get value of property \'' + prop + '\'',
        function(data) {
          var word = 'ANS_' + prop + '=';
          var type = self._properties[prop].type;
          self._properties[prop].value = undefined;
          if(data.length > word.length
            && data.slice(0, word.length) == word) {
              if(type == 'float')
    self._properties[prop].value = parseFloat(data.slice(word.length));
              else if(type == 'int')
    self._properties[prop].value = parseInt(data.slice(word.length));
              else if(type == 'flag')
    self._properties[prop].value = data.slice(word.length) == 'yes';
              else if(type == 'string')
    self._properties[prop].value = data.slice(word.length);
              else if(type == 'pos')
    self._properties[prop].value = parseInt(data.slice(word.length));
              else if(type == 'time')
    self._properties[prop].value = parseInt(data.slice(word.length));
            }
          if(on_finish) {
            on_finish(self._properties[prop].value);
          }
        }));
  this.flush();
};

mplayer.prototype._set_property = function(prop, value, on_finish) {
  // TODO more secured
  if(this._properties[prop] == undefined)
    return;

  var self = this;
  this._in_fifo.push(new request(
        'pausing_keep_force set_property ' + prop + ' ' + value,
        null,
        null,
        function() {
          // self._properties[prop].value = value;
          if(on_finish) {
            on_finish();
          }
        }));
  this.flush();
  this.listen();
};

mplayer.prototype.quit = function(code, on_finish) {
  if(code == undefined)
    code = 0;
  this._in_fifo.push(new request('quit', null, null, on_finish));
};

mplayer.prototype.loadfile = function(filename, append, on_finish) {
  this._in_fifo.push(new request(
        'loadfile "' + filename + '" ' + append,
        'Starting playback...',
        'Failed to open ' + filename + '.',
        on_finish));
};

mplayer.prototype.force_pause = function(on_finish) {
  if(!this._properties['pause'].value) {
    this._in_fifo.push(new request('pause', null, null, on_finish));
  }
};

mplayer.prototype.force_unpause = function(on_finish) {
  if(this._properties['pause'].value) {
    this._in_fifo.push(new request('pause', null, null, on_finish));
  }
};

mplayer.prototype.song_over = function() {
  return (!isNaN(this._properties.time_pos.value)
      && !isNaN(this._properties.length.value)
      && this._properties.time_pos.value >= this._properties.length.value)
    || this._properties.filename.value == undefined;
};

mplayer.prototype._get_filename = function(on_finish) {
  this._get_property('filename', on_finish);
};

mplayer.prototype._get_volume = function(on_finish) {
  this._get_property('volume', on_finish);
};

mplayer.prototype._get_time_pos = function(on_finish) {
  this._get_property('time_pos', on_finish);
};

mplayer.prototype._get_length = function(on_finish) {
  this._get_property('length', on_finish);
};

mplayer.prototype._get_pause = function(on_finish) {
  this._get_property('pause', on_finish);
};

mplayer.prototype.get_filename = function() {
  return this._properties.filename.value;
};

mplayer.prototype.get_volume = function() {
  return this._properties.volume.value;
};

mplayer.prototype.get_time_pos = function() {
  return this._properties.time_pos.value;
};

mplayer.prototype.get_length = function() {
  return this._properties.length.value;
};

mplayer.prototype.get_pause = function() {
  return this._properties.pause.value;
};

mplayer.prototype.set_time_pos = function(on_finish) {
  this._set_property('time_pos', on_finish);
};

mplayer.prototype.set_volume = function(on_finish) {
  this._set_property('volume', on_finish);
};

// vim: ft=javascript et sw=2 sts=2
