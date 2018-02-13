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

var JSZip=require('jszip');

module.exports = [
  '$q',
  '$rootScope',
  '$window',
  '$timeout',
  'merkle',
  'ethService',
  'tierion',
  'FileSaver',
  'pdfService',

  function(
    $q,
    $rootScope,
    $window,
    $timeout,
    merkle,
    ethService,
    tierion,
    FileSaver,
    pdfService

  ) {
    var service=this;
    angular.extend(service,{
      prefix: '',

      cached_transactions: {},

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

        function pushAnchor(anchor){
          queue.anchors=queue.anchors||[];
          queue.anchors.push(anchor);
        }

        var q;

        // Tierion
        if (tierion.enabled) {
          service.showOverlay({
            message: 'Submitting hash to Tierion...',
            showProgress: false
          });
          if (!q) {
            q=$q.resolve();
          }
          q=q.then(function(){
            var q=$q.defer();
            tierion.hashClient.submitHashItem(service.prefix+merkle.getRoot(service.tree),function(err,receipt){
              if (err) {
                q.reject(err);
              } else {
                console.log(receipt);
                pushAnchor({
                  type: 'tierion',
                  receipt: receipt
                });
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
            q=$q.resolve();
          }
          q=q.then(function() {
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
                service.showOverlay({
                  message: 'Waiting for transaction block...',
                  showProgress: true,
                  showButton: true
                });

                return ethService.eth.getTransactionByHash(result)
                .then(function(transaction){
                  if (!transaction) {
                    var qq=$q.defer();
                    $timeout(function(){
                      loop(result)
                      .then(qq.resolve);
                    },15000);
                    return qq.promise;

                  } else {
                    console.log(JSON.stringify(transaction,false,4));
                    pushAnchor({
                      type: 'ethereum',
                      networkId: parseInt(ethService.netId),
                      transactionId: transaction.hash
                    });
                  }
                });
              });
            });
          });
        }

        q.then(function(){
          service.downloadArchive(queue);
        })
        .then(function(){
          queue.forEach(function(file){
            file.proof.validated=true;
          });
        })
        .catch(function(err){
          service.hideOverlay();
          console.log('Error !',err);
          $window.alert(err.message||(err.value&&err.value.message&&err.value.message.split('\n')[0])||'Unexpected error !');
        })
        .finally(function(){
          service.hideOverlay();
        });

      }, // processFiles

      getReadableProof: function(proof) {
        return {
          hashType: proof.hashType,
          root: merkle.hashToString(proof.root),
          hash: merkle.hashToString(proof.hash),
          operations: (function(){
            var result=[];
            proof.operations.forEach(function(op){
              if (op.left) {
                result.push({left: merkle.hashToString(op.left)});
              } else {
                if (op.right) {
                  result.push({right: merkle.hashToString(op.right)});
                } else {
                  throw new Error('invalid proof');
                }
              }
            });
            return result;
          })(),
          anchors: proof.anchors,
          date: proof.date
        }
      }, // getReadableProof

      downloadArchive: function downloadArchive(queue){
        service.showOverlay({
          message: 'Build archive...',
          showProgress: true
        });

        var zip=new JSZip();
        var merkleRoot=merkle.getRoot(service.tree);
        var folder=zip.folder(/*merkleRoot*/);

        queue.forEach(function(file,i){
          file.proof.anchors=queue.anchors;
          folder.file(file.name+'.json',JSON.stringify(service.getReadableProof(file.proof),false,2));
        });

        zip.generateAsync({type:"blob"}).then(function(content) {
          service.showOverlay({
            hideDialog: true
          });
          FileSaver.saveAs(content, "proofs-"+merkleRoot+".zip");
          service.hideOverlay();
        });

      }, // downloadArchive

      validate: function(file, options) {
        var q;

        if (!file.proof) {
          console.log('no merkle proof',file);
          if (!options.silent) {
            $window.alert('No merkle proof !');
          }
          return $q.resolve(false);
        }

        if (file.proof.validated!==undefined) {
          return $q.resolve(file.proof.validated);
        }

        if (merkle.hashToString(file.proof.hash)!=merkle.hashToString(file.hash)) {
          console.log('hash mismatch between file and proof !',file);
          if (!options.silent) {
            $window.alert('Hash mismatch between file and proof !');
          }
          file.proof.validated=false;
          return q.resolve(false);
        }

        // TODO: many anchors
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
            q=$q.resolve();
          }

          q=q.then(function() {
            // check default account again
            return ethService.init();

          })
          .then(function(){
            ethService.account && console.log('account '+ethService.account);

            // check network id
            if (ethService.netId!=anchor.networkId) {
              throw new Error('You are connected on '+ethService.network_name[ethService.netId]+' but the Merkle root has been anchored to '+ethService.network_name[anchor.networkId]);
            }

            // get transaction
            if (service.cached_transactions[anchor.transactionId]) {
              return service.cached_transactions[anchor.transactionId];
            } else {
              return ethService.eth.getTransactionByHash(anchor.transactionId)
              .then(function(transaction){
                service.cached_transactions[anchor.transactionId]=transaction;
                console.log(JSON.stringify(transaction,false,4));
                return transaction;
              });
            }

          })
          .then(function(transaction){
            // get block
            if (transaction.block) {
              return transaction;
            } else {
              return ethService.eth.getBlockByNumber(transaction.blockNumber,false)
              .then(function(block){
                transaction.block=block;
                console.log(JSON.stringify(block,false,4));
                return transaction;
              })
            }

          })
          .then(function(transaction){
            transaction.block._date=new Date(transaction.block.timestamp*1000).toISOString();

            anchor.transaction=transaction;

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
              file.proof.validated=false;
              throw new Error('Merkle root mismatch !');
            }
            var validated=merkle.checkProof(file.proof);
            file.proof.validated=validated;
            console.log(file.name+' validated: ',validated.toString());
            return validated;

          });
        }

        return q.then(function(validated){
          service.showOverlay({
            message: '',
            showProgress: false,
            showButton: false
          });
          var q=$q.defer();
          $timeout(function(){
            q.resolve(validated);
          },1000);
          return q.promise;

        })
        .then(function(validated){
          if (!options.silent) {
            $window.alert('The proof was '+(validated?'successfuly':'NOT')+' validated !');
          }
          return validated;

        })
        .catch(function(err){
          service.hideOverlay();
          console.log('Error !',err);
          $window.alert(err.message||(err.value&&err.value.message&&err.value.message.split('\n')[0])||'Unexpected error !');

        })
        .finally(function(){
          service.hideOverlay();
        });

      }, // validate

      showProof: function(proof,title){
        proof=service.getReadableProof(proof);
        var w=$window.open('',title||proof.hash);
        $timeout(function(){
          w.document.open();
          w.document.write('<html><head><meta charset="UTF8" /><title>'+(title||proof.hash)+'</title></head><body><pre>'+JSON.stringify(proof,false,2)+'</pre></body></html>');
          w.document.close();
        });
      }, // showProof

      showAllAnchors: function(anchors){
        angular.forEach(anchors,function(anchor){
          service.showAnchor(anchor);
        });
      },

      showAnchor: function(anchor){
        switch(anchor.type) {
          case 'ethereum':
            $window.open(service.getAnchorUrl(anchor),anchor.transactionId);
            break;
        }
      },

      getAnchorUrl: function(anchor) {
        switch(anchor.type) {
          case 'ethereum':
             var subdomain=(anchor.networkId==1)?'':(ethService.network_name[anchor.networkId]+'.');
             return 'https://'+subdomain+'etherscan.io/tx/'+anchor.transactionId;
         }
      }, // getAnchorUrl

      validateAll: function(files) {
        var q=$q.defer();
        var count=0;
        var index=0;
        (function loop(){
          var file=files&&files[index++];
          if (!file) {
            q.resolve();
            return;
          }
          if (!file.proof) {
            loop();
            return;
          }
          ++count;
          if (file.proof.validated) {
            loop();
            return;
          }
          service.validate(file,{
            silent: true
          })
          .then(loop);

        })();

        return q.promise.then(function(){
          var failures=0;
          files.forEach(function(file){
            if (file.proof && !file.proof.validated) {
              ++failures;
            }
          });

          if (!failures) {
            if (count) {
              $window.alert('Validation was successful.');
            }
          } else {
            $window.alert(failures+' file'+(failures>1?'s':'')+' could not be validated.');
          }
        });

      } // validateAll

    });

    service.init();
  }
]
