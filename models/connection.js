let mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "vod",
  password: "Mandriva2012"
});

module.exports = con;