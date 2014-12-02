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

// test
var fs = require('fs');
var tap = require('gulp-tap'); // 取得檔案名稱
var rename = require("gulp-rename");

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
        'all': 'css/**/*.css',
        'global': ['css/global/normalize.css', 'css/global/**/!(normalize)*.css'],
        'normal': ['css/**/*.css', '!css/global/**/*.css']
    },
    'sass': 'sass/**/*.{sass, scss}',
    'test': {
        'html': {
            'html': 'test/html/*.html',
            'script': 'test/html/script/*.js'
        },
        'js': {
            'html': 'test/js/*.html',
            'script': 'test/js/script/**/*.js'
        }
    }
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

    var syncAry = [
        filefolder.html,
        filefolder.css.all,
        filefolder.js.all,
        filefolder.img,
        filefolder.test.html.html,
        filefolder.test.html.script
    ];

    gulp.src(syncAry)
        .pipe(plumber())
        .pipe(watch(syncAry)).pipe(reload({
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


// ********** 測試用 ***********
// 測試用libs
var getTestLibAry = {
    'js': [
        '../../js/test/jquery-1.10.2.min.js',
        '../../js/test/mocha.js',
        '../../js/test/chai.js',
        '../../js/test/chai-jquery.js',
    ],
    'css': [
        '../../js/test/mocha.css'
    ]
};


// 要監聽產生的資料夾位置
var jsTestFolderAry = [
    filefolder.js.script,
    filefolder.js.lib
];


// 測試用function
var getPathName = function(filepath) {
    var name = path.basename(filepath);
    return name.substr(0, name.lastIndexOf('.'));
};

var getJsFolderName = function(filepath) {

    var dirname = __dirname + '/js/';
    var folderName = filepath.replace(dirname, '');

    return folderName.substr(0, folderName.lastIndexOf('/'));
};


// 建立測試用的code
var destTestJs = function(name, foldername, testType) {

    var dir = './' + testType + '/script/';
    var filepath = '';

    if (foldername) {
        dir = './' + testType + '/' + foldername + '/script/';
    }
    filepath = dir + name + '.js';

    fs.exists(filepath, function(exists) {

        if (exists) {
            return false;
        }
        gulp.src('./test/default.js')
            .pipe(rename(function(path) {
                path.dirname = dir;
                path.basename = name;
                path.extname = ".js";

            }))
            .pipe(gulp.dest("./test"))
            .pipe(reload({
                stream: true
            }));
    });
};



var createTestHtmlHash = {
    'html': function(name, filepath, foldername, testType) {

        gulp.src(filepath)
            .pipe(htmlbuild({
                // add a header with this target
                htmltest: function(block) {
                    block.end('<div id="mocha"></div>');
                },
                csstest: function(block) {
                    var cssLibAry = getTestLibAry.css;

                    es.readArray(cssLibAry.map(function(str) {
                        return '<link rel="stylesheet" href="' + str + '">';
                    })).pipe(block);
                },
                jstest: function(block) {

                    var jsLibAry = getTestLibAry.js.slice(0);

                    if (name) {
                        jsLibAry.push('./script/' + name + '.js');
                    }

                    es.readArray(jsLibAry.map(function(str) {
                        return '<script src="' + str + '"></script>';
                    })).pipe(block);
                },
            }))
            .pipe(gulp.dest('./test/' + testType))
            .pipe(reload({
                stream: true
            }));
    },
    'js': function(name, filepath, foldername, testType) {

        // 產生測試用的html
        var htmlPath = 'test/' + testType + '/' + foldername + '/' + name + '.html';
        gulp.src('./test/default.html')
            .pipe(rename(function(path) {
                path.dirname = testType + '/' + foldername;
                path.basename = name;
                path.extname = ".html";
            }))
            .pipe(htmlbuild({
                js: function(block) {

                    var jsLibAry = getTestLibAry.js.slice(0);

                    jsLibAry = jsLibAry.map(function(value) {
                        return '../' + value;
                    });

                    if (name) {
                        jsLibAry.push('../../../' + testType + '/' + foldername + '/' + name + '.js');
                        jsLibAry.push('./script/' + name + '.js');
                    }
                    es.readArray(jsLibAry.map(function(str) {
                        return '<script src="' + str + '"></script>';
                    })).pipe(block);
                },
            }))
            .pipe(gulp.dest("./test"))
            .pipe(reload({
                stream: true
            }));
     
    }
};

var destTestHtml = function(name, filepath, foldername, testType) {
    createTestHtmlHash[testType](name, filepath, foldername, testType);
};


gulp.task('test-html', function() {

    var testType = 'html';

    // 監聽html檔案, 並產生對應的測試用html與js,
    // html會自動加上測試用的lib與對應相同名稱的js,
    // js部分如果已經存在則不覆蓋(避免寫的測試碼不見)
    gulp.src(filefolder.html)
        .pipe(watch(filefolder.html, function(files) {
            files.pipe(tap(function(file, t) {
                var name = getPathName(file.path);
                destTestJs(name, null, testType);
                destTestHtml(name, file.path, null, testType);
            }));
        }))
        .pipe(plumber())
        .pipe(filter(watchStatus.isNotDeleted))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('test-js', function() {

    var testType = 'js';

    // 監聽js/script檔案, 產生對應的測試用html
    // html會自動加上測試用的lib與測試用的js
    // html如果已存在則不覆蓋(避免使用者新增的部分被覆蓋掉)
    gulp.src(jsTestFolderAry)
        .pipe(watch(jsTestFolderAry, function(files) {

            files.pipe(tap(function(file, t) {
              
                var name = getPathName(file.path);
                var folder = getJsFolderName(file.path);
                destTestJs(name, folder, testType);
                destTestHtml(name, file.path, folder, testType);
            }));
        }))
        .pipe(filter(watchStatus.isNotDeleted))
        .pipe(reload({
            stream: true
        }));
});





gulp.task('test-html-watch', function() {
    gulp.watch(filefolder.html, ['test-html']);
});

gulp.task('test-js-watch', function() {
     gulp.watch(jsTestFolderAry, ['test-js']);
});




// 開發用
gulp.task('server', ['sass', 'development']);

// 開發用-及時預覽
gulp.task('live', ['browser-sync', 'server']);

// 發佈用
gulp.task('dist', function(cb) {
    runSequence('clean', ['concat-css', 'minify-css', 'minify-js', 'move-js', 'production']);
});

// 發佈用-壓縮圖片
gulp.task('dist-img', function(cb) {
    runSequence('clean-all', ['dist', 'minify-img']);
});
