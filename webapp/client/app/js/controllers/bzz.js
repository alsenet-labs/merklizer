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
 * @name merkleApp.controller:BzzCtl
 * @description
 * # BzzCtl
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
          message: 'Retrieving directory index...',
          showProgress: true
        });
        var q=$q.resolve();
        q.then(function(){
          var q=$q.defer();
          var url=$scope.getBzzUrl($scope.$stateParams.path+'/index.json');
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
          if (!obj.Links) {
            q.reject(new Error('Not a anchored directory: '+$scope.$stateParams.path));
            return;
          }

          function downloadLink(link){
            $scope.showOverlay({
              message: 'Retrieving '+link.name+' ...',
              showProgress: true
            });
            var q=$q.defer();
            var url=$scope.getBzzUrl($scope.$stateParams.path+'/'+link.name);
            link.url=url;
            var _request=request({
              url: link.url,
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

          function addProof(link){
              var data=JSON.parse(link._data.body);
              if (data.root && data.hash && data.anchors && data.operations) {
                link.data=data;
                $rootScope.$broadcast('addProof',link);
                return link;
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
              // download and open file
              return downloadLink(link)
              .then(hash)
              .then(function(link){
                window.open(link.objectURL);
                return link;
              })
              .then(function(link){
                // download and open proof
                return downloadLink({name: link.name+'.json'})
                .then(addProof)
                .then(function(link){
                  window.open(link.objectURL);
                  return link;
                })
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

      getBzzUrl: function(path) {
        return $scope.config.ethswarm.baseUrl+'bzz/'+path;
      }

    }); // extend scope

    $scope.init();
  }

];
