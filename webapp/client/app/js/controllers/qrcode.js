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
 * @name merkleApp.controller:QRCodeCtrl
 * @description
 * # QRCodeCtrl
 * Controller of the merkleApp
 */

module.exports=[
  '$scope',
  '$rootScope',
  '$window',
  '$timeout',
  '$q',
  'QRCodeService',
  'processing',
  function (
    $scope,
    $rootScope,
    $window,
    $timeout,
    $q,
    QRCodeService,
    processing
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{
      init: function() {
        $scope.$on('$destroy',function(){
          QRCodeService.destroy(console.log);
        });
        QRCodeService.scan(function(err,text){
//          $scope.$apply()
          $timeout(function(){
            $scope.callback(err,text);
          });
        });
      },
      callback: function(err, text) {
        if (err) {
          $scope.$root.$broadcast('showOverlay',{
            message: text,
            showButton: true,
            buttonText: 'Retry'
          });
          return;
        }
        var proof;
        try {
          proof=JSON.parse(text);
        } catch(e) {
          $scope.$root.$broadcast('showOverlay',{
            message: text,
            showButton: true,
            buttonText: 'Retry'
          });
          return;
        }
        $q.resolve({proof: proof})
        .then(processing.validate)
        .then(function(validated){
          if (validated) {
            $scope.$state.go('report',{files: [{proof: proof}]});
          } else {
            $scope.$state.go('validate');
          }
        });
      }
    });

    $scope.init();
  }
];
