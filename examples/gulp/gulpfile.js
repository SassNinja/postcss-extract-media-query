
const path = require('path');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const extractMediaQuery = require('postcss-extract-media-query');

function clean() {
    return gulp.src(path.join(__dirname, 'dist/*'))
        .pipe($.deleteFile({
            deleteMatch: true
        }));
}

function css() {
    return gulp.src(path.join(__dirname, 'src/*.css'))
        .pipe($.postcss())
        .pipe(gulp.dest(path.join(__dirname, 'dist')));
}

gulp.task('default', gulp.series(
    clean,
    css
));