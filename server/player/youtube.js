var spawn = require('child_process').spawn;

exports.play = function(url, success, error) {
  var process = spawn('youtube-dl', ['--get-url', '--cookies' , '/tmp/cookie.txt', url]);

  process.stdout.on('data', function(_data) {
    var data = new String(_data);
    process.kill();
    if (success !== undefined) {
      success(data.split('\n')[0]);
    }
  });

  process.stderr.on('data', function(data) {
    process.kill();
    if (error !== undefined) {
      error(data);
    }
  });
};

// vim: ft=javascript et sw=2 sts=2
