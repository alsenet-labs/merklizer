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
  '$transitions',
  function (
    $scope,
    $rootScope,
    $timeout,
    $window,
    merkle,
    processing,
//    pdfService,
    fileService,
    $q,
    $transitions
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
        $transitions.onSuccess({}, function(transition) {
          switch(transition.to().name) {
            case 'validateFile':
            case 'anchor':
            case 'ipfs':
            case 'bzz':
              if ($scope.proofs) $scope.proofs.length=0;
              if ($scope.queue) $scope.queue.length=0;
              break;
          }
        });

        $scope.$on('processFiles',function(event,queue){
          var action;
          if ($rootScope.$state.current.name=='validateFile' || $rootScope.$state.current.name=='ipfs' || $scope.$state.current.name=='bzz') {
            action='validate'
          } else {
            action=$rootScope.$state.current.name;
          }
          processing.processFiles(action,queue);
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
        function filterProofFile(file){
          var ext=file.name.split('.').pop().toLowerCase();
          if (ext!='json') {
            return Promise.resolve(false);
          }
          // check json content
          return fileService.read(file,'readAsText')
          .then(function(result){
            var data=JSON.parse(result);
            if (data.root && data.hash && data.anchors && data.operations) {
              if ($scope.$state.current.name!='validateFile' && $scope.$state.current.name!='ipfs' && $scope.$state.current.name!='bzz') {
                if (!$scope.tryingToAnchorProofsNotified) {
                  $scope.tryingToAnchorProofsNotified=true;
                  $window.alert('Cannot anchor proofs');
                }
                return true;
              }
              file.data=data;
              $rootScope.$broadcast('addProof',file);
              return false;  // do not filter it out
            }
          });
        }

        fileService.filters.push(filterProofFile);
        $scope.$on('addProof',function(event,file){
          file.isProof=true;
          $scope.proofs.push(file);
        });

        // files have been added
        $scope.$on('filesReady',function(event,files){
          $scope.tryingToAnchorProofsNotified=false;
          if ($window.parent) {
            $window.parent.postMessage({
              type: 'filesReady'
            }, $window.document.location.origin);
          }
          if ($scope.$state.current.name=='validateFile' || $scope.$state.current.name=='ipfs' || $scope.$state.current.name=='bzz') {
            // associate proofs with files using hash comparison
            $scope.associateProofsWithFiles($scope.proofs,files,function(proof,file){
              return (file.hash_str[proof.data.hashType]==proof.data.hash)
            })
            .then(function(proofsPairedCount){
              if (proofsPairedCount && proofsPairedCount<$scope.proofs.length) {
                // try to associate remaining proofs with files using filename comparison
                return $scope.associateProofsWithFiles($scope.proofs,files,function(proof,file){
                  return (file.name==proof.name.replace(/\.[^\.]+$/));
                });
              } else {
                return proofsPairedCount;
              }
            })
            .then(function(proofsPairedCount){
              // validate files automatically when all files have an associated proof
              if ((proofsPairedCount && proofsPairedCount==files.length/2) || $scope.$state.current.name=='ipfs' || $scope.$state.current.name=='bzz') {
                $rootScope.$broadcast('processFiles',files);
              }
            })
          }
          $scope.filesCount=files.length-$scope.proofs.length;
        });

        $scope.$on('filesValidated',function(event,files){
          $scope.$state.go('report',{
            files: files,
            proofs: $scope.proofs
          });
        });

        $scope.$on('alert',function(event,message){
          $window.alert(message);
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
              proofFile.file=file;
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

      /**
      @desc associate proofs with files

      @param proofs json file array
      @param queue data file array
      @param compare(proof,file) function
      @return matches, integer as a promise
      */
      associateProofsWithFiles: function(proofs,queue,compare) {
        var proofsPairedCount=0;
        return $scope.readProofs(proofs)
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
              if (file.isProof) {
                fileloop(f+1);
                return;
              }
              if (file.proof) {
                if (file.proof==proof.data) {
                  ++proofsPairedCount;
                }
                fileloop(f+1);
                return;
              }
              var qqq=$q.resolve();
              // compute hash if proof.hashType is not the one used to spot duplicates
              if (!file.hash[proof.data.hashType]) {
                qqq=qqq.then(function(){
                  var promise;
                  if (file.buffer) {
                    promise=$q.resolve(file.buffer);
                  } else {
                    promise=fileService.read(file,'readAsArrayBuffer');
                  }
                  promise.then(function(buf) {
                    return merkle.hash(buf,proof.data.hashType);
                  })
                  .then(function(result){
                    file.hash[proof.data.hashType]=result;
                    file.hash_str[proof.data.hashType]=merkle.hashToString(result);
                  })
                });
              }
              qqq.then(function(){
                return $q.resolve(compare(proof,file))
                .then(function(matching){
                  if (matching) {
                    if (proof.file) {
                      throw new Error('Unexpected error: proof '+proof.name+' matches both '+proof.file.name+' and '+file.name);
                    }
                    file.proof=proof.data;
                    file._proof={name: proof.name, url: proof.url}; // for report
                    proof.file=file;
                    ++proofsPairedCount;
                    qq.resolve();
                  } else {
                    fileloop(f+1);
                  }
                })
              })
              .catch(qq.reject);

            })(0);

            qq.promise.then(function(){
              proofloop(p+1);
            })
            .catch(q.reject);

          })(0);

          return q.promise
          .then(function(){
            return proofsPairedCount;
          })
          .catch(function(err){
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
