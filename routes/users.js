var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var Query = require('node-mysql-ejq');
var bcrypt = require('bcrypt');

var query = new Query(con);
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
	} catch(e){
		res.send({status: 401});
	}
	res.send();
});

module.exports = router;
