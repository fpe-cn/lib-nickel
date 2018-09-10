import gulp from 'gulp';
import gulpLoadPlugins from "gulp-load-plugins";
import scssToJson from 'scss-to-json';
import path from 'path';

const $ = gulpLoadPlugins();
const BASEPATH_APP = 'assets/app-mobile/';
const paths = {
    colors: {
        src: path.resolve(__dirname, 'assets/scss/common/color.scss'),
        file: 'colors.js',
        dest: path.resolve(__dirname, BASEPATH_APP)
    },
    fonticon: {
        src: [path.resolve(__dirname, 'assets/svg/**.svg'), path.resolve(__dirname, 'assets/svg/social/**.svg')],
        template: path.resolve(__dirname, 'assets/scss/common/_fonticon-mobile.scss.template'),
        tmp: 'fonticon-tmp.js',
        dest: path.resolve(__dirname, BASEPATH_APP)
    },
};

export function scssToJsonColors () {
    const fileColors = scssToJson(paths.colors.src);
    let colors = JSON.stringify(fileColors);
    colors = colors.replace(/\$color-/g, ''); // suppression des $color-
    colors = colors.replace(/-*(\w)(\w*)/g, (match, p1, p2) => { // ajout des majuscules et suppression des tirets
        return p1.toUpperCase() + (p2 || "")
    });

    return $.file(paths.colors.file, `const Colors = ${colors}\nexport default Colors`, { src: true })
        .pipe(gulp.dest(paths.colors.dest))
}

export function createFonticon () {
    return gulp.src(paths.fonticon.src).pipe($.iconfont({
        fontName: 'LibNickelIcon',
        normalize: true,
        formats: ['ttf']
    })).on('glyphs', function (glyphs) {
        gulp.src(paths.fonticon.template)
            .pipe($.consolidate('lodash', {
                glyphs: glyphs,
                fontName: 'LibNickelIcon',
                fontPath: 'font/',
                className: 'icon'
            }))
            .pipe($.rename(paths.fonticon.tmp))
            .pipe(gulp.dest(paths.fonticon.dest));
    })
}

export function scssToJsonFonticon () {
    setTimeout(function () {
        let fonticon = fs.readFileSync(path.resolve(__dirname, `${BASEPATH_APP}${paths.fonticon.tmp}`), 'utf8');
        fonticon = fonticon.replace(/(.*)\s*:/g, match => {
            return match.replace(/-*(\w)(\w*)/g, (match, p1, p2) =>
                p1.toUpperCase() + (p2 || ""))
        });

        return $.file('fonticon.js', `const Icons = {\n${fonticon}\n}\nexport default Icons`, { src: true })
            .pipe(gulp.dest(paths.fonticon.dest));
    }, 200)
}

/*
import del from 'del';
gulp.task('del-tmp', ['scss-to-js-fonticon'], function (cb) {
    setTimeout(function () {
        return del(['../assets/app-mobile/fonticon-tmp.js'], cb)
    }, 200)
}); */

export function generateJsToScss() {
    gulp.series(scssToJsonColors, createFonticon, scssToJsonFonticon)
}
gulp.task('generate-js-to-scss', generateJsToScss);
