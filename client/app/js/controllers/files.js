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
  'tierion',
  'ethService',
  'fileService',
  function (
    $scope,
    $rootScope,
    $window,
    $timeout,
    $q,
    merkle,
    tierion,
    ethService,
    fileService
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{
      $rootScope: $rootScope,
      merkle: merkle,
      mimeTypes: '',
      isHTML5: true,
      queue: [],
      showFileList: true,
      itemsByPage: 10,
      progress: {
        max: 0,
        value: 0
      },
      init: function() {

      }, // init

      process: function(){
        $rootScope.$broadcast('processFiles',$scope.queue);
      },

      showOverlay: function(options){
        $rootScope.$broadcast('showOverlay',options);
      },

      hideOverlay: function(){
        $rootScope.$broadcast('hideOverlay');
      },

      removeDuplicates: function(){
        var fileList=$scope.queue;
        var hasDuplicate=0;
        var removedDuplicate=0;
        angular.forEach(fileList,function(file, i){
          for(var j=fileList.length-1; j>i; --j) {
            if (fileList[j].hash.toString()==fileList[i].hash.toString()) {
              if (
                fileList[j].name!=fileList[i].name
                || fileList[j].size!=fileList[i].size
              ) {
                fileList[j].duplicate=true;
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

      onFilesDropped: function($files, $event) {
        $scope.progress.max=$files.length-1;
        $scope.progress.value=0;
        $scope.showOverlay('Adding files...');
        // reuse or initialize total size
        $scope.queue.size=$scope.queue.size||0;

        // update total size and store file
        angular.forEach($files,function(file,i) {
          $scope.progress.value=i;
          var ext=file.name.split('.').pop();
          if (!config.exclude.find(function(type){
            return type.mime==file.type || (ext && type.ext==ext);
          })) {
            $scope.queue.size+=file.size;
            $scope.queue.push(file);
          } else {
            $rootScope.$broadcast('excludedFile',file);
          }
        });
        $scope.computeHashes($scope.queue)
        .then($scope.removeDuplicates)
        .then(function(){
          // dont ask me today why $rootScope does not work below but $scope.$root does
          $rootScope.$broadcast('filesReady',$scope.queue);
        })
        .finally($scope.hideOverlay);

      }, // onFilesDropped

      onFilesChanged: function($event){
         $scope.onFilesDropped($event.target.files,$event);
      }, // onFilesChanged

      remove: function(file){
        if ($window.confirm('Are you sure ?')) {
          $scope.queue.some(function(_file,i){
            if (file==_file){
              $scope.queue.splice(i,1);
              return true;
            }
          });
        }
      },

      removeAll: function(){
//        if ($window.confirm('Are you sure ?')) {
          $scope.queue.splice(0,$scope.queue.length);
          $scope.queue.size=0;
//        }
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
          .then(function(result){
            file.hash=merkle.hash(result);
            file.hash_str=merkle.hashToString(file.hash);
          })
          .then(loop)
          .catch(q.reject);

        })();

        return q.promise;

      } // computeHashes

    });

  }

];
