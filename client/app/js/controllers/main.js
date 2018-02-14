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

module.exports=[
  '$scope',
  '$rootScope',
  '$timeout',
  '$window',
  'processing',
  'pdfService',
  'fileService',
  '$q',
  function (
    $scope,
    $rootScope,
    $timeout,
    $window,
    processing,
    pdfService,
    fileService,
    $q
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{

      proofs: [],

      proofChanged_removeListener: function(){},

      init: function(){

        $scope.$on('processFiles',function(event,queue){
            processing.processFiles(queue);
        });
        $scope.$on('validateFile',function(event,file){
            $scope.validate(file);
        });
        $scope.$on('showMetadata',function(event,file){
            $scope.showMetadata(file);
        });

        $scope.$on('excludedFile',function(event,file){
          var ext=file.name.split('.').pop();
          if (file.type=='application/json' || (ext=='json')) {
            $scope.proofs.push(file);
          }
        });

        $scope.$on('filesReady',function(event,files){
          $scope.filesReady(files);
        });

        $scope.$on('showAnchors',function(event,file){
          processing.showAllAnchors(file.proof.anchors);
        });

        $scope.$on('showProof',function(event,file){
          processing.showProof(file.proof,file.name+'.json');
        });

      }, // init

      showMetadata: function(file){
        fileService.read(file,'readAsArrayBuffer')
        .then(pdfService.getMetadata)
        .then(console.log);

      },

      // click on validate button
      validate: function(file){
        var q=$q.defer();

        if (file.proof) {
          q.resolve(file);

        } else {

          $window.alert('Select the proof file');
          $scope.proofChanged_removeListener();

          $scope.proofChanged_removeListener=$scope.$on('proofChanged',function($event,originalEvent){
            var proofFile=originalEvent.target.files[0];

            fileService.read(proofFile,'readAsText')
            .then(function(result){
              return JSON.parse(result)
            })
            .then(function(proof){
              file.proof=proof;
              q.resolve(file);
            })
            .catch(q.reject);

          });

          $('#proofFileInput').click();

        }

        q.promise.then(function(file){
          processing.validate(file);
        });

      }, // validate

      filesReady: function(queue) {
        $scope.readProofs($scope.proofs)
        .then(function(proofs){
          // associate proof with file
          proofs.forEach(function(proof){
            queue.some(function(file){
              if (file.hash_str==proof.data.hash) {
                file.proof=proof.data;
                return true;
              }
            });
          });
          processing.validateAll(queue);
        });
      },

      readProofs: function(files){
        var q=$q.defer();

        var index=0;
        (function loop(){
          var file=files[index++];
          if (!file) {
            q.resolve(files);
            return;
          }
          if (file.data) {
            loop();
            return;
          }
          fileService.read(file,'readAsText')
          .then(function(result){
            file.data=JSON.parse(result);
            loop();
          })
          .catch(q.reject);

        })();
        return q.promise;
      }


    }); // extend scope

    $scope.init();
  }

];
