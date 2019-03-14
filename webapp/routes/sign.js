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
*/

var fs = require('fs');
var express = require('express');
const sign=require('sign-or-verify').sign;
var router = express.Router({
    mergeParams: true
});

module.exports=router;

router.get('/', function(req,res,next){
	console.log(req.params);
  fs.readFile('prv-'+req.params.addr+'.pem',function(err,privKey){
    if (err) {
      console.log(err);
      res.status(500).end();
      return;
    }
    sign({
      pem: privKey.toString('utf8'),
      algorithm: 'SHA256withECDSA',
      data: Buffer.from(req.params.token)
    })
    .then(function(signature){
      console.log(signature);
      res.status(200).end(JSON.stringify({
          signature: signature
      }));
    })
    .catch(function(err){
      console.log(err);
      res.status(500).end();
    });
  });
});
