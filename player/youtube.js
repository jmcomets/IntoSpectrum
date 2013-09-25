var spawn = require('child_process').spawn;

exports.get_link = function(url, success, error) {
    var process = spawn('youtube-dl', ['--get-url', '-cookies' , '/tmp/cookie.txt', url]);

    console.log(url);

    process.stdout.on('data', function(data) {
        process.kill();

        if(success != undefined) {
            success(String(data).split('\n')[0]);
        }
    });
    process.stderr.on('data', function(data) {
        process.kill();

        if(error != undefined) {
            error(data);
        }
    });
};

// vim: ft=javascript et sw=2 sts=2
