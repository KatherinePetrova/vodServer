var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var query = require('node-mysql-ejq');

var q = new query(con);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Server status: on' });
});

router.post('/add_driver', async function(req, res, next){
	// try{
	// 	var driver = await q.insert({table: 'driver', data: {
	// 		name: req.a.id
	// 		phone: 

	// 	}});
	// 	res.send({status: "200"});
	// } catch(e){
		
	// }
	
});

module.exports = router;
