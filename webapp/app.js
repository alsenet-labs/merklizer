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

var express=require('express');

var app=express();

app.set('debug',true);

// set cors headers
app.use(function(req, res, next) {
  if (!res.headersSent) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  next();
});

app.use('/sign/:addr/:token',require('./routes/sign'));
app.use(express.static('./client/app/'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found: '+req.url);
  err.status = 404;
  next(err);
});

module.exports=app;
