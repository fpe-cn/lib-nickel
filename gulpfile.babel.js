'use strict';
import gulp from 'gulp';
import uglify from 'gulp-uglify-es';
import gutil from 'gulp-util';
import del from 'del';
import gulpLoadPlugins from "gulp-load-plugins";
import tildeImporter from 'node-sass-tilde-importer';
import { externalStyles } from './gulp-tasks/sass';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import glob from 'glob';
import eventStream from 'event-stream';
import watchify from 'watchify';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import conventionalGithubReleaser from 'conventional-github-releaser';
import bump from "gulp-bump";
import git from "gulp-git";

const $ = gulpLoadPlugins();
const paths = {
    html: {
        src: ['sandbox/**/*.html', '!sandbox/**/_*.html'],
        dest: 'build/sandbox'
    },
    imgSandbox: {
        src: 'sandbox/img/**',
        dest: 'build/sandbox/img'
    },
    img: {
        src: 'assets/img/**',
        dest: 'build/sandbox/img/'
    },
    font: {
        src: ['assets/font/**.*'],
        dest: 'build/sandbox/font/'
    },
    fonticon: {
        src: ['assets/svg/**.svg', 'assets/svg/social/**.svg'],
        template: 'assets/scss/common/_fonticon.scss.template',
        targetPath: '../scss/common/fonticon.scss',
        destStyle: 'assets/scss/common/',
        dest: 'assets/font/'
    },
    styles: {
        src: 'sandbox/scss/*.scss',
        dest: 'build/sandbox/css'
    },
    scripts: {
        src: 'sandbox/js/*.js',
        dest: 'build/sandbox/js'
    },
    faq: {
        src: 'assets/scss/common/fonticon.scss',
        dest: 'dist/css/external'
    },
    bump: {
        src: path.resolve(__dirname, './package.json'),
        dest: path.resolve(__dirname)
    }
};

export function html() {
    return gulp.src(paths.html.src)
        .pipe($.ejs({}))
        .on('error', function(err) {
            gutil.log(err);
            this.emit('end'); // end this stream
        })
        .pipe(gulp.dest(paths.html.dest));
}
export function imgSandbox () {
    return gulp.src(paths.imgSandbox.src)
        .pipe(gulp.dest(paths.imgSandbox.dest));
}
export function images () {
    return gulp.src(paths.img.src)
        .pipe($.imagemin())
        .pipe(gulp.dest(paths.img.src))
}
export function font () {
    return gulp.src(paths.font.src)
        .pipe(gulp.dest(paths.font.dest));
}
export function fonticon () {
    return gulp.src(paths.fonticon.src)
        .pipe($.iconfontCss({
            fontName: 'Lib-Nickel-Icon', // The name that the generated font will have
            path: paths.fonticon.template, // The path to the template that will be used to create the SASS/LESS/CSS file
            targetPath: paths.fonticon.targetPath, // The path where the file will be generated
            fontPath: 'font/' // The path to the icon font file
        }))
        .pipe($.iconfont({
            fontName: 'Lib-Nickel-Icon',
            prependUnicode: false,
            normalize: true,
            formats: ['woff', 'woff2']
        }))
        .pipe(gulp.dest(paths.fonticon.dest));
}
export function styles () {
    return gulp.src(paths.styles.src)
        .pipe($.wait(500))
        .pipe($.sass({includePaths: ['./', './node_modules'], importer: tildeImporter}).on('err', $.sass.logError))
        .pipe($.base64({
            baseDir: 'assets/scss',
            extensions: ['woff2'],
            maxImageSize: 500000,
            debug: false
        }))
        .pipe($.autoprefixer())
        .pipe(gulp.dest(paths.styles.dest))
}
export function faq () {
    return gulp.src(paths.faq.src)
        .pipe($.sass({includePaths: ['./'], importer: tildeImporter}))
        .pipe($.base64())
        .pipe($.autoprefixer())
        .pipe(gulp.dest(paths.faq.dest))
}
export function scripts (done) {
    bundleAllJsFile(done, {watchify: false});
}
export function scriptsWatchify (done) {
    bundleAllJsFile(done, {watchify: true});
}

