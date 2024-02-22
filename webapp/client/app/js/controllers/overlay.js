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
 * @name merkleApp.controller:OverlayCtrl
 * @description
 * # OverlayCtrl
 * Controller of the merkleApp
 */

module.exports=[
  '$scope',
  '$rootScope',
  '$timeout',
  function (
    $scope,
    $rootScope,
    $timeout,
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{

      init: function(){
        // must be in rootScope for blurring background with ng-class="{blur: _showOverlay}"
        $rootScope._showOverlay=false;

        $rootScope.$on('showOverlay',function(event,options){
          $scope.showOverlay(options);
        });

        $scope.$on('hideOverlay',function(){
          $scope.hideOverlay();
        });

      }, // init

      showOverlay: function(options) {
        options=options||{};
        $scope.message=options.message||$scope.message||'Please wait...';
        $scope.progress=options.progress;
        $scope.showProgress=options.showProgress;
        $scope.hideDialog=(options.hideDialog==true);
        $scope.showButton=(options.showButton!=false);
        $scope.buttons=options.buttons;
        if ($scope.showButton) {
          $scope.onclick=options.onclick||$scope._onclick;
          $scope.buttonText=options.buttonText||'Abort';
        }
        if (!$rootScope._showOverlay)
        $timeout(function(){
          $rootScope._showOverlay=true;
        });
      },

      hideOverlay: function() {
        $timeout(function(){
          $rootScope._showOverlay=false;
        });
      },

      _onclick: function(){window.location.reload()}

    }); // extend scope

    $scope.init();
  }

];
