var path = require('path');

module.exports = function(grunt) {
  // Directories
  var dirs = {
    client: 'client',
    public: 'public',
  };
  // ...files
  var files = {
    img: {
      src: path.join(dirs.client, 'img'),
      dist: path.join(dirs.public, 'img')
    }, js: {
      all: [path.join(dirs.client, 'js', '**/*.js')],
      dist: path.join(dirs.public, 'js', 'main.js')
    }, css: {
      all: [path.join(dirs.client, 'css', '**/*.css')],
      dist: path.join(dirs.public, 'css', 'main.css')
    },
    jade: { index: path.join(dirs.client, 'index.jade') },
    html: { index: path.join(dirs.public, 'index.html') }
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON(path.join(__dirname, 'package.json')),
    clean: [dirs.public],
    copy: {
      img: {
        expand: true,
        cwd: files.img.src,
        src: '**',
        dest: files.img.dist,
        flatten: true,
      }
    }, concat: {
      options: {
        separator: ';'
      }, dist: {
        src: files.js.all,
        dest: files.js.dist
      }
    }, cssmin: {
      dist: {
        src: files.css.all,
        dest: files.css.dist
      }
    }, jade: {
      compile: {
        files: function() {
          var ret = {};
          ret[files.html.index] = files.jade.index;
          return ret;
        }()
      }
    }, watch: {
      js: {
        files: files.js.all,
        tasks: ['concat'],
        interrupt: true
      }, css: {
        files: files.css.all,
        tasks: ['cssmin'],
        interrupt: true
      }, jade: {
        files: [files.jade.index],
        tasks: ['jade']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.registerTask('default', ['copy', 'concat', 'cssmin', 'jade']);

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
