const express = require('express');
const router = require('express').Router();
const users = require('./users');
var controller = require('../controller/controller');

//Модуль для создания и работы с токенами
var jwt = require('jsonwebtoken');
var secret = 'secret';

//Соединение с mysql
var con = require('../models/connection');

//Модуль для работы с mysql запросами
var query = require('node-mysql-ejq');
var q = new query(con);

var axios = require('axios');

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

router.post('/new', function(req,res, next){
	users.newUser;
});
router.post('/login', function(req,res, next){
	users.login;
});
router.post('/compare', function(req,res, next){
	users.compare;
});
router.post('/check', function(req,res, next){
	users.check;
});


router.post('/cancel/app', function(req,res, next){
	controller.cancelApp;
});
router.post('/update/driver/balance', function(req,res, next){
	controller.updateDriverBalance;
});
router.post('/check/driver', function(req,res, next){
	controller.checkDriver;
});
router.post('/new/driver', controller.newDriver);

/*router.post('/new/driver', function(req,res, next){
	controller.newDriver;
});*/
router.post('/accept/driver', function(req,res, next){
	controller.acceprDriver;
});
router.post('/new/app', function(req,res, next){
	controller.newApp;
});
router.post('/send/app', function(req,res, next){
	controller.sendApp;
});
router.post('/accept', function(req,res, next){
	controller.Accept;
});
router.post('/cancel', function(req,res, next){
	controller.cancel;
});
router.post('/update/driver/data', function(req,res, next){
	controller.updateDriverData;
});
router.post('/delete/driver', function(req,res, next){
	controller.deleteDriver;
});
router.post('/update/status/on', function(req,res, next){
	controller.updateStatusOn;
});
router.post('/update/status/finish', function(req,res, next){
	controller.updateStatusFinish;
});
router.post('/get/inf', function(req,res, next){
	controller.getInfo;
});

module.exports = router;
