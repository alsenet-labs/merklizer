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

 if (!TextEncoder) {
   const TextEncoder=require('text-encoding').TextEncoder;
 }

module.exports=[
  '$scope',
  '$rootScope',
  '$timeout',
  '$window',
  'merkle',
  'processing',
//  'pdfService',
  'fileService',
  '$q',
  function (
    $scope,
    $rootScope,
    $timeout,
    $window,
    merkle,
    processing,
//    pdfService,
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

        $scope.$on('filesProcessed',function(event,options){
          $scope.$state.go('processed',options);
        });

/*
        $scope.$on('showMetadata',function(event,file){
            $scope.showMetadata(file);
        });
*/
        $scope.$on('excludedFile',function(event,file){
          var ext=file.name.split('.').pop();
          if (file.type=='application/json' || (ext=='json')) {
            $scope.proofs.push(file);
          }
        });

        $scope.$on('filesReady',function(event,files){
          if ($window.parent) {
            $window.parent.postMessage({
              type: 'filesReady'
            }, $window.document.location.origin);
          }
          if ($scope.$state.current.name=='validateFile') {
            $scope.filesReady(files);
          }
        });

        $scope.$on('filesValidated',function(event,files){
          $scope.$state.go('report',{
            files: files,
            proofs: $scope.proofs
          });
        });

        $scope.$on('showAnchors',function(event,file){
          processing.showAllAnchors(file.proof.anchors);
        });

        $scope.$on('showProof',function(event,file){
          processing.showProof(file.proof,file.name+'.json');
        });


      }, // init

/*
      showMetadata: function(file){
        fileService.read(file,'readAsArrayBuffer')
        .then(pdfService.getMetadata)
        .then(console.log);

      },
*/
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
        // associate proof with file
        $scope.readProofs($scope.proofs)
        .then(function(proofs){
          var q=$q.defer();
          (function proofloop(p){
            var proof=proofs[p];
            if (!proof) {
              q.resolve();
              return;
            }
            var qq=$q.defer();
            (function fileloop(f){
              var file=queue[f];
              if (!file) {
                qq.resolve();
                return;
              }
              if (file.proof) {
                fileloop(f+1);
                return;
              }
              var qqq=$q.resolve();
              // compute hash if proof.hashType is not the one used to spot duplicates
              if (!file.hash[proof.data.hashType]) {
                qqq=qqq.then(function(){
                  return fileService.read(file,'readAsArrayBuffer')
                  .then(function(buf) {
                    return merkle.hash(buf,proof.data.hashType);
                  })
                  .then(function(result){
                    file.hash[proof.data.hashType]=result;
                    file.hash_str[proof.data.hashType]=merkle.hashToString(result);
                  })
                });
              }
              qqq.then(function(){
                if (file.hash_str[proof.data.hashType]==proof.data.hash) {
                  file.proof=proof.data;
                  qq.resolve();
                } else {
                  fileloop(f+1);
                }
              })
              .catch(qq.reject);

            })(0);

            qq.promise.then(function(){
              proofloop(p+1);
            })
            .catch(q.reject);

          })(0);

          q.promise.catch(function(err){
            console.log(err);
            $window.alert(err.message);
          });

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
            var proof=file.data=JSON.parse(result);
            if (proof.htext) {
              return processing.encodeAndHash(proof,'htext');
            }
          })
          .then(function(){
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
