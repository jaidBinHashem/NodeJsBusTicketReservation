//require
var express = require('express');
var app = express();
var login = require('./login');
var userhome = require('./userhome');
var adminhome = require('./adminhome');
var registration = require('./registration');
var socketIo = require('socket.io');

//start the server
var server = app.listen(1993,function(){
	console.log('Server Started at port 1993');
});

var io = socketIo(server);

//config
app.set('view engine', 'ejs');

//middleware
app.use('/',login);
app.use('/registration',registration);
app.use('/userhome', userhome);
app.use('/adminhome', adminhome);

app.use(express.static('./public/scripts'));
app.use(express.static('./public/css'));


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