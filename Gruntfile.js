var path = require('path');

module.exports = function(grunt) {
  // Directories
  var dirs = {
    client: 'client',
    public: 'public',
    build: 'build'
  };
  // ...files
  var files = {
    img: {
      src: path.join(dirs.client, 'img'),
      dist: path.join(dirs.public, 'img')
    }, js: {
      all: [path.join(dirs.client, 'js', '**/*.js')],
      build: path.join(dirs.build, 'js', 'main.js'),
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
    clean: [dirs.public, dirs.build],
    copy: {
      img: {
        expand: true,
        cwd: files.img.src,
        src: '**',
        dest: files.img.dist,
        flatten: true,
      }
    }, concat_in_order: {
      dist: {
        options: {
        }, files: (function() {
          var ret = {};
          ret[files.js.build] = files.js.all;
          return ret;
        })()
      }
    }, uglify: {
      options: {
        mangle: false
      }, dist: {
        files: (function() {
          var ret = {};
          ret[files.js.dist] = files.js.build;
          return ret;
        })()
      }
    }, cssmin: {
      dist: {
        src: files.css.all,
        dest: files.css.dist
      }
    }, jade: {
      dist: {
        files: (function() {
          var ret = {};
          ret[files.html.index] = files.jade.index;
          return ret;
        })()
      }
    }, watch: {
      js: {
        files: files.js.all,
        tasks: ['concat_in_order', 'uglify'],
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
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-concat-in-order');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.registerTask('default', ['copy', 'concat_in_order', 'uglify', 'cssmin', 'jade']);

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
