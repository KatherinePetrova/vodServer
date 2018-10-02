var express = require('express');
var router = express.Router();

//Модуль для создания и работы с токенами
var jwt = require('jsonwebtoken');
var secret = 'secret';

//Соединение с mysql
var con = require('../models/connection');

//Модуль для работы с mysql запросами
var query = require('node-mysql-ejq');
var q = new query(con);

//Создание WebSocket сервера
const WebSocket = require('ws');
const port = 8080;
const wss = new WebSocket.Server({ port: port });
console.log('webSocket is listening on port ' + port);

//Массив для хранения соединений с клиентом WebSocket
var wsCons = [];

//Функция для добавления соединения в массив
wss.on('connection', function connection(ws) {
	console.log("Operator connected");
	wsCons.push(ws);
});

//Хэдеры для доступа с других портов
router.use(function(req, res, next) {
 	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 	next();
});

//Домашняя страница сервера
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Server status: on' });
});

//Добавление нового водителя
router.post('/new/driver', async function(req, res, next){
	//Данные с формы
	var driver = {
		name: req.body.name,
		telegram_id: req.body.id,
		phone: req.body.phone,
		car: req.body.car,
		car_number: req.body.car_number
	};

	try{
		//Отправка данных в базу
		var insert = await q.insert({table: 'driver', data: driver});

		//Получение данных с базы
		var select = await q.select({table: 'driver', where: {id: insert.insertId}});
		select = select[0];

		//Отправление сведений о новом водителе операторам (с помощью WebSocket)
		for(var i; i<wsCons.length; i++){
			//Проверка на существование соединения с клиентом
			try{
				wsCons[i].send(JSON.stringify({action: 'new_driver', data: select}));
			} catch(e){
				wsCons.splice(i, 1);
			}
		}

		//Отправка успеха клиенту
		res.send();

	} catch(e){
		console.log(e);
		//Отправка ошибки клиенту
		res.send(500).send();
	}
});

//Новая заявка
router.post('/new/app', async function(req, res, next){

	//Данные с формы, статус по умолчанию - новая заявка
	var app = {
		adress: req.body.adress,
		area: req.body.area,
		status: 1
	};

	try {
		var insert = await q.insert({table: 'app', data: app});
		var select = await q.select({table: 'app', keys: ['id', 'adress', 'app_cometime'], where: {id: 1}, join: [{table: 'app_status', on: {status: "id"}, keys: ['name']}]});
		select = select[0];
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'new_app', data: select}));
			} catch(e){
				wsCons.splice(i, 1);
			}
		}
		res.send();
	} catch(e) {
		throw new Error(e)
		res.status(500).send();
	}

});

//Изменение статуса водителя
router.post('/update/driver/status', async function(req, res, next){
	var id = req.body.id;
	var driver = {
		status: req.body.status
	};

	try{
		var update = await q.update({table: 'driver', data: driver, where: {id: id}});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'update_driver_status', data: {id: id, status: driver.status}}));
			} catch(e){
				wsCons.splice(i, 1);
			}
		}
		res.send();
	} catch(e){
		throw new Error(e);
		res.status(500).send();
	}
});

//Изменение данных водителя
router.post('/update/driver/data', async function(req, res, next){
	var id = req.body.id;
	var driver = {
		name: req.body.id,
		telegram_id: req.body.t_id,
		phone: req.body.phone
	};

	try{
		var update = await q.update({table: 'driver', data: driver, where: {id: id}});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'update_driver_data', data: {id: id, name: driver.name, phone: driver.phone}}));
			} catch(e){
				wsCons.splice(i, 1);
			}
		}
		res.send();
	} catch(e){
		throw new Error(e);
		res.status(500).send();
	}
});

//Удаление водителя
router.post('/delete/driver', async function(req, res, next){
	var id = req.body.id;
	try{
		var del = await q.delete({table: 'driver', where: {telegram_id: id}});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'delete_driver', data: {telegram_id: id}}));
			} catch(e){
				wsCons.splice(i, 1);
			}
		}
		res.send();
	} catch(e){
		throw new Error(e);
		res.status(500).send();
	}
});

//Измнение статуса

router.post('/get/new_app', async function(req, res, next){
	try{
		var token = await jwt.verify(req.body.token, secret);
		var select = await q.select({table: 'app', keys:['adress', 'id', 'app_cometime'], where: {status: 1}, join: [{table: 'app_status', keys: ['name'], on: {status: 'id'}}]});
		res.send(select);
	} catch(e){
		res.status(500).send();
	}
	
});

module.exports = router;
