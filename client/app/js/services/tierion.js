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

var credentials = require('../../../../config.tierion.js');

module.exports=[
  '$q',
  function($q){
    var tierion=this;

    angular.extend(tierion,{
      hashClient: require('hashapi-lib-node')(),

      init: function(){
        var q=$q.defer();
        tierion.promise=q.promise;

        tierion.hashClient.authenticate(credentials.username, credentials.password, function(err, authToken){
          if(err) {
            console.log(err);
            q.reject(err);

          } else {
            console.log('authToken',authToken);
            tierion.authToken=authToken;
/*
            setTimeout(function(){
            tierion.hashClient.getReceipt('5a6f48b44613312f6368a62c',function(err,result){
              console.log(result);

            })
          },1000);
*/
/*
submitHash output:
{receiptId: "5a6f48b44613312f6368a62c", timestamp: 1517242548}
*/

/*
getReceipt output:
"{"@context":"https://w3id.org/chainpoint/v2","type":"ChainpointSHA256v2","targetHash":"296e46f03237abffe21aafd6d3a2f040243eedddb06197701c2c3fe58192f528","merkleRoot":"b805f9bc9f47bd96e39a9035311cbb4f223fbb47ad220a5658183af52f36ed93","proof":[{"left":"6207a5206e71894d5c3cc4b2ad0cc960716a7af916e9790949fabcef4e71ce29"},{"right":"750f8da78a57059835d8b7f936e0156d126ea04a41ab2bd886a356d687e97ac8"},{"right":"a828287b56fe0e983616f68622b8ce152674ac2f9ac59340f1302bf79c4d69ad"},{"right":"ddb023fe7cdf8e44e039b0d15cfb6aee3fcd3634e73da75b4b5eca2d73e21567"},{"left":"7c8ecf5ce5d3af74d791974d83c87123ca0c05b96344439c2cbeb97c6beb993d"},{"right":"27fece6a5abf3910a90ff12c52b62b32df3b1d73e8e262a72134349db2fb0e8c"},{"right":"490fde77565abe9cd0edc7bb7f14b6dbecbf713c819da7becfc4d0efa3b9f89d"},{"left":"01e5bf118151729fd21bd737bffbcd42593abf9c80e2be766a87a08eeda19111"},{"left":"118dfb7ebc272b13f506b88d417e483c62a6630ae70c9ed4131e20f7d64d8ad6"},{"right":"387b41550c6a5fd977095db191ead28d51ae0776e38e52ae61419501175ad3bb"}],"anchors":[{"type":"BTCOpReturn","sourceId":"4123d754410e95798b230cba06c8abdb7819aeb418235953c1d58c8b9438a9a4"}]}"
*/

/*
https://blockexplorer.com/api/tx/4123d754410e95798b230cba06c8abdb7819aeb418235953c1d58c8b9438a9a4
{"txid":"4123d754410e95798b230cba06c8abdb7819aeb418235953c1d58c8b9438a9a4","version":1,"locktime":0,"vin":[{"txid":"5d8ecbb2b964b359f526583ff512500576b9dd3bf640709255e9f3d668a9041b","vout":1,"scriptSig":{"asm":"3045022100c0215692d04bbbc4a497c29cc7f151ad391ac960e980c12a8310e2fd84b7b3d90220060d0183cfb23c793c8dfc1a20a37d225927d0a1349c33f792ca0cbf5cc87550[ALL] 035b690114679d44d75b75aa170e34596c94c778f589bcb9063b0e4e293fcacd1d","hex":"483045022100c0215692d04bbbc4a497c29cc7f151ad391ac960e980c12a8310e2fd84b7b3d90220060d0183cfb23c793c8dfc1a20a37d225927d0a1349c33f792ca0cbf5cc875500121035b690114679d44d75b75aa170e34596c94c778f589bcb9063b0e4e293fcacd1d"},"sequence":4294967295,"n":0,"addr":"1BDHEPgB8iGipkaaJDxkAYjuzvEowNvGG7","valueSat":91361400,"value":0.913614,"doubleSpentTxID":null}],"vout":[{"value":"0.00000000","n":0,"scriptPubKey":{"hex":"6a20b805f9bc9f47bd96e39a9035311cbb4f223fbb47ad220a5658183af52f36ed93","asm":"OP_RETURN b805f9bc9f47bd96e39a9035311cbb4f223fbb47ad220a5658183af52f36ed93"},"spentTxId":null,"spentIndex":null,"spentHeight":null},{"value":"0.91314400","n":1,"scriptPubKey":{"hex":"76a9147003cc5915f6c23fd512b38daeeecfdde7a587e988ac","asm":"OP_DUP OP_HASH160 7003cc5915f6c23fd512b38daeeecfdde7a587e9 OP_EQUALVERIFY OP_CHECKSIG","addresses":["1BDHEPgB8iGipkaaJDxkAYjuzvEowNvGG7"],"type":"pubkeyhash"},"spentTxId":"b2c86701a604e4c1ca384a3fecda97c8b189770793cff89d13ee2940e956c7c2","spentIndex":0,"spentHeight":506686}],"blockhash":"000000000000000000081ba14ef063a958342320f831859e32327d073fbefcf3","blockheight":506676,"confirmations":46,"time":1517245210,"blocktime":1517245210,"valueOut":0.913144,"size":235,"valueIn":0.913614,"fees":0.00047}
*/
            q.resolve(authToken);
          }
        });

      }, // init

    }); // extend tierion

    tierion.init();

  }
];
