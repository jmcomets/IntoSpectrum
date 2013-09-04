// Control interface
function Controls(player) {
  // Volume control -> slider
  this.volumeSlider = $('#volume-progress').slider({
    'animate': 'fast',
    'orientation': 'vertical',
    'min': 0,
    'max': 100,
    'slide': function(ev, ui) {
      player.setVolume(ui.value);
    }
  });

  // Pause/Unpause -> same button
  this.pauseButton = $('#pause-control');

  // Stop -> button
  this.stopButton = $('#stop-control');

  // Track progress control
  this.trackSlider = $('#play-progress').slider({
    'orientation': 'horizontal',
    'disabled': true,
    'min': 0,
    'max': 242,
    'slide': function(value) {
      // TODO set song time
    }
  });

  // Pause/Unpause control
  this.pauseButton.on('click', function() { player.togglePause(); });

  // Stop control
  this.stopButton.on('click', function() { player.stop(); });

  // Player event hooks
  player.bind('play', function(song) {
    controls.play(song);
  }).bind('togglePause', function(paused) {
    controls.togglePause(paused);
  }).bind('stop', function() {
    controls.stop();
  }).bind('setVolume', function(volume) {
    controls.setVolume(volume);
  });
}

Controls.prototype.play = function(song) {
  // Update the play count
  $('[song-id="' + song.id + '"]').siblings().last().text(song.playCount);

  // Enable the pause control
  this.pauseButton.removeClass('disabled');

  // Switch the pause control to "play" state
  this.setPlayState(true);
};

// Toggle the pause control
Controls.prototype.togglePause = function(paused) {
  this.setPlayState(!paused);
};

Controls.prototype.stop = function() {
  this.pauseButton.addClass('disabled');
};

Controls.prototype.setVolume = function(volume) {
  this.volumeSlider.slider('value', volume);
};

Controls.prototype.setPlayState = function(playing) {
  if (playing) {
    this.pauseButton.find('.icon-play').hide();
    this.pauseButton.find('.icon-pause').show();
  } else {
    this.pauseButton.find('.icon-play').show();
    this.pauseButton.find('.icon-pause').hide();
  }
};

// vim: ft=javascript et sw=2 sts=2
