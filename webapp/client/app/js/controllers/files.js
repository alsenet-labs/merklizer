/*
* Copyright (c) 2018-2024 ALSENET SA
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
var config =require('../../../../config.files.js')();

/**
 * @ngdoc function
 * @name merkleApp.controller:FilesCtrl
 * @description
 * # FilesCtrl
 * Controller of the merkleApp
 */

module.exports=[
  '$scope',
  '$rootScope',
  '$window',
  '$timeout',
  '$q',
  'merkle',
  'fileService',
  function (
    $scope,
    $rootScope,
    $window,
    $timeout,
    $q,
    merkle,
    fileService
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{
      $rootScope: $rootScope,
      mouseOverLabel: false,
      merkle: merkle,
      mimeTypes: '',
      isHTML5: true,
      queue: [],
      showFileList: false,
      itemsByPage: 10,
      progress: {
        max: 0,
        value: 0
      },
      init: function() {
        switch($rootScope.$state.current.name) {
          case 'validateFile': $scope.action='Validate'; break;
          case 'anchor': $scope.action='Anchor'; break;
          default: $window.alert('unknown state: '+$rootScope.$state.current.name); break;
        }
        if ($scope.mobileApp) {
          $scope.click_or_drop_files_here="Click here.";
        } else {
          $scope.click_or_drop_files_here="Click or drop files here.";
        }

      }, // init

      mouseEnter: function(){
        $scope.mouseOverLabel=true;
      },
      mouseLeave: function(){
        $scope.mouseOverLabel=false;
      },

      process: function(){
        $rootScope.$broadcast('processFiles',$scope.queue);
      },

      removeDuplicates: function(){
        var fileList=$scope.queue;
        var hashType=fileList && fileList.length && fileList[0].hashType;
        var hasDuplicate=0;
        var removedDuplicate=0;
        angular.forEach(fileList,function(file, i){
          for(var j=fileList.length-1; j>i; --j) {
            if (fileList[j].hash_str[hashType]==fileList[i].hash_str[hashType]) {
              if (
                fileList[j].name!=fileList[i].name
                || fileList[j].size!=fileList[i].size
              ) {
                fileList[j].duplicate=fileList[j];
                ++hasDuplicate;
                console.log('hash collision', fileList[j]);
              } else {
                console.log('removing duplicate', fileList[j]);
                fileList.splice(j,1);
                ++removedDuplicate;
              }
            }
          }
        });
        if (hasDuplicate) {
          $window.alert(hasDuplicate+" file"+(hasDuplicate>1?'s':'')+" with the same hash !");
        }
        if (removedDuplicate) {
          $window.alert(removedDuplicate+" duplicate"+(removedDuplicate>1?'s':'')+" ignored !");
        }
      }, // removeDuplicates

      /**
       sort files by name then compute hashes and remove duplicates
       then broadcast "fileReady" event on success.
      */
      onFilesDropped: function($files, $event) {
        $scope.progress.max=$files.length-1;
        $scope.progress.value=0;
        $scope.showOverlay({
          message: 'Adding files...',
          showProgress: true,
          progress: $scope.progress
        })
        // reuse or initialize total size
        $scope.queue.size=$scope.queue.size||0;

        // update total size and store file
        Array.prototype.slice.call($files).reduce(function(promise,file){
          return promise.then(function(){
            return fileService.filterFile(file)
            .then(function(filtered){
              if (!filtered) {
                $scope.queue.size+=file.size;
                $scope.queue.push(file);
              }
            });
          });
        }, Promise.resolve())
        .then(function(){
          $scope.queue.sort(function(a,b){
            a=a.name.toLowerCase();
            b=b.name.toLowerCase();
            if (a>b) return 1;
            if (a<b) return -1;
            return 0;
          });

          return $scope.computeHashes($scope.queue)
          .then($scope.removeDuplicates)
          .then(function(){
            $rootScope.$broadcast('filesReady',$scope.queue);
            $('table.files').floatThead({
                autoreflow: true,
                position: 'fixed',
                scrollContainer: function($table){
                    return $table.closest('.files-wrapper');
                }
            });
          });
        })
        .catch(function(err){
          console.log(err);
          $window.alert('An unexpected error occured !');
          $window.document.location.reload();
        })
        .finally($scope.hideOverlay);

      }, // onFilesDropped

      onFilesChanged: function($event){
         $scope.onFilesDropped($event.target.files,$event);
      }, // onFilesChanged

      remove: function(file){
    //    if ($window.confirm('Are you sure ?')) {
          var removed;
          $scope.queue.some(function(_file,i){
            if (file==_file){
              $scope.queue.splice(i,1);
              removed=true;
              return true;
            }
          });
          if (!removed) {
            alert('Unexpected error');
            window.location.reload();
          }

//        }
      },

      removeAll: function(){
        window.location.reload();
        return;
        /*
//        if ($window.confirm('Are you sure ?')) {
          $scope.queue.splice(0,$scope.queue.length);
          $scope.queue.size=0;
//        }
*/
      },

      /**
      @function computeHashes
      @description compute hashes for given file list
      @param fileIndex
      @returns $q.promise
      */

      computeHashes: function(fileList){
        var q=$q.defer();

        // dont use 'reduce' to be nice with CPU
        // and to allow cancelling the task
        var index=0;
        (function loop() {
          var file=fileList[index++];
          if (!file) {
            q.resolve();
            return;
          }
          if (file.hash) {
            loop();
            return;
          }

          fileService.read(file,'readAsArrayBuffer')
          .then(merkle.hash)
          .then(function(result){
            var hashType=merkle.hashType;
            file.hash={};
            file.hash[hashType]=result;
            file.hash_str={};
            file.hash_str[hashType]=merkle.hashToString(result);
            file.hashType=hashType;
          })
          .then(loop)
          .catch(q.reject)
          .finally(function(){
            $scope.progress.value++;
          })

        })();

        return q.promise;

      } // computeHashes

    });

    $scope.init();

  }

];
