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
var rev = require('gulp-rev');
var shell = require('shelljs');
var es = require('event-stream');
var path = require('path');
var fs = require('fs');

gulp.task('browserSync',function(){
    browserSync.init(["client/app/css/bundle.css", "client/app/js/index.min.js","./client/app/index.html",'./client/app/views/**.html'], {
        watchOptions: {
          ignoreInitial: true
        },
        server: {
            baseDir: "./client/app/"
        },
        https: true
    });
});

gulp.task('copy', function () {
   var streams=[];
   streams.push(gulp.src('./node_modules/bootstrap/dist/css/*')
   .pipe(gulp.dest('./client/app/css/')));
//   streams.push(gulp.src('./node_modules/pretty-file-icons/svg/*')
//   .pipe(gulp.dest('./client/app/images')));
//   streams.push(gulp.src('./node_modules/pdfjs-dist/build/pdf.worker.min.js')
//   .pipe(rename('index.worker.min.js'))
//   .pipe(gulp.dest('./client/app/js/')));
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

gulp.task('browserify', require('./gulptasks/browserify.js')());

gulp.task('browserify-ugly', require('./gulptasks/browserify.js')({
  uglify: true
}));

gulp.task('watchify', require('./gulptasks/browserify.js')({
  watch: true
}));

gulp.task('watch', function(){
      return gulp.watch("./client/app/sass/**.scss", ['sass']);
//      gulp.watch(["./client/app/index.html",'./client/app/views/**.html']).on ('change',browserSync.reload);
});

function callback(err,msg){
  if(err) throw err;
}

gulp.task('run', function() {
  return runSequence(
    'copy',
    'sass',
    'watch',
    'watchify',
    'browserSync'

  );
});

gulp.task('default',['run']);

gulp.task('build', function(callback){
  runSequence(
    'copy',
    'sass',
    'browserify',
    'dist',
    'rev',
    function(err){
      if (err) console.log(err.message);
      callback(err);
    }
  );
});

gulp.task('build-ugly', function(callback){
  runSequence(
    'copy',
    'sass',
    'browserify-ugly',
    'dist',
    'rev',
    function(err){
      if (err) console.log(err.message);
      callback(err);
    }
  );
});

gulp.task('dist',  function(){
   var streams=[];
   streams.push(gulp.src('./client/app/index.html')
   .pipe(gulp.dest('./dist/')));
   streams.push(gulp.src('./client/app/views/*')
   .pipe(gulp.dest('./dist/views/')));
   streams.push(gulp.src('./client/app/js/index.min.*')
   .pipe(gulp.dest('./dist/js/')));
   streams.push(gulp.src('./client/app/css/bundle.*')
   .pipe(gulp.dest('./dist/css/')));
   streams.push(gulp.src('./node_modules/pretty-file-icons/svg/*')
   .pipe(gulp.dest('./dist/images/')));
//  streams.push(gulp.src('./node_modules/zxing-typescript/docs/examples/zxing.qrcodereader.min.js')
//   .pipe(gulp.dest('./dist/js/')));
//   streams.push(gulp.src('./node_modules/pdfjs-dist/build/pdf.worker.min.js')
//   .pipe(rename('index.worker.min.js'))
//   .pipe(gulp.dest('./dist/js/')));
   return merge.apply(null,streams);


});

var revFiles=[];
// rename in place rev files (and their optional map file)
var renameRevFiles=function(es){
  revFiles.splice(0);
  return es.map(function(file,cb){
    var basename=path.basename(file.revOrigPath).split('.');
    basename[0]=basename[0]+'-'+file.revHash;
    basename=basename.join('.');
    var dest=path.join(file.revOrigBase,basename);
    fs.renameSync(file.revOrigPath, dest);
    revFiles.push({orig: file.revOrigPath, rev: dest});
    try { fs.renameSync(file.revOrigPath+'.map', dest+'.map'); } catch(e) {}
    return cb(null,file);
  });
}

// replace reference to rev files in specified html
var injectRev=function(es,html){
  var html=path.resolve(html);
  var base=path.dirname(html);
  return es.map(function(file,cb){
    revFiles.forEach(function(file){
      var orig=file.orig.substr(base.length+1);
      var rev=file.rev.substr(base.length+1);
      shell.sed('-i','"'+orig+'"','"'+rev+'"',html);
    });
    return cb(null,file);
  });
}

gulp.task('rev', ['dist'], function(){
  gulp.src(['./dist/js/index.min.js', './dist/css/bundle.css'])
    .pipe(rev())
    .pipe(renameRevFiles(es))
    .pipe(injectRev(es,'./dist/index.html'));
});

