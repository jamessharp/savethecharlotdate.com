var path = require('path');

var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('less');
var es = require('event-stream');
var _ = require('lodash');

var paths = {
  less: ['styles/**/*.less']
};

function gulpLess(options) {

  function transform(file, next) {
    var self = this;

    if (file.isNull()) {
      return next(null, file);
    }

    if (file.isStream()) {
      return next(new gutil.PluginError('gulp-less', 'Streaming not supported'));
    }

    var str = file.contents.toString('utf8');

    var opts = _.defaults(options || {}, {
      filename: file.path,
      paths: [ path.dirname(file.path) ]
    });

    // Sourcemaps?
    opts.sourceMap = true;
    opts.outputSourceFiles = true;

    // let people use their own compressor
    less.render(str, opts, function (err, css) {
      if (err) {
        gutil.log(err);
        next(new gutil.PluginError('gulp-less', err));
      } else {
        file.contents = new Buffer(css);
        file.path = gutil.replaceExtension(file.path, '.css');
        next(null, file);
      }
    });
  }

  return es.map(transform);
}

gulp.task('less', function() {
  return gulp.src('styles/stcd.less')
    .pipe(gulpLess())
    .pipe(gulp.dest('public/styles'));
});

gulp.task('watch', ['less'], function() {
  gulp.watch('styles/**/*.less', ['less']);
});