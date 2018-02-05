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

/**
 * @ngdoc function
 * @name merkleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the merkleApp
 */


var Q=require('q');

module.exports=[
  '$scope',
  '$rootScope',
  '$timeout',
  '$window',
  'processing',
  function (
    $scope,
    $rootScope,
    $timeout,
    $window,
    processing
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{

      proofChanged_removeListener: function(){},

      init: function(){

        $scope.$on('processFiles',function(event,queue){
            processing.processFiles(queue);
        });
        $scope.$on('validateFile',function(event,file){
            $scope.validate(file);
        });

      }, // init

      validate: function(file){
        var q=Q.defer();

        if (file.proof) {
          q.resolve(file);

        } else {

          $window.alert('Select the proof file');
          $scope.proofChanged_removeListener();

          $scope.proofChanged_removeListener=$scope.$on('proofChanged',function($event,originalEvent){
            var proofFile=originalEvent.target.files[0];

            function _read(proofFile) {
              var q=Q.defer();
              if (!$scope.reader) {
                $scope.reader=new FileReader();
              }
              $scope.reader.addEventListener('load',function listener(e){
                $scope.reader.removeEventListener('load',listener);
                Q.fcall(function(){
                  return JSON.parse($scope.reader.result);
                })
                .then(q.resolve)
                .catch(q.reject)
                .done()
              });
              $scope.reader.readAsText(proofFile);
              return q.promise;
            } // _read

            _read(proofFile)
            .then(function(proof){
              file.proof=proof;
              q.resolve(file);
            })
            .catch(q.reject)
            .done();

          });

          $('#proofFileInput').click();

        }

        q.promise.then(function(file){
          processing.validate(file);
        });

      } // validate

    }); // extend scope

    $scope.init();
  }

];
