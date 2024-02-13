/*
* Copyright (c) 2018-2024 ALSENET SA
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

module.exports=(function(){
  return {
    enabled: true,
    network: 'mainnet',
    provider: {
//    mainnet: 'http://localhost:8545'
    },
    publicProvider: {
      mainnet: 'https://mainnet.infura.io',
      kovan: 'https://kovan.infura.io'
    },
    getTransactionURL: function(network,txid){
      return 'https://'+((network!='mainnet')?network+'.':'')+'etherscan.io/tx/'+txid;
    },
    getAddressURL: function(network,addr){
      return 'https://'+((network!='mainnet')?network+'.':'')+'etherscan.io/address/'+addr;
    }
  }
})();
