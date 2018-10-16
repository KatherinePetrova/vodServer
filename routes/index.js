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
const port = 8001;
const wss = new WebSocket.Server({ port: port });
console.log('webSocket is listening on port ' + port);

//Массив для хранения соединений с клиентом WebSocket
var wsCons = [];

//Функция для добавления соединения в массив
wss.on('connection', function connection(ws) {
	console.log("\nOperator connected\n");
	wsCons.push(ws);
});

var axios = require('axios');

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
		udo_side1: req.body.udo_side1,
		udo_side2: req.body.udo_side2,
		prava_side1: req.body.prava_side1,
		prava_side2: req.body.prava_side2
	};

	try{
		//Проверка на существование
		var check = await q.select({table: 'driver', where: {telegram_id: driver.telegram_id}});
		if(check.length!=0){
			res.status(409).send()
		} else {
			//Отправка данных в базу
			var insert = await q.insert({table: 'driver', data: driver});

			//Получение данных с базы
			var select = await q.select({table: 'driver'});

			//Отправление сведений о новом водителе операторам (с помощью WebSocket)
			for(var i; i<wsCons.length; i++){
				//Проверка на существование соединения с клиентом
				try{
					wsCons[i].send(JSON.stringify({action: 'driver', data: select}));
				} catch(e){
					console.log('catch');
				}
			}

			//Отправка успеха клиенту
			res.send();
		}
	
	} catch(e){
		console.log(e);
		//Отправка ошибки клиенту
		res.send(500).send();
	}
});

//Подтверждение регистрации водителя
router.post('/driver/accept', async function(req, res){
	var driver = req.body.driver;
	if(driver.acceptance==1){
		var query = await axios.post('https://asterisk.svo.kz/admin/driver/acceptance', driver);
		if(query.status==200){
			var update = await q.update({table: 'driver', data: driver, where: {id: driver.id}});
			var insert_da = await q.insert({table: 'day_amount', data: {driver_id: driver.id}});
			res.send()
		} else {
			res.status(500).send();
		}
	} else if(driver.acceptance==0){
		var query = await axios.post('https://asterisk.svo.kz/admin/driver/acceptance', driver);
		if(query.status==200){
			var del = await q.delete({table: 'driver', where: {id: driver.id}});
			res.status(409).send();
		} else {
			res.status(500).send();
		}
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
		var select = await q.select({table: 'app'});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'app', data: select}));
			} catch(e){
				console.log('catch')
			}
		}
		var select_app = await q.select({table: 'app', where: {id: insert.insertId}});
		select_app = select_app[0];
		var select_driver = await q.select({table: 'driver', where: {status: true, acceptance: true}});
		var query = await axios.post('https://asterisk.svo.kz/admin/app', {app: select_app, drivers: select_driver});
		if(query.status==200){
			res.send();			
		} else {
			console.log(e);
			res.status(query.status).send();
		}
	} catch(e) {
		console.log(e);
		res.status(500).send();
	}

});

//Подтверждение заявки
router.post('/accept', async function(req, res){
	var telegram_id = req.body.telegram_id;
	var app_id = req.body.id;
	try{
		var select_app = await q.select({table: 'app', where: {id: app_id}});
		select_app = select_app[0];
		console.log(select_app.driver);
		if(select_app.driver == null){
			var select_driver = await q.select({table: 'driver', where: {telegram_id: telegram_id}});
			select_driver = select_driver[0];
			var app = {
				driver: select_driver.id,
				app_start: new Date(),
				status: 2
			}
			var update_driver = await q.update({table: 'driver', where: {id: select_driver.id}, data: {status: false}});
			var update_app = await q.update({table: 'app', where: {id: app_id}, data: app});
			var select_app_ws = await q.select({table: 'app'});
			var select_driver_ws = await q.select({table: 'driver'});
			for(var i=0; i<wsCons.length; i++){
				try{
					wsCons[i].send(JSON.stringify({action: 'app', data: select_app_ws}));
					wsCons[i].send(JSON.stringify({action: 'driver', data: select_driver_ws}));
				} catch(e){
					console.log('catch')
				}
			}
			res.send();
		} else {
			res.status(409).send();
		}
	} catch(e){
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
		var select = await q.select({table: 'driver'})
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'driver', data: select}));
			} catch(e){
				console.log('catch')
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
		var select = await q.select({table: 'driver'});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'driver', data: select}));
			} catch(e){
				console.log('catch');
			}
		}
		res.send();
	} catch(e){
		throw new Error(e);
		res.status(500).send();
	}
});

