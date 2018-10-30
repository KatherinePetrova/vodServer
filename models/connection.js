let mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "vod"
});

module.exports = con;