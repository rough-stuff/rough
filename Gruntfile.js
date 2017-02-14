module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    "rollup": {
      options: {},
      files: {
        'dest': "dist/<%= pkg.name %>.es6.js",
        'src': "src/rough-canvas.js"
      },
    },

    "babel": {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          "dist/<%= pkg.name %>.js": "dist/<%= pkg.name %>.es6.js"
        }
      }
    },

    'uglify': {
      options: {
        sourceMap: true,
        mangle: true,
        compress: true
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-rollup');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['rollup', 'babel', 'uglify']);
};