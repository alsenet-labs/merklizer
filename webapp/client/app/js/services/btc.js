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

var config =require('../../../../config.btc.js');
const bitcoin = require('bitcoinjs-lib')
const request = require('request');

module.exports=[
  '$q',
  '$window',
  function(
    $q,
    $window
  ){
    var service=this;
    var btc;

    angular.extend(service,{

      enabled: config.enabled,

      key: {
        private: config.key.private,
        public: config.key.public
      },

      getTransactionURL: config.getTransactionURL,
      getAddressURL: config.getAddressURL,


      init: function(){
        try {
          if (!config.enabled) {
            return;
          }
          service.networkId=config.network;
          service.network=bitcoin.networks[config.network];
          if (!service.network) throw new Error('unknown network: '+config.network);
          if (!service.key.private) throw new Error('config.key.private cannot be null.');
          service.keyPair=new bitcoin.ECPair.fromWIF(service.key.private,service.network);
          service.key.public=service.keyPair.getAddress();
        } catch(e) {
          $window.alert('Could not initialize Bitcoin wallet, check config.btc.js. Error message was: "'+e.message+'"');
        }
      },

      getUnspentOutputs: function(){
        var q=$q.defer();
        request.get(config.apiUrl + 'addr/' + service.key.public + '/utxo', function(err, res, body){
          if (err) {
            console.log(err);
            q.reject(err);
          } else if (res.statusCode!=200) {
              console.log(res);
              q.reject(new Error('Server replied with HTTP status code: '+res.statusCode));
          } else {
            console.log(body)
            try {
              var obj=JSON.parse(body);
            } catch(e) {
              q.reject(e);
            }
            q.resolve(obj);
          }
        });
        return q.promise;
      },

      getBalance: function(){
        var q=$q.defer();
        request.get(config.apiUrl + 'addr/' + service.key.public + '/balance', function(err, res, body){
          if (err) {
            console.log(err);
            q.reject(err);
          } else if (res.statusCode!=200) {
              console.log(res);
              q.reject(new Error('Server replied with HTTP status code: '+res.statusCode));
          } else {
            var balance=Number(body);
            console.log(balance);
            if (isNaN(balance)) {
              q.reject(new Error('could not get balance'));
            } else {
              q.resolve(balance);
            }
          }
        });
        return q.promise;
      },

      getInputs: function(utxo,satoshis){
        utxo.sort(function(a,b){
          if (a.confirmations<b.confirmations) return -1;
          if (a.confirmations>b.confirmations) return 1;
          return 0;
        });

        var inputs=[];
        var remaining=[];
        var balance=0;
        utxo.some(function(tx){
          if (tx.amount && tx.confirmations>6) {
            inputs.push(tx);
            balance+=tx.satoshis;
          } else {
            remaining.push(tx);
          }
          return (balance>=satoshis);
        });

        if (balance<satoshis) {
          remaining.some(function(tx){
            if (tx.amount && tx.confirmations>=1) {
              inputs.push(tx);
              balance+=tx.satoshis;
            }
            return (balance>=satoshis);
          });
        }

        if (balance<satoshis) {
          throw new Error('Could not gather the requested amount in confirmed unspent outputs.');
        }

        return {
          inputs: inputs,
          balance: balance
        };

      },

      buildTransaction: function(options){
        var satoshis=options.satoshis||0;
        var fees=options.fees;
        var from=options.from;
        var to=options.to;
        var data=options.data;

        if (!fees) {
          return $q.reject(new Error('fees cannot be null'));
        }
        if (!from) {
          return $q.reject(new Error('from cannot be null'));
        }
        if (!to) {
          return $q.reject(new Error('to cannot be null'));
        }

        return service.getBalance()
        .then(function(balance){
          if (balance<satoshis+fees) {
            throw new Error('insufficient balance');
          }
        })
        .then(service.getUnspentOutputs)
        .then(function(utxo){
          return service.getInputs(utxo,satoshis+fees);
        })
        .then(function(result){
          var tx=new bitcoin.TransactionBuilder(service.network);

          result.inputs.forEach(function(utxo){
            tx.addInput(utxo.txid,utxo.vout);
          });

          // return unspent bitcoins to ourself
          tx.addOutput(from,result.balance-(satoshis+fees));

          if (from==to) {
            // assume we are anchoring data
            if (!data) {
              throw new Error("invalid transaction (no data specified)");
            }
            var dataScript=bitcoin.script.compile([
              bitcoin.opcodes.OP_RETURN,
              data
            ]);
            tx.addOutput(dataScript,0);

          } else {
            if (!satoshis) {
              throw new Error('transaction amount is null');
            }
            tx.addOutput(to,satoshis);
          }

          tx.sign(0,service.keyPair);

          var txraw=tx.build();
          var txhex=txraw.toHex();

          console.log('tx :'+txhex);
          return txhex;
        });

      }, // buildTransaction

      sendRawTransaction: function(txhex){
        var q=$q.defer();
        request.post({
          url: config.apiUrl + 'tx/send',
          form: {rawtx: txhex}
        }, function(err, res, body){
          if (err) {
            console.log(err);
            q.reject(err);
          } else if (res.statusCode!=200) {
              console.log(res);
              q.reject(new Error('Server replied with HTTP status code: '+res.statusCode));
          } else {
            try {
              var obj=JSON.parse(body);
            } catch(e) {
              q.reject(e);
            }
            q.resolve(obj);
          }
        });

        return q.promise;

      }, // sendRawTransaction

      sendTransaction: function(options){
        return service.buildTransaction(options)
        .then(service.sendRawTransaction);
      },

      getTransaction: function(txid){
        var q=$q.defer();
        request.get({
          url: config.apiUrl + 'tx/' + txid
        }, function(err, res, body) {
          if (err) {
            console.log(err);
            q.reject(err);
          } else if (res.statusCode!=200) {
              console.log(res);
              q.reject(new Error('Server replied with HTTP status code: '+res.statusCode));
          } else {
            try {
              var obj=JSON.parse(body);
            } catch(e) {
              q.reject(e);
            }
            q.resolve(obj);
          }
        });
        return q.promise;
      }

    });

    service.init();
  }
];
