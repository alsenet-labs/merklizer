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

"use strict";

module.exports=[
  '$stateProvider',
  '$locationProvider',
  '$urlRouterProvider',
  function(
    $stateProvider,
    $locationProvider,
    $urlRouterProvider
  ){

    $locationProvider.html5Mode({
      enabled: false,
      requireBase: true
    });

    $urlRouterProvider.otherwise(function($injector){
      $injector.invoke(['$state', function($state) {
        $state.go('chooser', {}, { location: true } );
      }]);
    });

    $stateProvider
    .state('chooser', {
      url: '/',
      templateUrl: 'views/chooser.html'
    })
    .state('anchor', {
      url: '/anchor',
      templateUrl: 'views/files.html',
      controller: 'FilesCtrl',
      controllerAs: 'files',
      title: 'Anchor'
    })
    .state('processed', {
      url: '/processed',
      templateUrl: 'views/processed.html',
      controller: 'ProcessedCtrl',
      controllerAs: 'processed',
      title: 'Processed'
    })
    .state('validate', {
      url: '/validate',
      templateUrl: 'views/chooser.html',
      title: 'Validate'
    })
    .state('validateFile', {
      url: '/validate-file',
      templateUrl: 'views/files.html',
      controller: 'FilesCtrl',
      controllerAs: 'files',
      title: 'Validate File'
    })
    .state('validateQRCode', {
      url: '/validate-qrcode',
      templateUrl: 'views/qrcode.html',
      controller: 'QRCodeCtrl',
      controllerAs: 'qrcode',
      title: 'Validate QRCode'
    })
    .state('report', {
      url: '/report',
      templateUrl: 'views/report.html',
      controller: 'ReportCtrl',
      controllerAs: 'report',
      tile: 'Report',
      params: {
        files: null
      }
    });

  }
];
