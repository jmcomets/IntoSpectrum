var spawn = require('child_process').spawn;

var Request = function(input, outWaiting, errWaiting, callback, timeout) {
  this._input = input;
  this._outWaiting = outWaiting;
  this._errWaiting = errWaiting;

  this._onFinish = callback;

  this._checkedOut = false;
  this._checkedErr = false;

  var baseTimeout = 30000;
  this._timeout = timeout || baseTimeout;
  this._beginTime = new Date().getTime();
};

Request.prototype.ask = function() {
  return this._input;
};

Request.prototype.checked = function() {
  return this._checkedOut || this._checkedErr
    || (this._outWaiting === null && this._errWaiting == null);
};

Request.prototype.timeout = function() {
  return new Date().getTime() - this._beginTime > this._timeout;
};

Request.prototype.checkOut = function(data) {
  if (this._checkedOut) { return this._checkedOut; }

  var re = false;
  if (this._outWaiting === null) {
    re = true;
    if (this._errWaiting !== null) { re = false; }
  } else if (this._outWaiting === undefined) {
    re = false;
  } else {
    var checkWord = function(word) {
      return data.length >= word.length
        && data.slice(0, word.length) == word;
    };

    if (typeof this._outWaiting == 'array') {
      for (var i = 0; i < this._outWaiting.length; i++) {
        var word = this._outWaiting[i];
        re = checkWord(word);
        if (re) { break; }
      }
    } else {
      re = checkWord(this._outWaiting);
    }
  }

  if (re === true && this._onFinish !== undefined) {
    this._onFinish(data);
    this._onFinish = undefined;
  }
  this._checkedOut = re;
  return re;
};

Request.prototype.checkErr = function(data) {
  if (this._checkedErr)
    return this._checkedErr;

  var re = false;
  if (this._errWaiting === null) {
    re = true;
    if (this._outWaiting !== null)
      re = false;
  } else if (this._errWaiting === undefined) {
    re = false;
  } else {
    var checkWord = function(word) {
      if (data.length >= word.length
          && data.slice(0, word.length) == word)
        return true;
      return false;
    };

    if (Array.isArray(this._errWaiting)) {
      for (var i = 0; i < this._errWaiting.length; i++) {
        var word = this._errWaiting[i];
        re = checkWord(word);
        if (re)
          break;
      }
    } else {
      re = checkWord(this._errWaiting);
    }
  }

  if (re === true && this._onFinish !== undefined) {
    this._onFinish(data);
    this._onFinish = undefined;
  }
  this._checkedErr = re;
  return re;
};

var Mplayer = module.exports = function() {
  // 3 input/output fifo
  this._inStack = [];
  this._outStack = [];
  this._errStack = [];

  // Current request
  this._request = null;

  // Subproc of mplayer
  this._procOpened = false;
  this._procOpening = false;
  this._process = null;

  // Load the list of properties
  this._properties = {
    'pause':    { type: 'flag' },
    'length':   { type: 'time' },
    'volume':   { type: 'float' },
    'time_pos': { type: 'time' },
    'filename': { type: 'string' }
  };

  // Flush, listen and update sometimes
  var self = this, timeToUpdate = 200;
  setInterval(function() { self.flush(); }, timeToUpdate);
  setInterval(function() { self.listen(); }, timeToUpdate);
};

Mplayer.prototype._log = function() {
  var args = [].slice.call(arguments, 0);
  args.unshift('[Mplayer]');
  console.log.apply(console, args);
};

Mplayer.prototype.update = function(callback) {
  var self = this;
  self._getProperty('filename', function() {
    self._getProperty('volume', function() {
      self._getProperty('length', function() {
        self._getProperty('time_pos', function() {
          self._getProperty('pause', function() {
            callback();
          });
        });
      });
    });
  });
};

Mplayer.prototype.start = function() {
  if (this._procOpened || this._procOpening) { return; }

  this._procOpening = true;
  this._process = spawn('mplayer', ['-slave', '-idle', '-quiet', '-softvol', '-nolirc', '-vo', 'NULL']);

  // Active the communication with the process after a little time
  // TODO find another way to detect if it's on
  var self = this;
  var timer = setTimeout(function() {
    self._procOpened = true;
    self._procOpening = false;
  }, this._procWaitingTime);

  this._process.stdout.on('data', function(data) {
    var lines = (new String(data)).split('\n');
    self._log('STDOUT', lines);
    for (var i = 0; i < lines.length; i++) {
        self._outStack.push(lines[i]);
    }
    self.listen();
    self.flush();
  });

  this._process.stderr.on('data', function(data) {
    var lines = (new String(data)).split('\n');
    self._log('STDERR', lines);
    for (var i = 0; i < lines.length; i++) {
      self._errStack.push(lines[i]);
    }
    self.listen();
    self.flush();
  });

  this._process.on('exit', function(code, signal) {
    clearInterval(timer);
    self._procOpened = false;
    self._procOpening = false;
    self._process = null;

    // Restart mplayer
    self.start();
  });
};

