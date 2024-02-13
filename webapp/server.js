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

var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('ssl/key.pem', 'utf8');
var certificate = fs.readFileSync('ssl/cert.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};
var app = require('./app');

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

var http_port=3080;
var https_port=3443;

httpServer.listen(http_port);
console.log('listening to http://localhost:'+http_port);
httpsServer.listen(https_port);
console.log('listening to https://localhost:'+https_port);
