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

var config = require('../../../../config.tierion.js');

module.exports=[
  '$q',
  function($q){
    var tierion=this;

    angular.extend(tierion,{
      enabled: config.enabled,

      hashClient: require('hashapi-lib-node')(),

      init: function(){
        var q=$q.defer();
        tierion.promise=q.promise;

        tierion.hashClient.authenticate(config.username, config.password, function(err, authToken){
          if(err) {
            console.log(err);
            q.reject(err);

          } else {
            console.log('authToken',authToken);
            tierion.authToken=authToken;
            q.resolve(authToken);
          }
        });

      }, // init

    }); // extend tierion

    if (tierion.enabled) {
      tierion.init();
    }

  }
];
