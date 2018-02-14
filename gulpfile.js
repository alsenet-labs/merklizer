/*
* Copyright (c) 2018 ALSENET SA
*
* Author(s):
*
*      Luc Deschenaux <luc.deschenaux@freesurf.ch>
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*/

var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var rename = require('gulp-rename');

gulp.task('browserSync',function(){
    browserSync.init(["client/app/css/bundle.css", "client/app/js/index.min.js","./client/app/index.html",'./client/app/views/**.html'], {
			  watchOptions: {
					ignoreInitial: true
				},
        server: {
            baseDir: "./client/app/"
        }
    });
});

gulp.task('copy', function () {
   var streams=[];
	 streams.push(gulp.src('./node_modules/bootstrap/dist/css/*')
   .pipe(gulp.dest('./client/app/css/')));
	 streams.push(gulp.src('./node_modules/pretty-file-icons/svg/*')
   .pipe(gulp.dest('./client/app/images')));
   streams.push(gulp.src('./node_modules/pdfjs-dist/build/pdf.worker.min.js')
   .pipe(rename('index.worker.min.js'))
   .pipe(gulp.dest('./client/app/js/')));
	 return merge.apply(null,streams);
});


gulp.task('sass', function () {

  return gulp.src([
    //'./node_modules/font-awesome/scss/font-awesome.scss',
    './client/app/sass/**.scss'
    ])
    .pipe(sass({
      includePaths: [
        './node_modules/bootstrap/scss'
      ]
    }).on('error', sass.logError))
    .pipe(gulp.dest('./client/app/css/'));
});

gulp.task('browserify', require('./gulptasks/browserify.js')({
  callback: callback
}));

gulp.task('watchify', require('./gulptasks/browserify.js')({
  callback: callback,
  watch: true
}));

gulp.task('watch', function(){
      return gulp.watch("./client/app/sass/**.scss", ['sass']);
//      gulp.watch(["./client/app/index.html",'./client/app/views/**.html']).on ('change',browserSync.reload);
});

function callback(err,msg){
  if(err) throw err;
}

gulp.task('default', function() {
	runSequence(
		'copy',
		'sass',
		'watch',
		'watchify',
		'browserSync'

	);
});
