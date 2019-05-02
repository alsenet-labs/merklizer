/*
* Copyright (c) 2018-2019 ALSENET SA
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

/**
USAGE:
with AngularJS, eg:
   var app=angular.module('merkleApp',[
     'ui.router',
     ...
   ])
   .config(require('./config.js'))
   .run(require('./run.js'))
   .service('merkle',require('./services/merkle.js')(window.crypto.subtle.digest))

with NodeJS, eg:
  var Q=require('q');
  var digest=function(hash_type, data) {
    var q=Q.defer();
    ...
    return q.promise;
  }
  var merkle=require('./services/merkle.js')(Q,digest);

*/
'use strict';

var isAngularJS=(typeof angular !== 'undefined');

var js_sha512=require('js-sha512');
var sha512_256=js_sha512.sha512_256;

if (isAngularJS) {
  module.exports=function(digest){
    return [
      '$q',
      function(
        $q
      ){
        angular.merge(this, _merkle($q, digest));
      }
    ];
  }
} else {
  module.exports=function(Q, digest) {
    return _merkle(Q, digest);
  }
}

function _merkle($q,digest){
  var merkle;
  return merkle={
    mask: 0xfffe,
    debug: false,
    version: '1.0.0',

    hashType: 'SHA512_256',

    _hash: {
      SHA256: function hash(data){
        debugger;
        return digest('SHA-256',data).then(function(a){
          return new Uint8Array(a);
        });
      },
      SHA512_256: function hash(data){
        return $q.resolve(new Uint8Array(sha512_256.arrayBuffer(data)));
      },
      SHA512_TRUNC: function hash(data){
        return digest('SHA-512',data).then(function(a){
          return new Uint8Array(a.slice(0,32));
        });
      }
    },

    hash: function hash(data,hashType){
      if (!merkle._hash[hashType||merkle.hashType]) {
        throw new Error('Hash type '+(hashType||merkle.hashType)+' not supported');
      }
      try {
        return merkle._hash[hashType||merkle.hashType](data);
      } catch(e) {
        console.log(e);
        return $q.reject(e);
      }
    },

    hashToString: function hashToString(hash){
      if (typeof hash == 'string') {
        console.log('hash is already a string');
        return hash;
      }
      return Array.prototype.slice.call(hash)
      .map(function(i) {
        return (i&0xf0?'':'0')+(Number(i).toString(16));
      }).join('');
    },

    stringToHash: function stringToHash(hash_str){
      if (typeof hash_str != 'string') {
        console.log('hash is not a string');
        return hash;
      }
      return new Uint8Array(hash_str.match(/.{2}/g).map(function(byte){
        return parseInt(byte,16);
      }));
    },

    hashMerge: function hashMerge(hashLeft,hashRight,hashType){
      if (typeof(hashLeft)=='string') hashLeft=merkle.stringToHash(hashLeft);
      if (typeof(hashRight)=='string') hashRight=merkle.stringToHash(hashRight);
      var result=new Uint8Array(hashLeft.byteLength+hashRight.byteLength);
      result.set(hashLeft,0);
      result.set(hashRight,hashLeft.byteLength);
      return merkle.hash(result,hashType);
    },

    compute: function compute(objectList){
      try {
        return merkle.computeTree(objectList)
        .then(function(tree){
          merkle.computeProofs(tree);
          return tree;
        });
      } catch(e){
        console.log(e);
        return $q.reject(e);
      }
    },

    computeTree: function computeTree(objectList){
      var d=$q.defer();
      var leaves=[];
      var tree=[leaves];

      angular.forEach(objectList,function(obj){
        leaves.push(obj);
      });

      if (leaves.length>(merkle.mask|1)) {
        d.reject(new Error('too much leaves'));
        return d.promise;
      }

      (function outerLoop(tree){
        if (tree[0].length<=1) {
          d.resolve(tree);
          return;
        }
        tree.unshift([]);

        var q=$q.defer();
        (function loop(index) {
          if (index>=tree[1].length) {
            q.resolve(tree);
            return;
          }

          // even indexes only
          if (index&1) {
            loop(index+1);

          } else {
            var elem=tree[1][index];
            // not the last element ?
            if ((index|1)<tree[1].length) {
              // merge hashes
              merkle.hashMerge(elem.hash,tree[1][index|1].hash)
              .then(function(hash){
                tree[0].push({
                  hash: hash
                });
                loop(index+1);
              })
              .catch(q.reject);

            } else {
              // nothing to merge, store vanilla hash
              tree[0].push({
                hash: elem.hash
              });
              loop(index+1);
            }
          }
        })(0);

        q.promise.then(outerLoop)
        .catch(d.reject);

      })(tree);

      return d.promise;

    }, // computeTree

    computeProofs: function computeProofs(tree){
      var leaves=tree[tree.length-1];

      var date=(new Date()).toISOString();

      leaves.some(function(elem,i){
        var j=i;

        elem.proof={
          merklizerVersion: merkle.version,
          hashType: merkle.hashType,
          hash: elem.hash,
          root: tree[0][0].hash,
          date: date,
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
          merkle.checkProof(elem.proof)
          .then(function(validated){
            console.log(elem.proof, validated.toString());
          });
        });
      }
    }, // computeProofs

    checkProof: function checkProof(proof){
      if (
        !proof
        || !proof.operations
        || !Array.isArray(proof.operations)
        || !proof.root
        || !proof.hash
      ) return $q.resolve(false);

      if (merkle.debug) {
        console.log(proof)
      }

      var q=$q.defer();
      (function loop(hash,i){
        if (merkle.debug) console.log(merkle.hashToString(hash))
        if (i>=proof.operations.length) {
          q.resolve(hash);
          return;
        }
        var step=proof.operations[i];

        if (step.left) {
          merkle.hashMerge(step.left,hash,proof.hashType)
          .then(function(hash){
            loop(hash,i+1);
          })
          .catch(q.reject);

        } else {
          if (step.right) {
            merkle.hashMerge(hash,step.right,proof.hashType)
            .then(function(hash){
              loop(hash,i+1)
            });

          } else {
            q.reject(new Error('invalid proof'));
          }
        }

      })(proof.hash,0);

      return q.promise.then(function(hash){
        return merkle.hashToString(hash)==merkle.hashToString(proof.root);
      })
      .catch(function(err){
        console.log(err);
      });


    }, // checkProof

    getRoot: function(tree){
      return merkle.hashToString(tree[0][0].hash);
    }
  }

} // merkle
