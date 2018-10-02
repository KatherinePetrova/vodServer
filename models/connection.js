let mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Mandriva2012", //Mandriva2012
  database: "vod"
});

module.exports = con;