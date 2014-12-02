var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var filter = require('gulp-filter');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var plumber = require('gulp-plumber');

// sass, scss
var compass = require('gulp-compass');

// images
var imagemin = require('gulp-imagemin');
var pngcrush = require('imagemin-pngcrush');

// concat, minify
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var filesize = require('gulp-filesize');
var domSrc = require('gulp-dom-src');
var cheerio = require('gulp-cheerio');
var clean = require('gulp-clean');
var runSequence = require('run-sequence');

// inject
var inject = require("gulp-inject");
var htmlbuild = require('gulp-htmlbuild'); // 字串寫入

var es = require('event-stream');

var basePath = path.join(__dirname) + '/';

// 用絕對路徑會導致gulp-watch對新增檔案的監聽會失效..@@
var filefolder = {
    'base': '/',
    'img': 'img/**/*',
    'js': {
        'all': 'js/**/*.js',
        'lib': 'js/lib/**/*',
        'script': 'js/script/**/*',
        'vendor': 'js/vendor/**/*'
    },
    'html': 'html/**/*.html',
    'htmldist': 'dist/html/**/*.html',
    'css': {
        'global': ['css/global/normalize.css', 'css/global/**/!(normalize)*.css'],
        'normal': ['css/**/*.css', '!css/global/**/*.css']
    },
    'sass': 'sass/**/*.{sass, scss}'
};


var watchStatus = {
    'isAdded': function(file) {
        return file.event === 'added';
    },
    'isChanged': function(file) {
        return file.event == 'changed';
    },
    'isDeleted': function(file) {
        return file.event == 'deleted';
    },
    'isNotDeleted': function(file) {
        return file.event != 'deleted';
    }
};


gulp.task('browser-sync', function() {

    gulp.src([
        filefolder.html,
        filefolder.css,
        filefolder.js.all,
        filefolder.img
    ])
        .pipe(plumber())
        .pipe(watch([
                filefolder.html,
                filefolder.css,
                filefolder.js,
                filefolder.img
        ])).pipe(reload({
            stream: true
        }));

    browserSync.init(null, {
        server: {
            baseDir: './',
            directory: true
        },
        debugInfo: false,
        open: false,
        browser: ["google chrome", "firefox"],
        injectChanges: true,
        notify: true
    });
});




// ************* sass **************
gulp.task('compass', function() {
    gulp.src(filefolder.sass)
        .pipe(plumber())
        .pipe(compass({
            config_file: './config.rb',
            css: 'css',
            sass: 'sass'
        }))
        .pipe(gulp.dest('css'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('sass', function() {
    gulp.watch([filefolder.sass], ['compass']);
});



// ************ 處理共同使用的環境變數 **************
gulp.task('development', function() {

    var sources = gulp.src([
        'js/config/environment.js',
        'js/config/environments/development.js'
    ], {read: false});

    gulp.src(filefolder.html)
        .pipe(watch(filefolder.html))
        .pipe(plumber())
        .pipe(filter(watchStatus.isNotDeleted))
        .pipe(inject(sources, {
            addRootSlash: false,
            relative: true
        }))
        .pipe(gulp.dest('html'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('production', function() {

    var sourceAry = [
        './js/config/environment.js',
        './js/config/environments/production.js'
    ];
    var htmlbuildAry = [
        '../js/config/environment.js',
        '../js/config/production.js'    
    ];

    // 碰到牆壁, read: false會導致在dest的時候檔案不會複製過去喔!
    gulp.src(sourceAry, {read: true})
        .pipe(gulp.dest('./dist/js/config'));

    gulp.src(filefolder.html)
        .pipe(htmlbuild({
            js: function(block) {
                es.readArray(htmlbuildAry.map(function(str) {
                    return '<script src="' + str + '" type="text/javascript"></script>';
                })).pipe(block);
            },
            css: htmlbuild.preprocess.css(function (block) {
                block.write('../css/global.css');
                block.end();
            })
        }))
        .pipe(gulp.dest('./dist/html'))
        .pipe(filesize())
        .on('error', gutil.log);
});



// ****************處理js *****************
gulp.task('minify-js', function() {

    gulp.src(filefolder.js.vendor + '.js')
            .pipe(uglify())
            .pipe(gulp.dest('./dist/js/vendor'))
            .pipe(filesize())
            .on('error', gutil.log);
});

gulp.task('move-js', function() {

    gulp.src(filefolder.js.lib)
        .pipe(gulp.dest('./dist/js/lib'));

    gulp.src(filefolder.js.script)
        .pipe(gulp.dest('./dist/js/script'));
});




// ************* css ****************
gulp.task('concat-css', function() {

    gulp.src(filefolder.css.global)
        .pipe(concat('global.css'))
        .pipe(minifyCSS({
            keepBreaks: true
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(filesize())
        .on('error', gutil.log);
});

gulp.task('minify-css', function() {
    gulp.src(filefolder.css.normal)
        .pipe(minifyCSS({
            keepBreaks: true
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(filesize())
        .on('error', gutil.log);
});


// ******* 圖片壓縮 *********
gulp.task('minify-img', function() {

    return gulp.src(filefolder.img)
        .pipe(imagemin({
            optimizationLevel: 3,
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngcrush()]
        }))
        .pipe(gulp.dest('dist/img'))
        .on('error', gutil.log);
});

// ********** 清除檔案 **********
gulp.task('clean', function() {
    return gulp.src(['dist/html', 'dist/js', 'dist/css'], {
        read: false
    }).pipe(clean({
        force: true
    }));
});

gulp.task('clean-img', function() {
    return gulp.src(['dist/img'], {
        read: false
    }).pipe(clean({
        force: true
    }));
});
gulp.task('clean-all', ['clean', 'clean-img']);







gulp.task('livereload', ['browser-sync', 'server']);

gulp.task('server', ['sass', 'development']);

gulp.task('dist', function(cb) {
    runSequence('clean', ['concat-css', 'minify-css', 'minify-js', 'move-js', 'production']);
});

gulp.task('dist-img', function(cb) {
    runSequence('clean-all', ['dist', 'minify-img']);
});

