var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var query = require('node-mysql-ejq');

var q = new query(con);

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

	console.log(driver);
});

module.exports = router;
