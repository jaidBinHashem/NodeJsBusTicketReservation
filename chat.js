var express = require('express');
var socketIo = require('socket.io');

var app = express();
var server = app.listen(1337, function(){
	//console.log(server);
	console.log('Server started ...');
});
var io = socketIo(server);

app.set('view engine', 'ejs');

app.get('/', function(req, res){
	res.render('view_chat');
});

io.sockets.on('connection', function(socket){
	console.log('Connected [ID: ' + socket.id + ']');

	socket.on('disconnect', function(){
		console.log('Disconnected [ID: ' + socket.id + ']');
	});

	socket.on('send data', function(data){
		console.log('Send Data [ID: ' + socket.id + ']: ' + data);
		io.sockets.emit('incoming data', {message: data});
	});
});

// 172.16.106.18:1337