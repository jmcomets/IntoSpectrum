module.exports = function(grunt) {
  var files = {
    js: ['client/js/**/*.js'],
    css: ['client/css/**/*.css'],
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      }, dist: {
        src: files.js,
        dest: 'public/js/main.js'
      }
    }, cssmin: {
      minify: {
        src: files.css,
        dest: 'public/css/main.css'
      }
    }, watch: {
      js: {
        files: files.js,
        tasks: ['concat'],
        interrupt: true
      }, css: {
        files: files.css,
        tasks: ['cssmin'],
        interrupt: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('default', ['concat', 'cssmin']);

  // Development only
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('dev', 'Run the development server', function() {
    grunt.task.run('default');
    grunt.util.spawn({
      cmd: 'npm',
      args: ['start'],
      opts: {
        stdio: ['pipe', process.stdout, process.stderr]
      }
    });
    grunt.task.run('watch');
  });
};
