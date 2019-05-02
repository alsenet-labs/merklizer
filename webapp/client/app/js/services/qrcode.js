/*
* Copyright (c) 2018-2019 ALSENET SA
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

module.exports=[
  '$rootScope',
  '$q',
  '$window',
  function(
    $rootScope,
    $q,
    $window
  ){
    var service=this;
    var QRScanner=$window.QRScanner;

    angular.extend(service,{

      prepare: function(resolve,reject) {

        QRScanner.prepare(onDone); // show the prompt

        function onDone(err, status){
          if (err) {
           // here we can handle errors and clean up any loose ends.
           console.error(err);
           return reject(err);
          }
          if (status.authorized) {
            // W00t, you have camera access and the scanner is initialized.
            // QRscanner.show() should feel very fast.
            return resolve();

          } else if (status.denied) {
            return reject();
           // The video preview will remain black, and scanning is disabled. We can
           // try to ask the user to change their mind, but we'll have to send them
           // to their device settings with `QRScanner.openSettings()`.
          } else {
            return reject();
            // we didn't get permission, but we didn't get permanently denied. (On
            // Android, a denial isn't permanent unless the user checks the "Don't
            // ask again" box.) We can ask again at the next relevant opportunity.
          }
        }
      },

      switchCamera: function(callback){
        QRScanner.getStatus(function(camera){
          if (camera.canChangeCamera) {
            QRScanner.useCamera(1-camera.currentCamera,callback||function(){});
          }
        });
      },

      scan: function(callback){
        new Promise(service.prepare)
        .then(function(){
          QRScanner.scan(function(err, text){
            service.displayContents(err,text,callback);
          });
          window.document.querySelector('body').classList.add('scanning');
          QRScanner.show();
        });

      },

      destroy: function(callback){
        QRScanner.destroy(callback);
        window.document.querySelector('body').classList.remove('scanning');
      },

      displayContents: function displayContents(err, text, callback){
        if(err){
          console.log(err);
          // an error occurred, or the scan was canceled (error code `6`)
        } else {
          QRScanner.destroy(function(status){
            console.log(status);
          });
          window.document.querySelector('body').classList.remove('scanning');
          if (!callback) alert(text);
        }
        if (callback) callback(err, text);
      }

    });
  }
];
