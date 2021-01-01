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

    angular.extend($rootScope,{
      config: require('../../../config.json'),
      $state: $state,
      $stateParams: $stateParams,
      mobileApp: (['http:','https:'].indexOf($window.document.location.protocol)<0),
      showOverlay: function(options){
        $rootScope.$broadcast('showOverlay',options);
      },
      hideOverlay: function(){
        $rootScope.$broadcast('hideOverlay');
      }
    });

    $rootScope.$on('showOverlay',function(event,options){
      if ($window.parent) {
        $window.parent.postMessage({type: 'showOverlay', options: JSON.stringify(options)}, $window.document.location.origin);
      }
    });

    $rootScope.$on('hideOverlay',function(event,options){
      if ($window.parent) {
        $window.parent.postMessage({type: 'hideOverlay', options: JSON.stringify(options)}, $window.document.location.origin);
      }
    });

    $window.addEventListener('message',receiveMessage,false);
    function receiveMessage(msg){
      if (msg.origin!=$window.document.location.origin) {
        console.log(msg);
        return;
      }
      if (msg.data && msg.data.type) {
        console.log(msg.data.type);
        switch(msg.data.type){
          case 'transition':
            $state.transitionTo(msg.data.toState, msg.data.stateParams||{}, {reload: msg.data.reload});
            break;
          default:
            console.log('unhandled message', msg);
            break;
        }
      } else {
        console.log('unhandled message', msg);
      }
    }
    $transitions.onSuccess({}, function(transition) {
      $rootScope.title = transition.to().title;
      // allow state related css rules
      $('body').removeClass('_'+transition.from().name.replace(/\./g,'_').replace(/([A-Z])/g,function(all,letter){return '-'+letter.toLowerCase()})).addClass('_'+transition.to().name.replace(/\./g,'_').replace(/([A-Z])/g,function(all,letter){return '-'+letter.toLowerCase()}));
      if ($window.parent) {
        $window.parent.postMessage({type: 'transitionSuccess', toState: transition.to().name}, $window.document.location.origin);
      }
    });
    $transitions.onStart({}, function(transition) {
      if ($window.parent) {
        $window.parent.postMessage({type: 'transitionStart', toState: transition.to().name}, $window.document.location.origin);
      }
    });
  }
];
