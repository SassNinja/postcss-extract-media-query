
const path = require('path');
const sass = require('node-sass');
const extractMediaQuery = require('postcss-extract-media-query');
const extractMediaQueryConfig = require('./postcss.config').plugins['postcss-extract-media-query'];

module.exports = function(grunt) {

    grunt.initConfig({
        clean: [path.join(__dirname, 'dist/*')],
        sass: {
            options: {
                sourceMap: false,
                sourceMapEmbed: true,
                implementation: sass
            },
            dist: {
                files: {
                    'dist/example.css': 'src/example.scss'
                }
            }
        },
        postcss: {
            options: {
                map: true,
                processors: [extractMediaQuery(extractMediaQueryConfig)]
            },
            dist: {
                files: {
                    'dist/example.css': 'dist/example.css'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-postcss');

    grunt.registerTask('default', ['clean', 'sass', 'postcss']);
};