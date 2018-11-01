const express = require('express');
const router = require('express').Router();
const users = require('./users');
var controller = require('../controller/controller');
var app = require('../app');

// //Модуль для создания и работы с токенами
// var jwt = require('jsonwebtoken');
// var secret = 'secret';

// //Соединение с mysql
// var con = require('../models/connection');

// //Модуль для работы с mysql запросами
// var query = require('node-mysql-ejq');
// var q = new query(con);

// var axios = require('axios');

//access for headers
router.use(function(req, res, next) {
 	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 	next();
});


// GET users listing. 
router.get('/', function(req, res, next) {
	res.send('respond with a resource');
});

router.post('/new', users.newUser);
router.post('/login', users.login);
router.post('/compare', users.compare);
router.post('/check', users.check);


router.post('/cancel/app', controller.cancelApp);
router.post('/update/driver/balance', controller.updateDriverBalance);
router.post('/check/driver', controller.checkDriver);
router.post('/new/driver', controller.newDriver);
router.post('/accept/driver', controller.acceptDriver);
router.post('/new/app', controller.newApp);
router.post('/send/app', controller.sendApp);
router.post('/accept', controller.Accept);
router.post('/cancel', controller.cancel);
router.post('/update/driver/data', controller.updateDriverData);
router.post('/delete/driver', controller.deleteDriver);
router.post('/update/status/on', controller.updateStatusOn);
router.post('/update/status/finish', controller.updateStatusFinish);
router.post('/get/inf', controller.getInfo);

module.exports = router;
