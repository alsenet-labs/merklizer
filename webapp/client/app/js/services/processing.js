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
const Buffer = require('safe-buffer').Buffer;

module.exports = [
  '$q',
  '$rootScope',
  '$window',
  '$timeout',
  'merkle',
  'ethService',
  'btcService',
//  'tierion',
  'FileSaver',
//  'pdfService',

  function(
    $q,
    $rootScope,
    $window,
    $timeout,
    merkle,
    ethService,
    btcService,
//    tierion,
    FileSaver,
//    pdfService

  ) {
    var service=this;
    angular.extend(service,{
      prefix: '',
      blocksToGo: -1, // infinite

      cached_transactions: {},
      cached_blocks: {},

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
        /*
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
        */

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
                gas: '25000'
              })
              .then(function(result) {
                service.showOverlay({
                  message: 'Waiting for receipt...',
                  showProgress: true,
                  showButton: true
                });
                var _q=$q.defer();
                $timeout(function(){
                  _q.resolve(result);
                },10000);
                return _q.promise;
              })
              .then(function getTransaction_loop(result,options){
                console.log(result);
                var stopHere=false;
                var blocksToGo=service.blocksToGo;
                return ethService.eth.getTransactionReceipt(result)
                .then(function(receipt){
                  if (!receipt || !receipt.blockNumber) {
                    var qq=$q.defer();
                    $timeout(function(){
                      getTransaction_loop(result)
                      .then(qq.resolve);
                    },10000);
                    return qq.promise;

                  } else {
                    if (receipt.status!=1) {
                      throw new Error('Transaction failed !');
                    }
                    return receipt;
                  }
                })
                .then(function waitNextBlocks(receipt, looping){
                  if (!receipt) {
                    console.log('huh?');
                    return;
                  }

                  // maybe the receipt block number changed while waiting (?)
                  if (options && options.blockNumber.eq(receipt.blockNumber)) {
                    return receipt;
                  }

                  if (!looping) {
                    service.showOverlay({
                      message: 'Waiting for more blocks...',
                      showProgress: true,
                      showButton: false
                    });
                  }

                  return ethService.eth.blockNumber()
                  .then(function(blockNumber){
                    if (stopHere) {
                      return;
                    }

                    if (!receipt) {
                      console.log('huh??');
                      return;
                    }

                    var blocksCount=blockNumber.sub(receipt.blockNumber);
                    console.log('blocks after: '+blocksCount);

                    if ((service.blocksToGo>0 && blocksCount>=service.blocksToGo) || stopHere) {
                      // just to be sure... maybe the transaction block number changed while waiting
                      return getTransaction_loop(result,{blockNumber: receipt.blockNumber});

                    } else {
                      // wait more blocks
                      var n;
                      var message;

                      if (service.blocksToGo>0) {
                        if (blocksCount>0) {
                          n=blocksToGo=service.blocksToGo-blocksCount;
                        } else {
                          n=blocksToGo;
                        }
                        message='Waiting for '+n+' more block'+(n>1?'s':'')+'...';

                      } else {
                        if (blocksCount>0) {
                          message=blocksCount+' confirmation'+(blocksCount>1?'s':'')+' so far.';
                        } else {
                          message=null;
                        }
                      }

                      var qqq=$q.defer();

                      service.showOverlay({
                        message: message,
                        showProgress: true,
                        showButton: true,
                        buttonText: 'Stop',
                        onclick: function(){
                          stopHere=true;
                          qqq.resolve(getTransaction_loop(result,{blockNumber: receipt.blockNumber}));
                        }
                      });

                      $timeout(function(){
                        waitNextBlocks(receipt,true)
                        .then(qqq.resolve);
                      },20000);
                      return qqq.promise;
                    }
                  });

                })
                .then(function(receipt){
                  if (!receipt) {
                    console.log('huh');
                    return $q.resolve();
                  }
                  console.log(JSON.stringify(receipt,false,4));
                  return $q.resolve(receipt)
                  .then(service.getTransactionBlock)
                  .then(function(receipt){
                    pushAnchor({
                      type: 'ethereum',
                      networkId: parseInt(ethService.netId),
                      transactionId: receipt.transactionHash,
                      blockId: receipt.block.hash,
                      blockDate: service.getBlockDate(receipt.block)
                    });
                  });
                });
              });
            });
          });
        }

        if (btcService.enabled) {
          service.showOverlay({
            message: 'Submitting Bitcoin transaction...',
            showProgress: false,
            showButton: false
          });

          if (!q) {
            q=$q.resolve();
          }
          q=q.then(function() {
            return btcService.sendTransaction({
              from: btcService.keyPair.getAddress(),
              to: btcService.keyPair.getAddress(),
              data: new Buffer(merkle.stringToHash(service.prefix+merkle.getRoot(service.tree)).buffer),
              satoshis: 0,
              fees: 10000
            })
            .then(function getBitcoinTransaction_loop(receipt){
              service.showOverlay({
                message: 'Waiting for Bitcoin transaction confirmation...',
                showProgress: false,
                showButton: false
              });
              return btcService.getTransaction(receipt.txid)
              .then(function(transaction){
                console.log(transaction);
                if (transaction.confirmations<1) {
                  var qq=$q.defer();
                  $timeout(function(){
                    getBitcoinTransaction_loop(receipt)
                    .then(qq.resolve)
                    .catch(qq.reject);
                  },30000);
                  return qq.promise;

                }
                pushAnchor({
                  type: 'bitcoin',
                  networkId: btcService.networkId,
                  transactionId: transaction.txid,
                  blockId: transaction.blockhash,
                  blockDate: new Date(transaction.blocktime*1000).toISOString()
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

      getTransactionBlock: function(transaction,options){
        // get block
        if (transaction.block) {
          return transaction;
        } else {
          if ((options&&options.cache) && service.cached_blocks[transaction.blockHash]) {
            transaction.block=service.cached_blocks[transaction.blockHash];
            return transaction;
          }
          var q;
//          if (transaction.blockNumber) {
//            q=ethService.eth.getBlockByNumber(transaction.blockNumber,false);
//          } else {
            q=ethService.eth.getBlockByHash(transaction.blockHash,false);
//          }
          return q.then(function(block){
            if (options&&options.cache) {
              service.cached_blocks[block.hash]=block;
            }
            transaction.block=block;
            console.log(JSON.stringify(block,false,4));
            return transaction;
          })
        }
      },

      getBlockDate: function(block) {
        return new Date(block.timestamp*1000).toISOString();
      },

      validate: function(file, options) {
        options=options||{};

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

        if (file.hash && merkle.hashToString(file.proof.hash)!=merkle.hashToString(file.hash)) {
          console.log('hash mismatch between file and proof !',file);
          if (!options.silent) {
            $window.alert('Hash mismatch between file and proof !');
          }
          file.proof.validated=false;
          return $q.resolve(false);
        }

        var promises=[];
        file.proof.anchors.forEach(function(anchor){
          switch(anchor.type) {
            case 'ethereum':
              if (ethService.enabled) {
                anchor.validated=false;
                promises.push(validateEthereumAnchor(anchor));
              }
              break;
            case 'bitcoin':
              if (btcService.enabled) {
                anchor.validated=false;
                promises.push(validateBitcoinAnchor(anchor));
              }
              break;
          }
        });

        // TODO: many anchors
        function validateEthereumAnchor(anchor) {
          var q=$q.resolve();

          service.showOverlay({
            message: 'Retrieving ethereum transaction...',
            showProgress: true,
            showButton: true
          });

          return q.then(function() {
            // check default account again
            return ethService.init(anchor.networkId);

          })
          .then(function(){
            ethService.account && console.log('account '+ethService.account);

            // check network id
            if (ethService.netId!=anchor.networkId) {
              throw new Error('You are connected on '+ethService.network_name[ethService.netId]+' but the Merkle root has been anchored to '+ethService.network_name[anchor.networkId]);
            }

            // get transaction
            if (options && options.cache && service.cached_transactions[anchor.transactionId]) {
              return service.cached_transactions[anchor.transactionId];
            } else {
              return ethService.eth.getTransactionByHash(anchor.transactionId)
              .then(function(transaction){
                if (options && options.cache) {
                  service.cached_transactions[anchor.transactionId]=transaction;
                }
                console.log(JSON.stringify(transaction,false,4));
                return transaction;
              });
            }
          })

          // get block
          .then(service.getTransactionBlock)

           // validate data
          .then(function(transaction){

            // check block hash
            if (transaction.block.hash!=anchor.blockId) {
              throw new Error('Block hash mismatch !');
            }

            // check block date
            if (service.getBlockDate(transaction.block)!=anchor.blockDate) {
              throw new Error('Block date mismatch !');
            }

            anchor.transaction=transaction;
            return validateAnchor(file, anchor);


          });
        } // validateEthereumAnchor

        function validateAnchor(file, anchor) {
          service.showOverlay({
            message: 'Checking Merkle proof...',
            showProgress: true,
            showButton: true
          });

          // check file hash
          if (merkle.hashToString(file.hash)!=file.proof.hash) {
            throw new Error('File hash mismatch !');
          }

          // check merkle root
          var root=file.proof.root;

          if (typeof root != 'string') {
            // allow validating files just processed
            root=merkle.hashToString(root);
          } else {
            // final comparison expects Uint8Array
            file.proof.root=merkle.stringToHash(root);
          }

          // compare merkle roots
          var txroot;
          switch(anchor.type) {
            case 'ethereum':
              txroot=anchor.transaction.input.slice(anchor.transaction.input.length-root.length);
              break;
            case 'bitcoin':
              anchor.transaction.vout.some(function(out){
                if (out.value==0) {
                  var script=out.scriptPubKey.asm.split(' ');
                  if (script[0]=='OP_RETURN') {
                    txroot=script[1];
                    return true;
                  }
                }
              });
              break;
          }

          if (txroot!=root) {
            throw new Error('Merkle root mismatch !');
          }

          // check merkle proof
          var validated=merkle.checkProof(file.proof);
          anchor.validated=validated;
          console.log(file.name+' validated on '+anchor.type+'('+anchor.networkId+'): ',validated.toString());
          return validated;
        } // validateAnchor

        function validateBitcoinAnchor(anchor){
          service.showOverlay({
            message: 'Retrieving bitcoin transaction...',
            showProgress: true,
            showButton: true
          });

          // check network id
          if (btcService.networkId!=anchor.networkId) {
            return $q.reject(new Error('You are connected on '+btcService.networkId+' but the Merkle root has been anchored to '+anchor.networkId));
          }

          return $q.resolve().then(function() {
            return btcService.getTransaction(anchor.transactionId)
            .then(function(transaction){
              console.log(transaction);
              anchor.transaction=transaction;
              // compare timestamp
              if (anchor.blockDate!=new Date(transaction.blocktime*1000).toISOString()) {
                throw new Error('Bitcoin block date mismatch');
              }
              if (anchor.blockId!=transaction.blockhash) {
                throw new Error('Bitcoin block hash mismatch');
              }
              return validateAnchor(file,anchor);
            });
          });
        }

        return $q.all(promises).then(function(){
          var validated=false;
          file.proof.anchors.some(function(anchor){
            if (anchor.validated!==undefined) {
              validated=anchor.validated;
              return !validated;
            }
          });
          file.proof.validated=validated;
          return validated;
        }).then(function(validated){
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
          $rootScope.$broadcast('filesValidated',files);
/*
          var failures=0;
          files.forEach(function(file){
            if (file.proof) {
              if (!file.proof.validated) {
                ++failures;
              }
            }
          });

          if (!failures) {
            if (count) {
//              $window.alert('Validation was successful.');
              $rootScope.$state.go('report',{files: files});
            }
          } else {
            $window.alert(failures+' file'+(failures>1?'s':'')+' could not be validated.');
            $rootScope.$state.go('report',{files: files});
          }
*/
        });

      } // validateAll

    });

    service.init();
  }
]
