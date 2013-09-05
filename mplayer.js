var spawn = require('child_process').spawn;
    // EventEmitter = require('events').EventEmitter;

var mplayer_property = function(process,
        name,
        type, min, max,
        get, set,
        default_value) {
            this._process = process;
            this._name = name;
            this._type = type;
            this._min = min;
            this._max = max;
            this._get = get;
            this._set = set;

            if(default_value != undefined)
                this.set(default_value);
        };

mplayer_property.prototype.parse_data = function(data) {
  var word = 'ANS_' + this._name + '=';
  if (data.length > word
      && data.slice(0, word.length) == word) {
        if(this._type == 'float')
          this._value = parseFloat(data.slice(word.length));
        else if(this._type == 'int')
          this._value = parseInt(data.slice(word.length));
        else if(this._type == 'flag')
          this._value = data.slice(word.length) == 'yes';
        else if(this._type == 'string')
          this._value = data.slice(word.length);
        else if(this._type == 'pos')
          this._value = parseInt(data.slice(word.length));
        else if(this._type == 'time')
          this._value = parseInt(data.slice(word.length));
      }
};

mplayer_property.prototype.set = function(value) {
    if(!this._set)
        throw "The property `" + this._name
            + "` is not settable";

    if((typeof value == 'number'
          && this._type != 'int'
          && this._type != 'float'
          && this._type != 'pos'
          && this._type != 'time')
        || (typeof value == 'string' && this._type != 'string')
        || (typeof value == 'boolean' && this._type != 'flag'))
      throw "The type of the property `" + this._name
        + "` is " + this._type;

    if(this._min != undefined && value < this._min)
        throw "The property `" + this._name
            + "` can't be lower than " + this._min;

    if(this._max != undefined && value > this._max)
        throw "The property `" + this._name
            + "` can't be greater than " + this._max;

    this._process.stdin.write("set_property " + this._name + " value\n");
    this._value = value;
};

mplayer_property.prototype.get = function() {
    if(!this._get)
        throw "The property `" + this._name
            + "` is not gettable";

    this._process.stdin.write("get_property " + this._name + "\n");
};

