module.exports = function(grunt) {
  grunt.initConfig({
    'pkg': grunt.file.readJSON('package.json'),
    'concat': {
      'options': {
        'banner': '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      }, 'js': {
        'src': [
          'static/js/microevent.js',
          'static/js/clientplayer.js',
          'static/js/interface.js'
        ], 'dest': 'build/concat.js'
      }, 'css': {
        'src': ['static/css/*.css'],
        'dest': 'build/concat.css'
      }
    }, 'uglify': {
      'options': {
        'banner': '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      }, 'build': {
        'src': 'build/concat.js',
        'dest': 'public/js/main.js'
      }
    }, 'cssmin': {
      'options': {
        'banner': '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      }, 'css': {
        'src': 'build/concat.css',
        'dest': 'public/css/main.css'
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
};

// vim: ft=javascript et sw=2 sts=2