//Статус: (3, 4) Водитель выехал, водитель на исполнении
router.post('/update/status/on', async function(req, res){
	console.log(req.body);
	var date = new Date();
	var id = req.body.id;
	var status = req.body.status;
	var app = {
		app_start: date,
		status: req.body
	};
	try{
		var update_app = await q.update({table: 'app', data: app, where: {id: id}});
		var select = await q.select({table: 'app'});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'app', data: select}));
			} catch(e){
				console.log('catch');
			}
		}
		res.send();
	} catch(e){
		res.status(500).send();
	}
});

//Статус: (5) завершение заявки
router.post('/update/status/finish', async function(req, res){
	var date = new Date();
	var id = req.body.id;
	var app = {
		app_finish: date,
		status: 5
	};
	try{
		var update_app = await q.update({table: 'app', data: app, where: {id: id}});
		var select_app = await q.select({table: 'app', where: {id: id}});
		select_app = select_app[0];
		var select_driver = await q.select({table: 'driver', where: {id: select_app.driver}});
		select_driver = select_driver[0];
		var time = select_app.app_finish - select_app.app_start;
		time = Math.round(((time/1000)/60)/60);
		var val = 0;
		if(select_app.area==1){
			val = 500;
		} else {
			val = 1000;
		}
		var cost = time*700 + val;
		var driver_amount = 400 + ((cost/100)*5);
		update_app = await q.update({table: 'app', data: {app_time: time, amount: cost-driver_amount, driver_amount: driver_amount}, where: {id: id}});
		var update_driver = await q.update({table: 'driver', data: {status: true, balance: select_driver.balance- (cost-driver_amount)}, where: {id: select_app.driver}});
		var select_app_ws = await q.select({table: 'app'});
		var select_driver_ws = await q.select({table: 'driver'});
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'driver', data: select_driver_ws}));
			} catch(e){
				console.log('catch');
			}
		}
		for(var i=0; i<wsCons.length; i++){
			try{
				wsCons[i].send(JSON.stringify({action: 'app', data: select_app_ws}));
			} catch(e){
				console.log('catch');
			}
		}
		var select_da = await q.select({table: 'day_amount', where: {active: true, driver_id: select_app.driver}});
		select_da = select_da[0];
		var update_da = await q.update({table: 'day_amount', where: {id: select_da.id}, data: {amount: select_da.amount + cost, driver_amount: driver_amount}});		
		res.send({time: time, driver_amount: driver_amount});
	} catch(e){
		console.log(e);
		res.status(500).send();
	}
});

//Получение информации для оператора
router.post('/get/inf', async function(req, res, next){
	try{
		var token = await jwt.verify(req.body.token, secret);
		var app = await q.select({table: 'app'});
		var driver = await q.select({table: 'driver'});
		var app_status = await q.select({table: 'app_status'});
		res.send({app: app, driver: driver, app_status: app_status});
	} catch(e){
		res.status(500).send();
	}
});

var check = true;

async function checkTime(){
	var time = new Date();
	var hours = time.getHours(), minutes = time.getMinutes();
	if(hours==11 && minutes==0 && check){
		try{
			var select = await q.select({table: 'day_amount', where: {active: true}, keys: ['id', 'driver_amount', 'amount'], join: [{on: {driver_id: 'id'}, table: 'driver', keys: ['telegram_id', 'balance']}]});
			var query = await axios.post('https://asterisk.svo.kz/admin/send_drivers', select);
			if(query.status==200){
				for(var i=0; i<select.length; i++){
					var update = await q.update({table: 'day_amount', where: {active: true}, data: {active: false}});
				}
				var drivers = await q.select({table: 'driver'});
				for(var i=0; i<drivers.length; i++){
					if(!drivers[i].balance<0){
						var insert = await q.insert({table: 'day_amount', data: {driver_id: drivers[i].id}});
					}
				}
			} else {
				console.log(query)
			}
			check = false
		} catch(e){
			console.log(e);
		}
	} else if(hours==11 && minutes==1){
		check = true;
	}
}
var x = setInterval(checkTime, 20*1000);

module.exports = router;