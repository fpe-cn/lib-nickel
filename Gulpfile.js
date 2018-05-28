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
var _ = require('lodash');
var flatten = require('gulp-flatten');
var gutil = require('gulp-util');
var ejs = require('gulp-ejs');
var replace = require('gulp-replace');
var babelify = require('babelify');
var run = require('gulp-run');

gulp.task('css', function () {
    return gulp.src('sandbox/scss/*.scss')
        .pipe(sass({includePaths: ['./']}))
        .pipe(base64({
            baseDir: 'assets/scss',
            extensions: ['woff2'],
            maxImageSize: 500000,
            debug: false
        }))
        .pipe(autoprefixer())
        .pipe(gulp.dest('build/sandbox/css'))
});

gulp.task('css-external', function () {
    return gulp.src('sandbox/scss/external/*.scss')
        .pipe(sass({includePaths: ['./']}))
        .pipe(base64({
            baseDir: 'assets/scss',
            extensions: ['woff2'],
            maxImageSize: 500000,
            debug: false
        }))
        .pipe(autoprefixer())
        .pipe(gulp.dest('build/sandbox/css/external'))
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
gulp.task('img-sandbox', function () {
    return gulp.src(['sandbox/img/**'])
        .pipe(gulp.dest('build/sandbox/img'));
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
    return gulp.src([
        './assets/svg/**.svg',
        './assets/svg/social/**.svg'
    ])
        .pipe(iconfont({
            fontName: 'Lib-Nickel-Icon',
            normalize: true,
            formats: ['woff', 'woff2']
        }))
        .on('glyphs', function (glyphs) {
            gulp.src('./assets/scss/common/_fonticon.scss.template')
                .pipe(consolidate('lodash', {
                    glyphs: glyphs,
                    fontName: 'Lib-Nickel-Icon',
                    fontPath: 'font/',
                    className: 'icon'
                }))
                .pipe(rename('fonticon.scss'))
                .pipe(gulp.dest('assets/scss/common/'));
        })
        .pipe(gulp.dest('assets/font/'))
});

/*
 * WatchTask
 */

gulp.task('watch', function () {
    gulp.watch(['sandbox/**/*.html', 'assets/html/**/*.html'], ['html']);
    gulp.watch('sandbox/img/**', ['img']);
    gulp.watch(['sandbox/**/*.scss', 'assets/**/*.scss'], ['css']);
    gulp.watch(['sandbox/**/*.js', 'assets/**/*.js'], ['js']);
});

/*
 * WebServer
 */

gulp.task('webserver', function () {
    return gulp.src('./')
        .pipe(webserver({
            livereload: false,
            directoryListing: true,
            port: 8080,
            host: '0.0.0.0',
            open: '/build/sandbox/view/index.html'
        }))
});

gulp.task('run-test', function() {
    return run('npm test').exec();
});

/*
 * Tests : npm test
 */

// CUSTOM TASKS :

gulp.task('clean', function (cb) {
    del(['build'], cb);
});

gulp.task('compile', ['font', 'css', 'css-external', 'js', 'html', 'img-sandbox']);

gulp.task('build', function(cb) {
    runSequence('clean', ['fonticon'], 'compile', ['webserver', 'watch'], cb);
});

gulp.task('work', function(cb) {
    runSequence('run-test', ['font', 'css', 'css-external', 'js', 'html', 'img-sandbox'], ['webserver', 'watch'], cb)
});
gulp.task('default', ['work']);

/* GENERATE FILES FOR APP MOBILE */

var scssToJson = require('scss-to-json')
var path = require('path')
var file = require('gulp-file')

gulp.task('scss-to-json-colors', function () {
    var fileColors = scssToJson(path.resolve(__dirname, 'assets/scss/common/color.scss'))
    var colors = JSON.stringify(fileColors)
    colors = colors.replace(/\$color-/g, '') // suppression des $color-
    colors = colors.replace(/-*(\w)(\w*)/g, (match, p1, p2) => { // ajout des majuscules et suppression des tirets
        return p1.toUpperCase() + (p2 || "")
    })

    return file('colors.js', `export default Colors = ${colors}`, { src: true })
        .pipe(gulp.dest('assets/app-mobile/'))
})

// TODO : voir s'il n'y a pas moyen de faire plus simple pour la fonticon
gulp.task('create-fonticon', function () {
    return gulp.src([
        './assets/svg/**.svg',
        './assets/svg/social/**.svg'
    ]).pipe(iconfont({
        fontName: 'LibNickelIcon',
        prependUnicode: true,
        normalize: true,
        formats: ['ttf']
    })).on('glyphs', function (glyphs) {
        gulp.src('./assets/scss/common/_fonticon-mobile-2.scss.template')
            .pipe(consolidate('lodash', {
                glyphs: glyphs,
                fontName: 'LibNickelIcon',
                fontPath: 'font/',
                className: 'icon'
            }))
            .pipe(rename('NickelIcons.json'))
            .pipe(gulp.dest('assets/app-mobile/'));
    })
})
/* gulp.task('scss-to-js-fonticon', ['create-fonticon'], function () {
    setTimeout(function () {
        var fonticon = fs.readFileSync(path.resolve(__dirname, 'assets/app-mobile/fonticon-tmp.js'), 'utf8')
        fonticon = fonticon.replace(/(.*)\s*:/g, (match, p1) => {
            return match.replace(/-*(\w)(\w*)/g, (match, p1, p2) => {
                return p1.toUpperCase() + (p2 || "")
            })
        })

        return file('fonticon.js', `export default Icons = {\n${fonticon}\n}`, { src: true })
            .pipe(gulp.dest('assets/app-mobile/'));
    }, 200)
})

gulp.task('del-tmp', ['scss-to-json-fonticon'], function (cb) {
    setTimeout(function () {
        return del(['assets/app-mobile/fonticon-tmp.js'], cb)
    }, 200)
})

gulp.task('generate-js-to-scss', function (cb) {
    runSequence(['scss-to-json-colors'], 'del-tmp', cb)
}) */

/* END GENERATE FILES FOR APP MOBILE */




/** AUTOMATE RELEASE **/
var bump = require('gulp-bump');
var git = require('gulp-git');
var fs = require('fs');
var conventionalGithubReleaser = require('conventional-github-releaser');

gulp.task('github-release', function(done) {
    conventionalGithubReleaser({
        type: "oauth",
        token: process.env['GITHUB_TOKEN_LIB_NICKEL'],
        url: "https://api.github.com/"
    }, {
        preset: ''
    }, done);
});

gulp.task('bump-version', function () {
    return gulp.src(['./package.json'])
        .pipe(bump({type: "patch"}).on('error', gutil.log))
        .pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit('[Prerelease] Bumped version number'));
});

gulp.task('push-changes', function (cb) {
    git.push('origin', 'new-identity', cb); // TODO repasser en master quand new-identity deviendra la branche principale
});

gulp.task('create-new-tag', function (cb) {
    var version = getPackageJsonVersion();
    git.tag(version, 'Created Tag for version: ' + version, function (error) {
        if (error) {
            return cb(error);
        }
        git.push('origin', 'new-identity', {args: '--tags'}, cb); // TODO repasser en master quand new-identity deviendra la branche principale
    });

    function getPackageJsonVersion () {
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    };
});

gulp.task('release', function (callback) {
    runSequence(
        'bump-version',
        'commit-changes',
        'push-changes',
        'create-new-tag',
        'github-release',
        function (error) {
            if (error) {
                console.log(error.message);
            } else {
                console.log('RELEASE FINISHED SUCCESSFULLY');
            }
            callback(error);
        });
});