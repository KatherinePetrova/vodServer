let mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mansmans310796",
  database: "vod"
});

module.exports = con;