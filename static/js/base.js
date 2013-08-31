// Our player instance
var player = new Player('/player');

// Event hooks
player.on('play', function() {
    console.log('play event');
}).on('pause', function() {
    console.log('pause event');
}).on('stop', function() {
    console.log('stop event');
});
