import gulp from 'gulp';
import gulpLoadPlugins from "gulp-load-plugins";
import path from 'path';

const $ = gulpLoadPlugins();
const paths = {
    external: {
        src: path.resolve(__dirname, 'sandbox/scss/external/*.scss'),
        dest: path.resolve(__dirname, 'build/sandbox/css/external')
    }
}

export function externalStyles () {
    return gulp.src(paths.external.src)
        .pipe($.sass({includePaths: ['./']}))
        .pipe($.base64({
            baseDir: 'assets/scss',
            extensions: ['woff2'],
            maxImageSize: 500000,
            debug: false
        }))
        .pipe($.autoprefixer())
        .pipe(gulp.dest(paths.external.dest))
}
