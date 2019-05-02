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

"use strict";

module.exports=[
  '$parse',
  'ethService',
  'btcService',
  function(
    $parse,
    ethService,
    btcService
  ) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var anchor=scope.anchor=$parse(attrs.anchor)(scope);
        switch(anchor.type) {
          case 'ethereum':
            scope.networkName=ethService.network_name[anchor.networkId]||anchor.networkId;
            scope.transactionURL=ethService.getTransactionURL(scope.networkName,anchor.transactionId);
            scope.from=anchor.transaction.from;
            scope.addressURL=ethService.getAddressURL(scope.networkName,scope.from);
            break;
          case 'bitcoin':
          // TODO: in the case theres more than one input maybe it is necessary to verify they share the same address
            scope.from=anchor.transaction.vin[0].addr;
            scope.networkName=btcService.networkId;
            scope.transactionURL=btcService.getTransactionURL(scope.networkName,anchor.transactionId);
            scope.addressURL=btcService.getAddressURL(scope.networkName,scope.from);
        }
      },
      templateUrl: 'views/anchor.html'
    };
  }
]
