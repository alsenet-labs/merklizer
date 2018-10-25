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

module.exports=[
  '$rootScope',
  '$state',
  '$stateParams',
  '$window',
  '$transitions',

  function (
    $rootScope,
    $state,
    $stateParams,
    $window,
    $transitions
  ) {
    $rootScope.$state=$state;
    $rootScope.$stateParams=$stateParams;
    $rootScope.mobileApp=['http:','https:'].indexOf($window.document.location.protocol)<0;
    $transitions.onSuccess({}, function(transition) {
      $rootScope.title = transition.to().title;
    });
  }
];
