var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var query = require('node-mysql-ejq');

var q = new query(con);


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

module.exports = router;
