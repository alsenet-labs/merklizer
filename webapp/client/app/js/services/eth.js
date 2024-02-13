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

      _eth: {},

      getTransactionURL: config.getTransactionURL,
      getAddressURL: config.getAddressURL,

      network_description: {
        1: 'This is mainnet',
        11155111: 'This is the Sepolia test network'
 //       1337: 'This is the Localhost test network'
      },

      network_name: {
        1: 'mainnet',
        11155111: 'sepolia'
      },

      getWeb3Network: function() {
        var q=Q.defer();
        if (typeof web3 != 'undefined') {
          web3.version.getNetwork(function(err,netId) {
            if (err) {
              q.reject(err);
            } else {
              if (!service.network_name[netId]) {
                alert('Network ID '+netId+ ' is unsupported. You may report this issue on https://github.com/alsenet-labs/merklizer/issues');
              }
              q.resolve(service.network_name[netId]||netId);
            }
          });
        } else {
          q.resolve();
        }
        return q.promise;
      },

      init: function(network){
        var provider;

        if (!network) {
          network=config.network;
        }
        network=service.network_name[network]||network;

        function metamask_enableEthereum(){
          if (window && window.ethereum && window.ethereum.enable) {
            try {
              return window.ethereum.enable().catch(console.log);
            } catch(e) {
              console.log(e);
            }
          }
          return Q.resolve();
        }

        return metamask_enableEthereum()
        .then(service.getWeb3Network)
        .then(function(web3Network){
          if (!service._eth[network]) {
            // give priority to Metamask over configuration file
            if (config.provider[network] && web3Network!=network)
              provider=new Eth.HttpProvider(config.provider[network]);
            else if (web3Network==network)
              provider=web3.currentProvider;
            else
              provider=new Eth.HttpProvider('http://localhost:8545');

            service._eth[network]=new Eth(provider);
          }
          eth=service.eth=service._eth[network];

        })
        .then(function(){
          var q=Q.defer();
          eth.accounts()
          .then(function(accounts){
            service.account=config.account||accounts[0];
            q.resolve();
          })
          .catch(function(err){
            if (eth.currentProvider.host==config.publicProvider[network]) {
              q.reject(err);
            } else {
              console.log('Local service not found, falling back to public provider');
              if (!config.publicProvider[network]) {
                throw new Error('No public provider defined for '+network);
              }
              eth=service.eth=service._eth[network]=new Eth(new Eth.HttpProvider(config.publicProvider[network]));
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
          if (service.network_name[netId]!=network) {
            throw new Error('You requested to connect on '+network+' but you were connected on '+(service.network_name[netId]||netId)+' !');
          }
        })
        .catch(console.log);
      } // init

    }); // extend web3

    if (service.enabled) {
      service.promise=service.init();
    }

  }
];
