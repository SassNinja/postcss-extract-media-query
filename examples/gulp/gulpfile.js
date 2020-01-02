
const path = require('path');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

function clean() {
    return gulp.src(path.join(__dirname, 'dist/*'))
        .pipe($.deleteFile({
            deleteMatch: true
        }));
}

function sass() {
    return gulp.src(['src/example.scss'])
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.postcss())
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

gulp.task('default', gulp.series(
    clean,
    sass
));