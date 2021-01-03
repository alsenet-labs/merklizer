/*
* Copyright (c) 2021 ALSENET SA
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

var config =require('../../../../config.json');
var request=require('request');
const Buffer = require('safe-buffer').Buffer;

module.exports=[
  '$q',
  function(
    $q
  ){
    var service=this;
    angular.extend(service,{
      uploadDirectory: function(blob){
        return blob.arrayBuffer()
        .then(function(buf){
          var q=$q.defer();
          request({
            url:  config.ethswarm.baseUrl+'dirs',
            method: 'POST',
            body: Buffer.from(buf,'binary'),
            headers: {
              'content-type': 'application/x-tar',
              'swarm-encrypted': (config.ethswarm.uploadEncrypted===true).toString()
            }
          }, function(err, res, body){
            if (err){
              console.log(err);
              q.reject(err);
            } else {
              console.log(body);
              q.resolve(JSON.parse(body))
            }
          });
          return q.promise;
        });
      } // uploadDirectory
    });
  }
];
