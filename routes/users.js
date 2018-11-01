var express = require('express');
var router = express.Router();
var con = require('../models/connection');
var Query = require('node-mysql-ejq');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var routers = require('./routers');

var query = new Query(con);
var secret = "secret";

//new user registration
exports.newUser = async(req, res, next) => {
	//bcrypt using for crypting password
	let salt = await bcrypt.genSalt(10);
	let hash = await bcrypt.hash(req.body.pass, salt);
	
	try{
		//mysql insert query to create new user
		var user = await query.insert({table: "user", data: {
			login: req.body.login,
			password: req.body.hash,
			email: req.body.mail
		}});

		res.send();
	} catch(e){
		res.status(400).send();
	}
};

//authorization
exports.login = async(req, res, next) =>{
	try{
		var user = await query.select({table: "user", where: {login: req.body.login}});
		user = user[0];
		let bol = await bcrypt.compare(req.body.pass, user.password);
		if(bol){
			var token = jwt.sign({id: user.id, name: user.login}, secret, {expiresIn: "12h"});
			res.send(token);
		} else {
			res.status(403).send();
		}
		
	} catch(e) {
		throw new Error(e);
		res.status(500).send();
	}
};

//check for same login
exports.compare = async(req, res, next) =>{
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
};

//check for valid token
exports.check = async(req, res, next) => {
	try{
		var username = '';
		var token = await jwt.verify(req.body.token, secret, function(err, decoded){
			username = decoded.name;
		});
		res.send(username);
	} catch(e) {
		res.status(401).send();
	}

};