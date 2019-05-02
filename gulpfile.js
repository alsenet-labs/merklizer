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
'use strict';

var gulp = require('gulp');
var debug = require('gulp-debug');
var browserSync = require('browser-sync');
var merge = require('merge-stream');
var log = require('fancy-log');
var exec = require('child_process').exec;
var tagName;
var fs=require('fs');
var del=require('del');

gulp.task('getLatestTagName', function (callback) {
  if (process.env.MERKLIZER_TAGNAME) {
    tagName=process.env.MERKLIZER_TAGNAME;
    callback();
    return;
  }
  exec('git describe --tags --abbrev=0', function (err, stdout, stderr) {
    log(stdout);
    tagName=stdout.replace(/\n.*/,'');
    log(stderr);
    callback(err);
  });
})

gulp.task('build', function (callback) {
  exec('make webapp-ugly', function (err, stdout, stderr) {
    log(stdout);
    log(stderr);
    callback(err);
  });
});

gulp.task('clean:html', function(cb){
  return del('./html/'+tagName,cb);
});

gulp.task('copy:html', function(){
   var streams=[];
   streams.push(gulp.src(['./.nojekyll','./webapp/dist/**'])
   .pipe(gulp.dest('./html/'+tagName+'/')));
   return merge(streams).pipe(debug({title: 'Files:'}));
});

gulp.task('html', gulp.series('getLatestTagName', 'clean:html', 'copy:html'));

gulp.task('browserSync', gulp.series('html', function browserSync(){
    return browserSync.init(['html/'+tagName+'/**'], {
        watchOptions: {
          ignoreInitial: true
        },
        server: {
            baseDir: './html/',
            directory: true
        },
        https: true,
        startPath: tagName+'/index.html#!/validate-file',
    });
}));

gulp.task('update-ghpages', gulp.series('html', function update_ghpages_index(callback){
  var err;
  try {
    fs.writeFileSync('html/redirect.js', "window.location.assign('html/"+tagName+"/index.html#!/validate-file');\n");
  } catch(e) {
    err=e;
  }
  callback(err);
}));

gulp.task('default',gulp.series('update-ghpages'));
