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
              output.anchors=[];
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

      } // downloadArchive

    });

    service.init();
  }
]
