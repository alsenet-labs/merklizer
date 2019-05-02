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
var reduce=require('../modules/reduce.js');

module.exports=[
  '$q',
  function($q){
    var service=this;
    angular.extend(service,{
      filters: [],
      filterFile: function(file){
        var promise=Promise.resolve();
        return reduce(service.filters,promise,function(promise,filter){
          return filter(file)
          .then(function(filtered){
            promise.break=filtered;
            return filtered;
          });
        });
      },
      read: function(file,method) {
        var q=$q.defer();
        var reader;

        if (service.parallelize) {
          reader=new FileReader();
        } else {
          reader=service.reader=service.reader||new FileReader();
        }

        function load_listener(e){
          removeListeners();
          q.resolve(reader.result);
        }

        function abort_listener(e){
          removeListeners();
          q.reject(new Error('aborted'));
        }

        function error_listener(e){
          removeListeners();
          q.reject(new Error('error'));
        }

        function removeListeners(){
          reader.removeEventListener('load',load_listener);
          reader.removeEventListener('abort',abort_listener);
          reader.removeEventListener('error',error_listener);
        }

        reader.addEventListener('load',load_listener);
        reader.addEventListener('error',error_listener);
        reader.addEventListener('abort',abort_listener);

        reader[method](file);
        return q.promise;

      } // read
    });
  }
];
