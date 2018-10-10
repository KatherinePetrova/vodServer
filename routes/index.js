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
	console.log("Operator connected");
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
		car: req.body.car,
		car_number: req.body.car_number
	};

	try{
		//Проверка на существование
		var check = await q.select({table: 'driver', where: {telegram_id: driver.telegram_id}});
		if(check.length!=0){
			res.status(409).send()
		} else {
			//Отправка данных в базу
			var insert = await q.insert({table: 'driver', data: driver});
			var insert_da = await q.insert({table: 'day_amount', data: {driver_id: insert.insertId}});

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
		}
	
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

//Отправка заявки водителю (статус: ожидает водителя (2))
router.post('/update/app/sent', async function(req, res){
	var app = req.body.app;
	var telegram_id = req.body.telegram_id;
	var query = await axios.post('https://asterisk.svo.kz/admin/app', {telegram_id: telegram_id, adress: app.adress, area: app.area, id: app.id});
	if(query.status==200){
		try {
	    	var driver = await q.select({table: 'driver', where: {telegram_id: telegram_id}, keys: ['id']});
		    driver = driver[0].id;
		    var update_app = await q.update({table: 'app', where: {id: app.id}, data: {driver: driver, status: 2}});
		    var update_driver = await q.update({table: 'driver', where: {id: driver}, data: {status: false}});
		    var select_app = await q.select({table: 'app', where: {id: app.id}, keys: ['id', 'adress', 'app_cometime', 'status'], join: [{table: 'app_status', on: {status: 'id'}, keys: ['name']}]});
		    res.send(select_app);
	    } catch(e){
	    	res.status(500).send();
	    }
	} else {
		res.status(406).send()
	}
});

//Принятие подтверждения
router.post('/update/app/sent_acc', async function(req, res){
	var id = req.body.id;
	var telegram_id = req.body.telegram_id;
	var driver = 0;
	try{
		var select = await q.select({table: 'driver', where: {telegram_id: telegram_id}, keys: ['id']});
		driver = select[0].id;
		if(typeof driver == 'undefined'){
			res.status(401).send();
		}
		var update_driver = q.update({table: 'driver', data: {status: false}, where: {id: driver}});
	} catch(e){
		console.log(e);
		res.status(500).send();
	}
	var app = {
		status: 2,
		app_start: new Date(),
		driver: driver
	};
	try{
		var update = q.update({table: 'app', data: app, where: {id: id}});
		for(var i=0; i<wsCons.length; i++){
			try{
				await wsCons[i].send(JSON.stringify({action: 'update_app_acc', data: {id: id, app: app}}));
			} catch(e){
				await wsCons.splice(i, 1);
			}
		}
		res.send();
	} catch(e){
		res.status(500).send();
	}
});

//Отмена заявки от водителя
router.post('/update/app/sent_dec', async function(req, res){
	var id = req.body.id;
	var driver = 0;
	try{
		var select = await q.select({table: 'driver', where: {telegram_id: req.body.telegram_id}, keys: ['id']});
		console.log(select);
		driver = select[0].id;
		if(typeof driver == 'undefined'){
			res.status(401).sent();
		} else {
			var update = await q.update({table: 'driver', where: {id: driver}, data: {status: true}});
			var update_app = await q.update({table: 'app', where: {id: id}, data: {driver: null, status: 1}});
			console.log('pop2');
			for(var i=0; i<wsCons.length; i++){
				try{
					await wsCons[i].send(JSON.stringify({action: 'update_app_dec', data: {id: id, driver: driver}}));
				} catch(e){
					await wsCons.splice(i, 1);
				}
			}
			res.send();
		}
		
	} catch(e){
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
		console.log(update_app);
		for(var i=0; i<wsCons.length; i++){
			try{
				await wsCons[i].send(JSON.stringify({action: 'update_app_status', data: {id: id, status: status}}));
			} catch(e){
				await wsCons.splice(i, 1);
			}
		}
		res.send();
	} catch(e){
		res.status(500).send();
	}
});

//Статус: (5) завершение заявки
router.post('/update/status/finish', async function(req, res){
	console.log(req.body);
	var date = new Date();
	var id = req.body.id;
	var app = {
		app_finish: date,
		status: 5
	};
	try{
		var update_app = await q.update({table: 'app', data: app, where: {id: id}});
		var select_app = await q.select({table: 'app', keys: ['app_start', 'app_finish', 'area', 'driver'], where: {id: id}});
		select_app = select_app[0];
		var time = select_app.app_finish - select_app.app_start;
		time = Math.round(((time/1000)/60)/60);
		console.log(time);
		var val = 0;
		if(select_app.area==1){
			val = 500;
		} else {
			val = 1000;
		}
		var cost = time*700 + val;
		var driver_amount = 400 + ((cost/100)*5);
		console.log(cost);
		update_app = await q.update({table: 'app', data: {app_time: time, amount: cost, driver_amount: driver_amount}});
		for(var i=0; i<wsCons.length; i++){
			try{
				await wsCons[i].send(JSON.stringify({action: 'update_app_status_finish', data: {id: id, status: 5, amount: cost, app_time: time}}));
			} catch(e){
				await wsCons.splice(i, 1);
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

//Отмена заявки от клиента
router.post('/update/status/cancel', async function(req, res){
	var id = req.body.id;
	console.log(id);
	if(typeof id == 'undefined'){
		res.status(400).send();
	}
	try{
		var select_app = await q.select({table: 'app', where: {id: id}, keys: ['status', 'driver'], join: [{table: 'driver', on: {driver: 'id'}, keys: ['telegram_id']}]});
		select_app = select_app[0];
		console.log(select_app);
		if(select_app.status == 1){
			for(var i=0; i<wsCons.length; i++){
				try{
					await wsCons[i].send(JSON.stringify({action: 'update_app_status_dec', data: {id: id}}));
				} catch(e){
					await wsCons.splice(i, 1);
				}
			}
			var update_app = await q.update({table: 'app', data: {status: 6}, where: {id: id}});
			res.send();
		} else {
			for(var i=0; i<wsCons.length; i++){
				try{
					await wsCons[i].send(JSON.stringify({action: 'update_app_status_dec', data: {id: id}}));
				} catch(e){
					await wsCons.splice(i, 1);
				}
			}
			axios
		    	.post('https://asterisk.svo.kz/admin/client_dec', {id: id, telegram_id: select_app.telegram_id})
		     	.then(response => {
		     		console.log('post dec');
		     		var update_app = q.update({table: 'app', data: {status: 6}});
		     		var update_driver = q.update({table: 'driver', data: {status: true}});
		      		res.send();
		     	})
		     	.catch(error => {
		     		console.log('post r');
		      		res.status(400).send();
		     	});
		}
	} catch(e){
		console.log(e);
		res.status(500).send();
	}

});

//Получение новых заявок
router.post('/get/new_app', async function(req, res, next){
	try{
		var token = await jwt.verify(req.body.token, secret);
		var select_new = await q.select({table: 'app', keys:['adress', 'id', 'app_cometime', 'status', 'area'], where: {status: 1}, join: [{table: 'app_status', keys: ['name'], on: {status: 'id'}}]});
		var select_wait = await q.select({table: 'app', keys:['adress', 'id', 'app_cometime', 'status', 'area'], where: {status: 2}, join: [{table: 'app_status', keys: ['name'], on: {status: 'id'}}]});
		var select = [];
		for(var i=0; i<select_new.length; i++){
			select.push(select_new[i]);
		}
		for(var i=0; i<select_wait.length; i++){
			select.push(select_wait[i]);
		}
		res.send(select);
	} catch(e){
		res.status(500).send();
	}
	
});

//Получение оформленных заявок
router.post('/get/app', async function(req, res){
	var token = await jwt.verify(req.body.token, secret);
	var select = await q.select({table: 'app', keys: ['']})
});

//Получение водителей
router.post('/get/drivers', async function(req, res){
	try{
		var token = await jwt.verify(req.body.token, secret);
		var select = await q.select({table: 'driver'});
		console.log(select);
		res.send(select);
	} catch(e){
		res.status(500).send();
	}
});

async function checkTime(){
	var time = new Date();
	//var hours = time.getHours(), minutes = time.getMinutes();
	var hours = 9, minutes = 0;
	if(hours==9 && minutes==0){
		try{
			var select = await q.select({table: 'day_amount', where: {active: true}, keys: ['id', 'amount'], join: [{on: {driver_id: 'id'}, table: 'driver', keys: ['telegram_id']}]});
			axios
				.post('https://asterisk.svo.kz/admin/send_drivers', select)
				.then(response => {
					for(var i=0; i<select.length; i++){
						var update = q.update({table: 'day_amount', where: {active: true}, data: {active: false}});
					}
					var drivers = q.select({table: 'driver', keys: ['id']});
					for(var i=0; i<drivers.length; i++){
						var insert = q.insert({table: 'day_amount', data: {driver_id: drivers[i].id}});
					}
				})
				.catch(error => {
					console.log('huerror: ' + error);
				});
		} catch(e){
			console.log(e);
		}
	}
}

//var x = setInterval(checkTime, 20*1000);
checkTime();

module.exports = router;
