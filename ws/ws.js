const WebSocket = require('ws');
var con = require('../models/connection');
var query = require('node-mysql-ejq');

var q = new query(con);

const wss = new WebSocket.Server({ port: 8387 });

console.log('webSocket is listening on port 8387');

wss.on('connection', function connection(ws) {

  console.log("connected::: " + ws);

  ws.on('message', function incoming(message) {

    var mess = JSON.parse(message);
    var url = mess.url;

    switch(url){
      case 'test':
        
        ws.send(url);
        break;
    }

      ws.send(message);
  });

});
