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
    }, less: {
      all: [path.join(dirs.client, 'less', '**/*.less')],
      src: [path.join(dirs.client, 'less', 'main.less')],
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
    }, concat: {
      options: {
        separator: ';'
      }, dist: {
        src: files.js.all,
        dest: files.js.build
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
    }, less: {
      dist: {
        options: {
          yuicompress: true
        }, files: (function() {
          var ret = {};
          ret[files.less.dist] = files.less.src;
          return ret;
        })()
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
        tasks: ['concat', 'uglify'],
        interrupt: true
      }, less: {
        files: files.less.all,
        tasks: ['less'],
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
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-jade');

  grunt.registerTask('default', ['copy', 'concat', 'uglify', 'less', 'jade']);

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
