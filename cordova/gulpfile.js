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
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var cordova=require('cordova-lib').cordova;
var log=require('fancy-log');
var streamFromPromise=require('stream-from-promise');

gulp.task('copy', function () {
   var streams=[];
   streams.push(gulp.src('../webapp/dist/js/index.min.*')
   .pipe(gulp.dest('./www/js/')));
   streams.push(gulp.src('../webapp/dist/css/bundle.css')
   .pipe(gulp.dest('./www/css/')));
   streams.push(gulp.src('../webapp/dist/views/*')
   .pipe(gulp.dest('./www/views/')));
   return merge.apply(null,streams)
  .on('end', function(){log('Done!')})
  .on('error', function(err){log(err)});
});


gulp.task('watch', function(){
   return gulp.watch("./webapp/dist/**", ['copy']);
});

gulp.task('build', function(){
  return streamFromPromise(cordova.build({
    platforms: ['android'],
    options: {
        argv: ['--release', '--gradleArg=--no-daemon']
    }
  }).catch(log))
});
      
gulp.task('run', function(){
  return streamFromPromise(cordova.run({
    options: {
      argv: ['android']
    }
  }).catch(log));
});

gulp.task('dist', function() {
  return runSequence(
    'copy',
    'build'
  )
});

gulp.task('default', function() {
  return runSequence(
    'dist',
    'run'
  )
});

