/*
* Copyright (c) 2018-2021 ALSENET SA
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
 * @name merkleApp.controller:IpfsCtrl
 * @description
 * # IpfsCtrl
 * Controller of the merkleApp
 */

var request=require('request');
var progress=require('request-progress');

module.exports=[
  '$scope',
  '$rootScope',
  '$timeout',
  '$q',
  'merkle',
  function (
    $scope,
    $rootScope,
    $timeout,
    $q,
    merkle
  ) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    angular.extend($scope,{
      init: function(){
        $scope.showOverlay({
          message: 'Retrieving directory...',
          showProgress: true
        });
        var q=$q.resolve();
        q.then(function(){
          var q=$q.defer();
          var url=$scope.getIpfsUrl('api/v0/object/get/'+$scope.$stateParams.path);
          request(url, function(err, res, body){
            if (err) {
              console.log(err);
              q.reject(new Error('Could not download '+url));
            } else {
              q.resolve($scope.obj=JSON.parse(body));
            }
          });
          return q.promise;
        })
        .then(function downloadAll(obj){
          console.log(JSON.stringify(obj,false,4));
          if (obj.Data!="\u0008\u0001") {
            q.reject(new Error('Not an IPFS directory: '+$scope.$stateParams.path));
            return;
          }

          function downloadLink(link){
            $scope.showOverlay({
              message: 'Retrieving '+link.Name+' ...',
              showProgress: true
            });
            var q=$q.defer();
            var url=$scope.getIpfsUrl('ipfs/'+link.Hash);
            link.url=url;
            var _request=request({
              url: $scope.getIpfsUrl('ipfs/'+link.Hash),
              encoding: null
            }, function(err, res, body){
              if (err) {
                console.log(err);
                q.reject(new Error('Could not download '+url));
              } else {
                link._data={res, body};
                link.blob=new Blob([body],{type: res.headers['content-type']});
                link.objectURL=URL.createObjectURL(link.blob);
                q.resolve(link);
              }
            });
            var _progress=progress(_request)
            .on('progress',function(stats){
              $scope.showOverlay({
                progress: {
                  max: link.Size,
                  value: stats.transferred
                }
              })
            })
            .on('error',function(err){
              console.log(err);
            })
            .on('end', function(){
              console.log('end');
            })

            return q.promise;

          }

          function checkIsProof(link){
            link.name=link.Name;
            var ext=link.name.split('.').pop().toLowerCase();
            if (ext=="json") {
              var data=JSON.parse(link._data.body);
              if (data.root && data.hash && data.anchors && data.operations) {
                link.data=data;
                $rootScope.$broadcast('addProof',link);
                return link;
              } else {
                return hash(link);
              }
            } else {
              return hash(link);
            }
          }

          function hash(link) {
            link.buffer=link._data.body;
            return merkle.hash(link.buffer)
            .then(function(result){
              var hashType=merkle.hashType;
              link.hash={};
              link.hash[hashType]=result;
              link.hash_str={};
              link.hash_str[hashType]=merkle.hashToString(result);
              link.hashType=hashType;
              return link;
            })
          }

          return obj.Links.reduce(function(promise,link){
            return promise.then(function(){
              return downloadLink(link)
              .then(checkIsProof)
              .then(function(link){
                window.open(link.objectURL);
                return link;
              })

            });
          },$q.resolve())
          .then(function(){
            $rootScope.$broadcast('filesReady',obj.Links);
          })

        })
        .catch(function(err){
          console.log(err);
        });
      }, // init

      getIpfsUrl: function(path) {
        return $scope.config.ipfs.baseUrl+path;
      }

    }); // extend scope

    $scope.init();
  }

];
