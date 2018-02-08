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

var config =require('../../../../config.eth.js');
var Eth=require('ethjs');
var Q=require('q');

module.exports=[
  '$q',
  function($q){
    var service=this;
    var eth;

    angular.extend(service,{

      enabled: config.enabled,

      network_description: {
        1: 'This is mainnet',
        2: 'This is the deprecated Morden test network.',
        3: 'This is the ropsten test network.',
        4: 'This is the Rinkeby test network.',
        42: 'This is the Kovan test network.'
      },

      network_name: {
        1: 'mainnet',
        2: 'morden',
        3: 'ropsten',
        4: 'rinkeby',
        42: 'kovan'
      },

      init: function(){
        var provider;

        if (!service.eth) {
          if (config.provider)
            provider=new Eth.HttpProvider(config.provider);
          else if (typeof web3 !== 'undefined')
            provider=web3.currentProvider;
          else
            provider=new Eth.HttpProvider('http://localhost:8545');

          service.eth=new Eth(provider);
        }
        eth=service.eth;

        return Q.fcall(function(){
          var q=Q.defer();
          eth.accounts()
          .then(function(accounts){
            service.account=config.account||accounts[0];
            q.resolve();
          })
          .catch(function(err){
            if (eth.currentProvider.host==config.publicProvider) {
              q.reject(err);
            } else {
              console.log('Local service not found, falling back to public provider');
              eth=service.eth=new Eth(new Eth.HttpProvider(config.publicProvider));
              q.resolve();
            }
          });
          return q.promise;
        })
        .then(function(){
          return eth.net_version()
        })
        .then(function(netId){
          service.netId=netId;
          console.log(service.network_description[netId]||'This is an unknown network.');
        })
        .catch(console.log);
      } // init

    }); // extend web3

    if (service.enabled) {
      service.promise=service.init();
    }

  }
];
