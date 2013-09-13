module.exports = function(grunt) {
  var jsFiles = ['static/js/microevent.js', 'static/js/clientplayer.js', 'static/js/interface.js'];
  grunt.initConfig({
    'pkg': grunt.file.readJSON('package.json'),
    'jshint': {
      'files': jsFiles,
      'options': {
        'globals': {
          'jQuery': true,
          'console': true
        }
      }
    }, 'concat': {
      'js': {
        'src': jsFiles, 'dest': 'build/concat.js'
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
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'cssmin']);
};

// vim: ft=javascript et sw=2 sts=2
