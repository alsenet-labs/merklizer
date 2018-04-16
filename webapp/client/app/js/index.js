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

var angular=require('angular');
window.jQuery=window.$=require('jquery');
require('floatthead');

require('../css/bootstrap.min.css');
require('../css/main.css');

require('popper.js');
require('bootstrap');
require('@uirouter/angularjs/release/angular-ui-router.js');
require('angular-ui-bootstrap');
require('angular-files-drop');
require('angular-smart-table');
require('angular-file-saver');

var app=angular.module('merkleApp',[
  'ui.router',
  'ui.bootstrap',
  'angular-files-drop',
  'smart-table',
  'ngFileSaver'
])
.config(require('./config.js'))
.run(require('./run.js'))
.service('QRCodeService',require('./services/qrcode.js'))
.service('processing',require('./services/processing.js'))
.service('fileService',require('./services/file.js'))
.service('merkle',require('./services/merkle.js'))
//.service('tierion',require('./services/tierion.js'))
.service('ethService',require('./services/eth.js'))
.service('btcService',require('./services/btc.js'))
//.service('pdfService',require('./services/pdf.js'))
.directive('onChange',require('./directives/on-change.js'))
.directive('anchor',require('./directives/anchor.js'))
.controller('QRCodeCtrl',require('./controllers/qrcode.js'))
.controller('MainCtrl',require('./controllers/main.js'))
.controller('FilesCtrl',require('./controllers/files.js'))
.controller('ProcessedCtrl',require('./controllers/processed.js'))
.controller('OverlayCtrl',require('./controllers/overlay.js'))
.controller('ReportCtrl',require('./controllers/report.js'))
//.filter('prettyFileIcon',require('./filters/pretty-file-icon.js'))
.filter('stringify',require('./filters/stringify.js'))
