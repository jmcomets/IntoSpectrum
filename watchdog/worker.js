var fs = require('fs');

// Handle incoming messages
process.on('message', function(msg, obj) {
  if (msg == 'run') {
    obj.send('started');
    sleep(4.2);
    obj.send('finished');
  } else {
    throw new Error('Unhandled message ' + msg);
  }
});

// vim: ft=javascript et sw=2 sts=2
