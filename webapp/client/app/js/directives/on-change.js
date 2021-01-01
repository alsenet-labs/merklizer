/*
* Copyright (c) 2018-2021 ALSENET SA
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

"use strict";

module.exports=[
  '$parse',
  function($parse) {
    return {
      restrict: 'A',
      link: function ($scope, element, $attrs) {
        element.on('change', function(event){
          $scope.$apply(function(){
            $parse($attrs.onChange)($scope, {$event:event});
            if (element[0].type=='file') {
              // reset value so that selecting the same file will trigger the event again
              element[0].value='';
            }
          });
        });
        element.on('$destroy', function() {
          element.off();
        });
      }
    };
  }
]