var mplayer = function() {
    // Spawn new process with appropriate file
    this._process = spawn('mplayer', ['-slave', '-idle', '-quiet', 'media/Queen/01. We Will Rock You - Queen - Absolute - .mp3']);

    // List of all properties
    this._properties = new Array();

    this.osdlevel = this.add_property('osdlevel',
        'int', 0, 3, true, true);
    this.speed = this.add_property('speed',
        'float', 0.01, 100, true, true);
    this.loop = this.add_property('loop',
        'int', -1, undefined, true, true, -1); // -1 = no loop, 0 = loop
    this.pause = this.add_property('pause',
        'flag', undefined, undefined, true, false);
    this.filename = this.add_property('filename',
        'string', undefined, undefined, true, false);
    this.path = this.add_property('path',
        'string', undefined, undefined, true, false);
    this.demuxer = this.add_property('demuxer',
        'string', undefined, undefined, true, false);
    this.stream_pos = this.add_property('stream_pos',
        'pos', 0, undefined, true, true);
    this.stream_start = this.add_property('stream_start',
        'pos', 0, undefined, true, false);
    this.stream_end = this.add_property('stream_end',
        'pos', 0, undefined, true, false);
    this.stream_length = this.add_property('stream_length',
        'pos', 0, undefined, true, false);
    this.stream_time_pos = this.add_property('stream_time_pos',
        'time', 0, undefined, true, false);
    this.chapter = this.add_property('chapter',
        'int', 0, undefined, true, true);
    this.chapters = this.add_property('chapters',
        'int', undefined, undefined, true, false);
    this.angle = this.add_property('angle',
        'int', 0, undefined, true, true);
    this.length = this.add_property('length',
        'time', undefined, undefined, true, false);
    this.percent_pos = this.add_property('percent_pos',
        'int', 0, 100, true, true);
    this.time_pos = this.add_property('time_pos',
        'time', 0, undefined, true, true);
    this.metadata = this.add_property('metadata',
        'string', undefined, undefined, true, false);
    this.volume = this.add_property('volume',
        'float', 0, 100, true, true);
    this.balance = this.add_property('balance',
        'float', -1, 1, true, true);
    this.mute = this.add_property('mute',
        'flag', undefined, undefined, true, true);
    this.audio_delay = this.add_property('audio_delay',
        'float', -100, 100, true, true);
    this.audio_format = this.add_property('audio_format',
        'int', undefined, undefined, true, false);
    this.audio_codec = this.add_property('audio_codec',
        'string', undefined, undefined, true, false);
    this.audio_bitrate = this.add_property('audio_bitrate',
        'int', undefined, undefined, true, false);
    this.samplerate = this.add_property('samplerate',
        'int', undefined, undefined, true, false);
    this.channels = this.add_property('channels',
        'int', undefined, undefined, true, false);
    this.switch_audio = this.add_property('switch_audio',
        'int', -2, 255, true, true);
    this.switch_angle = this.add_property('switch_angle',
        'int', -2, 255, true, true);
    this.switch_title = this.add_property('switch_title',
        'int', -2, 255, true, true);
    this.capturing = this.add_property('capturing',
        'flag', undefined, undefined, true, true);
    this.fullscreen = this.add_property('fullscreen',
        'flag', undefined, undefined, true, true);
    this.deinterlace = this.add_property('deinterlace',
        'flag', undefined, undefined, true, true);
    this.ontop = this.add_property('ontop',
        'flag', undefined, undefined, true, true);
    this.rootwin = this.add_property('rootwin',
        'flag', undefined, undefined, true, true);
    this.border = this.add_property('border',
        'flag', undefined, undefined, true, true);
    this.framedropping = this.add_property('framedropping',
        'int', 0, 2, true, true);
    this.gamma = this.add_property('gamma',
        'int', -100, 100, true, true);
    this.brightness = this.add_property('brightness',
        'int', -100, 100, true, true);
    this.contrast = this.add_property('contrast',
        'int', -100, 100, true, true);
    this.saturation = this.add_property('saturation',
        'int', -100, 100, true, true);
    this.hue = this.add_property('hue',
        'int', -100, 100, true, true);
    this.panscan = this.add_property('panscan',
        'float', 0, 1, true, true);
    this.vsync = this.add_property('vsync',
        'flag', undefined, undefined, true, true);
    this.video_format = this.add_property('metadata',
        'int', undefined, undefined, true, false);
    this.video_codec = this.add_property('video_codec',
        'string', undefined, undefined, true, false);
    this.video_bitrate = this.add_property('video_bitrate',
        'int', undefined, undefined, true, false);
    this.width = this.add_property('width',
        'int', undefined, undefined, true, false);
    this.height = this.add_property('height',
        'int', undefined, undefined, true, false);
    this.fps = this.add_property('fps',
        'float', undefined, undefined, true, false);
    this.aspect = this.add_property('aspect',
        'float', undefined, undefined, true, false);
    this.switch_video = this.add_property('switch_video',
        'int', -2, 255, true, true);
    this.switch_program = this.add_property('switch_program',
        'int', -1, 65535, true, true);
    this.sub = this.add_property('sub',
        'int', -1, undefined, true, true);
    this.sub_source = this.add_property('sub_source',
        'int', -1, 2, true, true);
    this.sub_file = this.add_property('sub_file',
        'int', -1, undefined, true, true);
    this.sub_vob = this.add_property('sub_vob',
        'int', -1, undefined, true, true);
    this.sub_demux = this.add_property('sub_demux',
        'int', -1, undefined, true, true);
    this.sub_delay = this.add_property('sub_delay',
        'float', undefined, undefined, true, true);
    this.sub_pos = this.add_property('sub_pos',
        'int', 0, 100, true, true);
    this.sub_alignment = this.add_property('sub_alignment',
        'int', 0, 2, true, true);
    this.sub_visibility = this.add_property('sub_visibility',
        'flag', undefined, undefined, true, true);
    this.sub_forced_only = this.add_property('sub_forced_only',
        'flag', undefined, undefined, true, true);
    this.sub_scale = this.add_property('sub_scale',
        'float', 0, 100, true, true);
    this.tv_brightness = this.add_property('tv_brightness',
        'int', -100, 100, true, true);
    this.tv_contrast = this.add_property('tv_contrast',
        'int', -100, 100, true, true);
    this.tv_saturation = this.add_property('tv_saturation',
        'int', -100, 100, true, true);
    this.tv_hue = this.add_property('tv_hue',
        'int', -100, 100, true, true);
    this.teletext_page = this.add_property('teletext_page',
        'int', 0, 799, true, true);
    this.teletext_subpage = this.add_property('teletext_subpage',
        'int', 0, 64, true, true);
    this.teletext_mode = this.add_property('teletext_mode',
        'flag', undefined, undefined, true, true);
    this.teletext_format = this.add_property('teletext_format',
        'int', 0, 3, true, true);
    this.teletext_half_page = this.add_property('teletext_half_page',
        'int', 0, 2, true, true);

    var self = this;
    this._process.stdout.on('data', function(data) {
      var lines = (new String(data)).split('\n');
      for(var i = 0 ; i < lines.length ; i++) {
        var data = lines[i];
        console.log('STDOUT : ' + data);

        for(var j in self._properties) {
          self._properties[j].parse_data(data);
        }
      }
    });

    this.update_all();
};

mplayer.prototype.update_all = function() {
  for(var j in this._properties) {
    this._properties[j].get();
  }
};

mplayer.prototype.add_property = function(name,
        type, min, max,
        get, set,
        default_value) {
          var prop = new mplayer_property(this._process,
              name,
              type, min, max,
              get, set,
              default_value);
          this._properties.push(prop);
          return prop;
        };

// mplayer.prototype.__proto__ = EventEmitter.prototype;

var m = new mplayer();

// vim: ft=javascript et sw=2 sts=2
