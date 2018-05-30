
const path = require('path');
const extractMediaQuery = require('postcss-extract-media-query');
const extractMediaQueryConfig = require('./postcss.config').plugins['postcss-extract-media-query'];

module.exports = function(grunt) {

    grunt.initConfig({
        clean: [path.join(__dirname, 'dist/*')],
        postcss: {
            options: {
                processors: [extractMediaQuery(extractMediaQueryConfig)]
            },
            dist: {
                src: path.join(__dirname, 'src/example.css'),
                dest: path.join(__dirname, 'dist/example.css')
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-postcss');

    grunt.registerTask('default', ['clean', 'postcss']);
};