/*
* Copyright (c) 2024 ALSENET SA
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

/* reduce implementation allowing to break the loop when chaining promises */
/* by setting promise.break to true */

module.exports=reduce;

function reduce(array, promise, fn, i) {
  i=i||0;
  return promise
  .then(function(){
    return fn(promise,array[i],i,array);
  })
  .then(function(result){
    if (!promise.break && ++i<array.length) {
      return reduce(array,promise,fn,i);
    } else {
      return result;
    }
  })
}
