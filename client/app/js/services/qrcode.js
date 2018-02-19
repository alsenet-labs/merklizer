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

var Instascan=require('instascan');

module.exports=[
  '$rootScope',
  '$q',
  function($rootScope,$q){
    var service=this;
    angular.extend(service,{
      scan: function(options){
        var scanner=service.scanner=service.scanner || new Instascan.Scanner($.extend(true,{
    //      mirror: false
        },options.instascan));
        scanner.addListener('scan',function scan_listener(content){
          $rootScope.$broadcast('scan',content);
          service.scanner.stop();
          service.scanner=null;
        });
        Instascan.Camera.getCameras().then(function (cameras) {
          if (cameras.length > 0) {
            scanner.start(cameras[1]);
          } else {
            console.error('No cameras found.');
            $window.alert('No cameras found.');
          }
        }).catch(function (e) {
          console.error(e);
          $window.alert('Unexpected error.');
        });
      } // scan

    });
  }
];
