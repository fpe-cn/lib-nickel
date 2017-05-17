var gulp = require('gulp');
var sass = require('gulp-sass');
var webserver = require('gulp-webserver');
var autoprefixer = require('gulp-autoprefixer');
var runSequence = require('run-sequence');
var del = require('del');
var iconfont = require('gulp-iconfont');
var consolidate = require("gulp-consolidate");
var rename = require('gulp-rename');
var base64 = require('gulp-base64');
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var glob = require('glob');
var eventStream = require('event-stream');
var watchify = require('watchify');
var mocha = require('gulp-mocha');
var _ = require('lodash');
var flatten = require('gulp-flatten');
var gutil = require('gulp-util');
var ejs = require('gulp-ejs');
var replace = require('gulp-replace');
var babelify = require('babelify');
var babelRegister = require('babel-register');

gulp.task('css', function () {
    return gulp.src('sandbox/scss/*.scss')
        .pipe(sass({includePaths: ['./']}))
        .pipe(base64({
            baseDir: 'assets/scss',
            extensions: ['woff'],
            maxImageSize: 500000,
            debug: false
        }))
        .pipe(autoprefixer())
        .pipe(gulp.dest('build/sandbox/scss'))
});

gulp.task('html', function () {
    return gulp.src(['sandbox/**/*.html', '!sandbox/**/_*.html'])
        .pipe(ejs({}))
        .on('error', function(err) {
            gutil.log(err);
            this.emit('end'); // end this stream
        })
        .pipe(gulp.dest('build/sandbox'));
});

gulp.task('js', function (done) {
    bundleAllJsFile(done, {watchify: false});
});

gulp.task('js-watchify', function (done) {
    bundleAllJsFile(done, {watchify: true});
});

var bundleAllJsFile = function(done, options) {
    var files = glob.sync('sandbox/js/*.js');

    var tasks = _.map(files, function(file) {
        return bundleJsFile(file, options)
    });

    eventStream.merge(tasks).on('end', done);
};

var bundleJsFile = function(file, options) {
    var customOpts = {
        entries: [file],
        debug: true,
        extensions: ['.js', '.es6']
    };

    var opts = _.assign({}, watchify.args, customOpts);
    var bundler = browserify(opts);

    if (options.watchify) {
        bundler = watchify(bundler);
    }

    bundler.on('update', bundle);
    bundler.on('log', gutil.log);

    // https://www.npmjs.com/package/babelify
    bundler = bundler.transform(babelify, {presets: ["es2015"], extensions: [".es6"]});

    function bundle() {
        gutil.log('building js file ' + file);

        var task = bundler.bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source(file))
            .pipe(flatten());

        return task.pipe(gulp.dest('build/sandbox/js'));
    }

    return bundle();
};

gulp.task('img', function () {
    return gulp.src('assets/img/**')
        .pipe(imagemin())
        .pipe(gulp.dest('build/sandbox/img/'))
});

gulp.task('font', function () {
    return gulp.src(['assets/font/*.*'])
        .pipe(gulp.dest('build/sandbox/font/'))
});

gulp.task('fonticon', function () {
    return buildFontIcon({name: 'Lib-Nickel-Icon', scssFile: '_fonticon.scss'}, [
        'assets/svg/**/*.svg'
    ]);
});

var buildFontIcon = function(options, src) {
    return gulp.src(src)
        .pipe(iconfont({
            fontName: options.name,
            normalize: true,
            formats: ['ttf', 'eot', 'woff', 'woff2']
        }))
        .on('glyphs', function (glyphs) {
            gulp.src('assets/svg/_fonticon.scss.template')
                .pipe(consolidate('lodash', {
                    glyphs: glyphs,
                    fontName: options.name,
                    fontPath: '../font/',
                    className: options.className || 'icon'
                }))
                .pipe(rename(options.scssFile))
                .pipe(gulp.dest('assets/scss/'));
        })
        .pipe(gulp.dest('assets/font/'))
};

/*
 * WatchTask
 */

gulp.task('watch', function () {
    gulp.watch(['sandbox/**/*.html', 'assets/**/*.html'], ['html']);
    gulp.watch('sandbox/img/**', ['img']);
    gulp.watch(['sandbox/**/*.scss', 'assets/**/*.scss'], ['css']);
});

/*
 * WebServer
 */

gulp.task('webserver', function () {
    return gulp.src('./')
        .pipe(webserver({
            livereload: false,
            directoryListing: true,
            port: 8282,
            host: '0.0.0.0',
            open: '/build/sandbox/view/index.html'
        }))
});

/*
 * Tests
 */

gulp.task('test', function () {
    return gulp.src(['test/**/*-test.js', 'test/**/*-test.es6'])
        .pipe(mocha({compilers: {
            js: babelRegister
        }}))
        .once('end', function () {
            process.exit();
        });
});

// CUSTOM TASKS :

gulp.task('clean', function (cb) {
    del(['build'], cb);
});

gulp.task('compile', ['img', 'css', 'font', 'sprite', 'js', 'html']);

gulp.task('build', function(cb) {
    runSequence('clean', 'compile', cb);
});

//gulp.task('work', ['img', 'scss', 'font', 'sprite', 'js-watchify', 'html', 'webserver', 'watch']);
gulp.task('work', function(cb) {
    runSequence(['font', 'css', 'html'], ['webserver', 'watch'], cb)
});
gulp.task('default', ['work']);