var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var query = require('node-mysql-ejq');
const WebSocket = require('ws');
var jwt = require('jsonwebtoken');
var secret = 'secret';

var q = new query(con);
const port = 8080;
const wss = new WebSocket.Server({ port: port });
console.log('webSocket is listening on port ' + port);

var wsCons = [];

//websocket
wss.on('connection', function connection(ws) {
	console.log("Operator connected");
	wsCons.push(ws);
});

router.use(function(req, res, next) {
 	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 	next();
}); 
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Server status: on' });
});

router.post('/new_driver', async function(req, res, next){
	var driver = {
		name: req.body.name,
		telegram_id: req.body.userId,
		phone: req.body.phonenumber,
		status: req.body.status
	};

	res.send(JSON.stringify(driver));
	console.log(driver);
});

router.post('/new_app', async function(req, res, next){

	var app = {
		adress: "вс",
		area: 1,
		status: 1
	};

	try {
		// var insert = await q.insert({table: 'app', data: app});
		var select = await q.select({table: 'app', keys: ['adress', 'app_cometime'], where: {id: 1}, join: [{table: 'app_status', on: {status: "id"}, keys: ['name']}]});
		select = select[0];
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify(select));
			} catch(e){
				wsCons.splice(i, 1);
			}
		}
		console.log(select);

		res.send();
	} catch(e) {
		throw new Error(e)
		res.status(500).send();
	}

});

router.post('/update_driver', async function(req, res, next){
	var driver = {
		name: req.body.name,
		telegram_id: req.body.userId,
		phone: req.body.phonenumber,
		status: req.body.status
	};

	res.send(JSON.stringify(driver));
	console.log(driver);
});

router.post('/get/new_app', async function(req, res, next){
	try{
		var token = await jwt.verify(req.body.token, secret);
		var select = await q.select({table: 'app', keys:['adress', 'id', 'app_cometime'], where: {status: 1}, join: [{table: 'app_status', keys: ['name'], on: {status: 'id'}}]});
		res.send(select);
	} catch(e){
		res.status(500).send();
	}
	
});

router.post('/test/ws', function(req, res, next){
	try{
		for(var i=0; i<wsCons.length; i++){
			wsCons[i].send('Привет');
		}
		res.send();
	} catch(e){
		res.status(500).send();
		console.log(e);
	}
})

module.exports = router;
