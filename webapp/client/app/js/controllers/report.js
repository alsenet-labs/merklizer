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
 * @name merkleApp.controller:ReportCtrl
 * @description
 * # ReportCtrl
 * Controller of the merkleApp
 */


if (!TextDecoder) {
  const TextDecoder=require('text-encoding').TextDecoder;
}

module.exports=[
  '$scope',
  '$rootScope',
  '$timeout',
  'merkle',
  function (
    $scope,
    $rootScope,
    $timeout,
    merkle
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{

      showOverlay: function(options){
        $rootScope.$broadcast('showOverlay',options);
      },

      hideOverlay: function(){
        $rootScope.$broadcast('hideOverlay');
      },

      init: function(){
        if (!$scope.$stateParams.files || !$scope.$stateParams.files.length) {
          $scope.$state.go('validateFile');
          return;
        }
        var validated=$scope.validated=[];
        var notValidated=$scope.notValidated=[];
        var noProof=$scope.noProof=[];
        var proofs=$scope.unusedProofs=$scope.$stateParams.proofs;
        $scope.showOverlay('Sorting results...');
        angular.forEach($scope.$stateParams.files,function(file){
          if (file.proof) {
            var p=proofs.indexOf(file.proof);
            if (p>=0) proofs.splice(p,1);
            file.proof.root=merkle.hashToString(file.proof.root);
            if (file.proof.htext) {
              var dec=new TextDecoder();
              file.proof.htext_str=dec.decode(file.proof.htext);
            }

            if (file.proof.validated) validated.push(file);
            else notValidated.push(file);

          } else {
            noProof.push(file);
          }
        });
        $scope.hideOverlay();
        $scope.sortedFiles=notValidated.concat(noProof).concat(validated);
      }
    });

    $scope.init();
  }
];
