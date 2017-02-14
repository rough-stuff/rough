module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    "babel": {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          "dist/<%= pkg.name %>.js": "src/rough-canvas.js"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['babel']);
};