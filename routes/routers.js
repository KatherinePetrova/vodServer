const router = require('express').Router();
const index = require('/index');
const users = require('/users');

//access for headers
router.use(function(req, res, next) {
 	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 	next();
}); 

router.use(function(req, res, next)) {
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

router.use(function(req, res, next)) {
	//Данные с формы, статус по умолчанию - новая заявка
	var app = {
		name: req.body.name,
		phone: req.body.phone,
		adress: req.body.adress,
		area: req.body.area,
		status: 1
	};

router.post(function(req, res){
	var app = {
		id: req.body.id,
		driver: null,
		app_cometime: null,
		app_start: null,
		status: 2
	};

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.send('respond with a resource');
});

router.post('/new', users.newUser);
router.post('/login', users.login);
router.post('/compare', users.compare);
router.post('/check', users.check);
router.post('/checkDriver', index.checkDriver);
router.post('/newDriver', index.newDriver);
router.post('/acceptDriver', index.acceptDriver);
router.post('/newApp', index.newApp);
router.post('/sendApp', index.sendApp);
router.post('/accept', index.Accept);
router.post('/cancel', index.cancel);
router.post('/updateDriverData', index.updateDriverData);
router.post('/deleteDriver', index.deleteDriver);
router.post('/statusOn', index.updateStatusOn);
router.post('/statusFinish', index.updateStatusFinish);
router.post('/getInfo', index.getInfo);

module.exports = router;