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

var js_sha512=require('js-sha512');
var sha512_256=js_sha512.sha512_256;


module.exports = [
  function(
  ) {
    var merkle=this;

    angular.extend(merkle,{
      mask: 0xfffe,
      debug: true,

      hashType: 'SHA512_256',

      _hash: {
        SHA512_256: function hash(data){
          return new Uint8Array(sha512_256.arrayBuffer(data));
        }
      },

      hash: function hash(data){
        return merkle._hash[merkle.hashType](data);
      },

      hashToString: function hashToString(hash){
        return Array.prototype.slice.call(hash)
        .map(function(i) {
          return (i&0xf0?'':'0')+(Number(i).toString(16));
        }).join('');
      },

      stringToHash: function stringToHash(hash_str){
        return new Uint8Array(hash_str.match(/.{2}/g).map(function(byte){
          return parseInt(byte,16);
        }));
      },

      hashMerge: function hashMerge(hashLeft,hashRight,hashType){
        var result=new Uint8Array(hashLeft.byteLength+hashRight.byteLength);
        result.set(hashLeft,0);
        result.set(hashRight,hashLeft.byteLength);
        var hash=merkle._hash[hashType||merkle.hashType](result);
        return hash;
      },

      compute: function compute(objectList){
        var tree=merkle.computeTree(objectList);
        merkle.computeProofs(tree);
        return tree;
      },

      computeTree: function computeTree(objectList){
        var leaves=[];
        var tree=[leaves];

        angular.forEach(objectList,function(obj){
          leaves.push(obj);
        });

        if (leaves.length>(merkle.mask|1)) throw(new Error('too much leaves'));

        while(tree[0].length>1) {
          tree.unshift([]);
          tree[1].some(function(elem,index){
            // even indexes only
            if (!(index&1)) {
              // not the last element ?
              if ((index|1)<tree[1].length) {
                // merge hashes
                tree[0].push({
                  hash: merkle.hashMerge(elem.hash,tree[1][index|1].hash)
                });

              } else {
                // nothing to merge, store vanilla hash
                tree[0].push({
                  hash: elem.hash
                });
              }
            }
          });
        }
        return tree;

      }, // computeTree

      computeProofs: function computeProofs(tree){
        var leaves=tree[tree.length-1];

        leaves.some(function(elem,i){
          var j=i;

          elem.proof={
            hashType: merkle.hashType,
            hash: elem.hash,
            root: tree[0][0].hash,
            operations: []
          }

          for(var level=tree.length-1; level>=0; --level) {
            var here=tree[level];
            if (j&1) {
              // elem index is odd (last bit is 1)
              elem.proof.operations.push({
                left: here[j&merkle.mask].hash
              });

            } else {
              // elem index is even (last bit is 0)
              if ((j|1)<here.length) {
                elem.proof.operations.push({
                  right: here[j|1].hash
                });
              }
            }
            //
            j=(j&merkle.mask)>>1;
          }

        });

        if (merkle.debug) {
          leaves.some(function(elem){
            console.log(elem,merkle.checkProof(elem.proof).toString());
          });
        }
      }, // computeProofs

      checkProof: function checkProof(proof){
        if (
          !proof
          || !proof.operations
          || !proof.operations.length
          || !proof.root
          || !proof.hash
        ) return false;

        if (merkle.debug) {
          console.log(proof)
          console.log(merkle.hashToString(proof.hash));
        }

        var hash=proof.hash;
        proof.operations.some(function(step){
          if (step.left) {
            hash=merkle.hashMerge(step.left,hash,proof.hashType);

          } else {
            if (step.right) {
              hash=merkle.hashMerge(hash,step.right,proof.hashType);

            } else {
              throw(new Error('invalid proof'));
            }
          }
          if (merkle.debug) console.log(merkle.hashToString(hash))
        });
        return hash.toString()==proof.root.toString();

      }, // checkProof

      getRoot: function(tree){
        return merkle.hashToString(tree[0][0].hash);
      }

    });
  }
];
