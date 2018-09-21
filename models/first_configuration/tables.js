let mysql = require('mysql');
let util = require('util');

//connection with mysql
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mansmans310796"
});

con.query = util.promisify(con.query);

//converting tables into utf8
async function convert(con){
	try{

		con.changeUser({database: "vod"});

		await con.query('ALTER TABLE user CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci');
		console.log('user table converted');

		await con.query('ALTER TABLE driver_status CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci');
		console.log('driver_status table converted');

		await con.query('ALTER TABLE driver CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci');
		console.log('user driver converted');

		await con.query('ALTER TABLE area CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci');
		console.log('area table converted');

		await con.query('ALTER TABLE app_status CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci');
		console.log('app_status table converted');

		await con.query('ALTER TABLE app CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci');
		console.log('app table converted');
	} catch(e){
		throw new Error(e);
	}
}

async function firstConfiguration(con){
	try{
		//database creation
		let database = "vod";
		await con.query('CREATE DATABASE ' + database);
		con.changeUser({database: database});
		console.log(database + 'database created successfully!');

		//tables creation
		await con.query('CREATE TABLE user (id INT AUTO_INCREMENT PRIMARY KEY, login VARCHAR(255), password VARCHAR(255), email VARCHAR(255))');
		console.log('user table created!');

		await con.query('CREATE TABLE driver_status (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), free BOOLEAN DEFAULT TRUE)');
		console.log('driver_status table created!');

		await con.query('CREATE TABLE driver (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), phone VARCHAR(255), status INT REFERENCES driver_status(id))');
		console.log('driver table created!');

		await con.query('CREATE TABLE area (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), cost INT)');
		console.log('area table created');

		await con.query('CREATE TABLE app_status(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
		console.log('app_status created');

		await con.query('CREATE TABLE app (id INT AUTO_INCREMENT PRIMARY KEY, adress VARCHAR(255), driver INT REFERENCES driver(id), area INT REFERENCES area(id), status INT REFERENCES app_status(id), app_cometime DATETIME DEFAULT CURRENT_TIMESTAMP, app_start DATETIME, app_finish DATETIME, app_time TIME, amount INT)');
		console.log('app table created');

		convert(con);

	} catch(e){
		throw new Error(e)
	}
}

firstConfiguration(con);
