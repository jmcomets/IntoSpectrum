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
    return this._checked_out || this._checked_err;
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
};

mplayer.prototype.start = function() {
    if(this._proc_opened || this._proc_opening)
        return;

    var self = this;
    this._proc_opening = true;
    this._process = spawn('mplayer', ['-slave', '-idle', '-quiet', '-softvol', '-nolirc', '../media/Let It Bleed/10 - Honky Tonk Woman(Single).mp3']);

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
    this._in_fifo.push(new request('pausing_keep_force get_property ' + prop,
        'ANS_' + prop + '=',
        'Failed to get value of property \'' + prop + '\'',
        on_finish));
};

mplayer.prototype._set_property = function(prop, value, on_finish) {
    this._in_fifo.push(new request(
        'pausing_keep_force set_property ' + prop + ' ' + value,
        null,
        null,
        on_finish));
};

var player = new mplayer();
player.start();

player._get_property('pause', function(data) {
    console.log('pause done: ' + data);
});

player._get_property('length', function(data) {
    console.log('length done: ' + data);
});

player._get_property('pause', function(data) {
    console.log('pause2 done: ' + data);
});

player._get_property('filename', function(data) {
    console.log('filename done: ' + data);
});
player._set_property('pause', 1, function(data) {
    console.log('pause3 done: ' + data);
});
player._set_property('volume', 10, function(data) {
    console.log('volume done: ' + data);
});
player._get_property('volume', function(data) {
    console.log('volume2 done: ' + data);
});

// vim: ft=javascript et sw=2 sts=2