Mplayer.prototype.kill = function(signal) {
  if (signal === undefined) { signal = 'SIGTERM'; }
  if (this._process) { this._process.kill(signal); }
};

Mplayer.prototype.flush = function() {
  if (!this._procOpened) { return; }

  while (this._request === null && this._inStack.length > 0) {
    this._request = this._inStack.shift();
    this._write(this._request.ask());
  }
};

Mplayer.prototype.listen = function() {
  if (!this._procOpened || this._request === null) { return; }

  // Check output fifo
  while (this._outStack.length > 0) {
    var out = this._outStack.shift();
    this._request.checkOut(out);
  };

  // Check error fifo
  while (this._errStack.length > 0) {
    var err = this._errStack.shift();
    this._request.checkErr(err);
  };

  if (this._request.checked()) {
    this._request = null;
  } else if (this._request.timeout()) {
    this._inStack.unshift(new Request(this._request._input,
          this._request._outWaiting,
          this._request._errWaiting,
          this._request._onFinish,
          this._request._timeout));
    this._request = null;
  }

  // Flush both output fifo
  for (; this._outStack.length; this._outStack.shift());
  for (; this._errStack.length; this._errStack.shift());
};

Mplayer.prototype._write = function(data) {
  if (!this._procOpened) { return; }
  this._log('STDIN', data);
  this._process.stdin.write(data + '\n');
};

Mplayer.prototype._getProperty = function(prop, callback) {
  // TODO more secured
  if (this._properties[prop] === undefined) { return; }

  var self = this, word = 'ANS_' + prop + '=';
  this._inStack.push(new Request('pausing_keep_force get_property ' + prop,
        word, "Failed to get value of property '" + prop + "'",
        function(data) {
          var type = self._properties[prop].type;
          self._properties[prop].value = undefined;
          if (data.length > word.length && data.slice(0, word.length) == word) {
              if      (type == 'float')   { self._properties[prop].value = parseFloat(data.slice(word.length)); }
              else if (type == 'int')     { self._properties[prop].value = parseInt(data.slice(word.length)); }
              else if (type == 'flag')    { self._properties[prop].value = data.slice(word.length) == 'yes'; }
              else if (type == 'string')  { self._properties[prop].value = data.slice(word.length); }
              else if (type == 'pos')     { self._properties[prop].value = parseInt(data.slice(word.length)); }
              else if (type == 'time')    { self._properties[prop].value = parseInt(data.slice(word.length)); }
            }
          if (callback) { callback(self._properties[prop].value); }
        }, 5000));
  this.flush();
};

Mplayer.prototype._setProperty = function(prop, value, callback) {
  // TODO more secured
  if (this._properties[prop] === undefined) { return; }

  var self = this;
  this._inStack.push(new Request(
        'pausing_keep_force set_property ' + prop + ' ' + value,
        null, null,
        function() {
          //self._properties[prop].value = value;
          if (callback) { callback(); }
        }));
  this.flush();
  this.listen();
};

Mplayer.prototype.quit = function(code, callback) {
  if (code === undefined) { code = 0; }
  this._inStack.push(new Request('quit', null, null, callback));
};

Mplayer.prototype.loadFile = function(filename, append, callback) {
  this._inStack.push(new Request(
        'loadfile "' + filename + '" ' + append,
        'Starting playback...',
        'Failed to open ' + filename + '.',
        callback));
};

Mplayer.prototype.forcePause = function(callback) {
  if (!this._properties['pause'].value) {
    this._inStack.push(new Request('pause', null, null, callback));
  }
};

Mplayer.prototype.forceUnpause = function(callback) {
  if (this._properties['pause'].value) {
    this._inStack.push(new Request('pause', null, null, callback));
  }
};

Mplayer.prototype.songOver = function() {
  return (!isNaN(this._properties['time_pos'].value)
      && !isNaN(this._properties['length'].value)
      && this._properties['time_pos'].value >= this._properties['length'].value)
    || this._properties['filename'].value === undefined;
};

Mplayer.prototype.getFilename   = function() { return this._properties['filename'].value; };
Mplayer.prototype.getVolume     = function() { return this._properties['volume'].value; };
Mplayer.prototype.getTimePos    = function() { return this._properties['time_pos'].value; };
Mplayer.prototype.getLength     = function() { return this._properties['length'].value; };
Mplayer.prototype.getPause      = function() { return this._properties['pause'].value; };
Mplayer.prototype.setTimePos    = function(callback) { this._setProperty('time_pos', callback); };
Mplayer.prototype.setVolume     = function(callback) { this._setProperty('volume', callback); };

// vim: ft=javascript et sw=2 sts=2