const bundleAllJsFile = (done, options) => {
    const files = glob.sync(paths.scripts.src);
    const tasks = _.map(files, function(file) {
        return bundleJsFile(file, options)
    });

    eventStream.merge(tasks).on('end', done);
};
const bundleJsFile = (file, options) => {
    const customOpts = {
        entries: [file],
        debug: true
    };
    const opts = _.assign({}, watchify.args, customOpts);
    let bundler = browserify(opts);

    if (options.watchify) bundler = watchify(bundler);

    bundler.on('update', bundle);
    bundler.on('log', gutil.log);

    bundler = bundler.transform(babelify.configure({
        presets: ["@babel/preset-env"]
    }));

    function bundle() {
        gutil.log('building js file ' + file);

        const task = bundler.bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source(file))
            .pipe($.streamify(uglify())).on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
            .pipe($.flatten());

        return task.pipe(gulp.dest(paths.scripts.dest));
    }

    return bundle();
};

export function watch () {
    gulp.watch(['sandbox/**/*.html', 'assets/html/**/*.html'], html);
    gulp.watch('sandbox/img/**', images);
    gulp.watch(['sandbox/**/*.scss', 'assets/**/*.scss'], styles);
    gulp.watch(['sandbox/**/*.js', 'assets/**/*.js'], scripts);
}
export function server () {
    return gulp.src('./')
        .pipe($.webserver({
            livereload: false,
            directoryListing: true,
            port: 8080,
            host: '0.0.0.0',
            open: '/build/sandbox/view/index.html'
        }))
}
export function tests() {
    return $.run('npm test').exec();
}

const compile = gulp.series(font, styles, externalStyles, scripts, html, imgSandbox)
export const clean = () => del([ 'build' ]);
export function build(done) {
    return gulp.series(gulp.series(clean), fonticon, 'compile')(done);
}
export function work(done) {
    return gulp.series(tests,
        fonticon,
        gulp.parallel(font, styles, externalStyles, scripts, html, imgSandbox),
        gulp.parallel(server, watch)
    )(done)
}

gulp.task('clean', gulp.series(clean));
gulp.task('compile', compile);
gulp.task('build', build);
gulp.task('webserver', gulp.series(server, watch));
gulp.task('work', work);
gulp.task('faq', faq);

const API_GITHUB_ENDPOINT = 'https://api.github.com/';

export function authenticate (done) {
    conventionalGithubReleaser({
        type: "oauth",
        token: process.env['GITHUB_TOKEN_LIB_NICKEL'],
        url: API_GITHUB_ENDPOINT
    }, {
        preset: ''
    }, done);
}
export function version () {
    return gulp.src(paths.bump.src)
        .pipe(bump({type: "patch"}).on('error', gutil.log))
        .pipe(gulp.dest(paths.bump.dest));
}
export function commit () {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit('[Prerelease] Bumped version number'));
}
export function push (cb) {
    git.push('origin', 'new-identity', cb); // TODO repasser en master quand new-identity deviendra la branche principale
}
export function tag (cb) {
    const version = getPackageJsonVersion();
    git.tag(version, 'Created Tag for version: ' + version, function (error) {
        if (error) {
            return cb(error);
        }
        git.push('origin', 'new-identity', {args: '--tags'}, cb); // TODO repasser en master quand new-identity deviendra la branche principale
    });

    function getPackageJsonVersion () {
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    }
}
export function release (callback) {
    return gulp.series(
        version,
        commit,
        push,
        tag,
        authenticate,
        function (error) {
            if (error) {
                console.log(error.message);
            } else {
                console.log('RELEASE FINISHED SUCCESSFULLY');
            }
            callback(error);
        })(callback);
}

gulp.task('release', release);
