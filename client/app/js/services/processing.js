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

var Q=require('q');
var JSZip=require('jszip');

module.exports = [
  '$rootScope',
  '$window',
  '$timeout',
  'merkle',
  'ethService',
  'tierion',
  'FileSaver',

  function(
    $rootScope,
    $window,
    $timeout,
    merkle,
    ethService,
    tierion,
    FileSaver

  ) {
    var service=this;
    angular.extend(service,{
      prefix: '4d45524b4c495a45', // MERKLIZE

      init: function(){
      }, // init

      showOverlay: function(options){
        $rootScope.$broadcast('showOverlay',options);
      },

      hideOverlay: function(){
        $rootScope.$broadcast('hideOverlay');
      },

      processFiles: function processFiles(queue){
        service.showOverlay({
          message: 'Processing files...',
          showProgress: true
        });
        service.tree=merkle.compute(queue);
        var q;

        // Tierion
        if (tierion.enabled) {
          service.showOverlay({
            message: 'Submitting hash to Tierion...',
            showProgress: false
          });
          if (!q) {
            q=Q.resolve();
          }
          q=q.then(function(){
            var q=Q.defer();
            tierion.hashClient.submitHashItem(service.prefix+merkle.getRoot(service.tree),function(err,receipt){
              if (err) {
                q.reject(err);
              } else {
                service.tree.tierion_receipt=receipt;
                console.log(receipt);
                q.resolve()
              }
            });
            return q.promise;
          });
        }

        // Ethereum
        if (ethService.enabled) {
          service.showOverlay({
            message: 'Please submit or reject transaction using Metamask.',
            showProgress: false,
            showButton: false
          });

          if (!q) {
            q=Q.resolve();
          }
          q=q.then(function() {
            return Q.fcall(function(){
              // check default account again
              return ethService.init()
              .then(function(){
                if (!ethService.account) {
                   throw new Error('You must login with MetaMask first !');
                }
                return ethService.eth.sendTransaction({
                  from: ethService.account,
                  to: ethService.account,
                  value: '0',
                  data: '0x'+service.prefix+merkle.getRoot(service.tree),
                  gas: '250000'
                })
                .then(function loop(result){
                  console.log(result);
                  service.tree.eth_transactionId=result;
                  service.showOverlay({
                    message: 'Waiting for transaction block...',
                    showProgress: true,
                    showButton: true
                  });

                  return Q(ethService.eth.getTransactionByHash(result))
                  .then(function(transaction){
                    if (!transaction) {
                      var qq=Q.defer();
                      $timeout(function(){
                        loop(result)
                        .then(qq.resolve);
                      },15000);
                      return qq.promise;
                    } else {
                      console.log(JSON.stringify(transaction,false,4));
                    }
                  });
                });

              });
            });
          });
        }

        q.then(function(){
          service.downloadArchive(queue);
        })
        .catch(function(err){
          service.hideOverlay();
          console.log('Error !',err);
          $window.alert(err.message||(err.value&&err.value.message&&err.value.message.split('\n')[0])||'Unexpected error !');
        })
        .finally(function(){
          service.hideOverlay();
        })
        .done();

      }, // processFiles

      downloadArchive: function downloadArchive(queue){
        service.showOverlay({
          message: 'Build archive...',
          showProgress: true
        });
        var zip=new JSZip();
        var folder=zip.folder(merkle.hashToString(service.tree[0][0]));
        var date=(new Date()).toISOString();
        var output;
        queue.forEach(function(file,i){
          output=$.extend(true,{},file.proof,{
            root: merkle.hashToString(file.proof.root),
            hash: merkle.hashToString(file.proof.hash),
            date: date
          });

          function pushAnchor(anchor){
            if (!output.anchors){
              file.proof.anchors=output.anchors=(file.proof.anchors||[]);
            }
            output.anchors.push(anchor);
          }

          if (service.tree.eth_transactionId) {
            pushAnchor({
              type: 'ethereum',
              networkId: ethService.netId,
              transactionId: service.tree.eth_transactionId
            });
          }

          if (service.tree.tierion_receipt) {
            pushAnchor({
              type: 'tierion',
              receipt: service.tree.tierion_receipt
            });
          }

          output.operations.some(function(op,i){
            if (op.left) {
               op.left=merkle.hashToString(op.left);

            } else {
              if (op.right) {
                op.right=merkle.hashToString(op.right);
              }
            }
          });
          folder.file(file.name+'.json',JSON.stringify(output,false,2));

        });

        zip.generateAsync({type:"blob"}).then(function(content) {
          service.showOverlay({
            hideDialog: true
          });
          FileSaver.saveAs(content, "proofs-"+output.root+".zip");
          service.hideOverlay();
        });

      }, // downloadArchive

      validate: function(file) {
        var q;

        if (!file.proof) {
          console.log('no merkle proof');
          $window.alert('No merkle proof !');
          return false;
        }

        if (merkle.hashToString(file.proof.hash)!=merkle.hashToString(file.hash)) {
          console.log('hash mismatch !');
          $window.alert('Hash mismatch between file and proof !');
          console.log(proof);
          delete file.proof;
          return false;
        }

        var anchor;
        if (
          ethService.enabled
          && file.proof.anchors.find(function(_anchor){
            if (_anchor.type=='ethereum') {
              anchor=_anchor;
              return true;
            }
          })
        ) {
          service.showOverlay({
            message: 'Retrieving transaction...',
            showProgress: true,
            showButton: true
          });

          if (!q) {
            q=Q.resolve();
          }

          q=q.then(function() {
            // check default account again
            return ethService.init()

          })
          .then(function(){
            if (!ethService.account) {
               throw new Error('You must login with MetaMask first !');
            }
            // check network id
            if (ethService.netId!=anchor.networkId) {
              throw new Error('Ethereum network ID should be '+anchor.networkId);
            }
            // get transaction
            return ethService.eth.getTransactionByHash(anchor.transactionId);

          })
          .then(function(transaction){
            if (!transaction) {
              throw new Error('Transaction could not be retrieved !');
            }
            console.log(JSON.stringify(transaction,false,4));

            service.showOverlay({
              message: 'Checking Merkle proof...',
              showProgress: true,
              showButton: true
            });

            // check merkle root
            var root=file.proof.root;

            if (typeof root != 'string') {
              // allow validating files just processed
              root=merkle.hashToString(root);
            } else {
              // final comparison expects Uint8Array
              file.proof.root=merkle.stringToHash(root);
            }

            if (transaction.input.slice(transaction.input.length-root.length)!=root) {
              throw new Error('Merkle root mismatch !');
            }
            var validated=merkle.checkProof(file.proof);
            console.log('validated: ',validated.toString());
            return validated;

          });
        }

        q.then(function(validated){
          service.showOverlay({
            message: '',
            showProgress: false,
            showButton: false
          });
          var q=Q.defer();
          $timeout(function(){
            q.resolve(validated);
          },1000);
          return q.promise;

        })
        .then(function(validated){
          $window.alert('The proof was '+(validated?'successfuly':'NOT')+' validated !');

        })
        .catch(function(err){
          service.hideOverlay();
          console.log('Error !',err);
          $window.alert(err.message||(err.value&&err.value.message&&err.value.message.split('\n')[0])||'Unexpected error !');

        })
        .finally(function(){
          service.hideOverlay();
          if (anchor && anchor.transactionId) {
            $window.open('https://'+(ethService.network_name[anchor.networkId]||'www')+'.etherscan.io/tx/'+anchor.transactionId,anchor.transactionId);
          }

        })
        .done();

      }

    });

    service.init();
  }
]
