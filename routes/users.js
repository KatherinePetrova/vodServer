var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var Query = require('node-mysql-ejq');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var query = new Query(con);
var secret = 'secret';
/* GET users listing. */
router.get('/', function(req, res, next) {
	res.send('respond with a resource');
});

//access for headers
router.use(function(req, res, next) {
 	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 	next();
}); 

//new user registration
router.post('/new', async function(req, res, next){

	//bcrypt using for crypting password
	let salt = await bcrypt.genSalt(10);
	let hash = await bcrypt.hash(req.body.pass, salt);
	
	try{
		//mysql insert query to create new user
		var user = await query.insert({table: "user", data: {
			login: req.body.login,
			password: hash,
			email: req.body.mail
		}});

		res.send();
	} catch(e){
		res.status(400).send();
	}
});

//authorization
router.post('/login', async function(req, res, next){
	try{
		var user = await query.select({table: "user", where: {login: req.body.login}});
		user = user[0];
		let bol = await bcrypt.compare(req.body.pass, user.password);
		if(bol){
			var token = jwt.sign({id: user.id, name: user.login}, secret);
			res.send(token);
		} else {
			res.status(403).send();
		}
		
	} catch(e) {
		throw new Error(e);
		res.status(500).send();
	}
});

//check for same login
router.post('/compare', async function(req, res, next){
	try{
		var login = await query.select({table: "user", keys: ['login'], where: {login: req.body.login}});
		if(login.length!=0){
			res.send();
		} else {
			res.status(403).send();
		}
	} catch(e) {
		res.status(406).send();
	}
});

//check for valid token
router.post('/check', async function(req, res, next){
	try{
		var username = '';
		var token = await jwt.verify(req.body.token, secret, function(err, decoded){
			username = decoded.name;
		});
		res.send(username);
	} catch(e) {
		res.status(401).send();
	}

});



module.exports = router;
