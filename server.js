require('dotenv').load()
var unirest = require('unirest');
var _ = require('lodash');
var async = require('async');

var socket_io = require('socket.io');
var http = require('http');
var express = require('express');
var app = express();
var basicAuth = require('basic-auth');
//TODO environment varaibles https://github.com/motdotla/dotenv
//TODO figure out how to protect pem file
//TODO gitignore

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };
  
  var user = basicAuth(req);
  console.log('user = '+JSON.stringify(user));
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === process.env.USER_NAME && user.pass === process.env.PW) {
    return next();
  } else {
    return unauthorized(res);
  };
};

app.use(auth);
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

//var link_test = require('./services/link_test');




// app.get('/hello1', auth, function(req, res) {
 
//  res.writeHead(302, { 'Location': '/index.html' /*add other headers here...*/ }); res.end();
// });

app.get('/index.html', auth, function(req, res) {
 //res.send('Hell.htmlld');
});

var brokenList = require('./services/DRAFTlink_test')
io.on('connection', function (socket) {
    console.log('Client connected');
    socket.emit('connectionTEST1');
    socket.emit('connectionTEST2');
    socket.on('start search', function(pagination,maxQuery,url) {
        console.log('Received start search:', pagination+" "+maxQuery+" "+url+socket);
        this.emit('connectionTEST3');
        //console.log('socket',socket);
        
       // socket.broadcast.emit('message', message);
       var modifiedMax = 15+maxQuery;
       var report = new brokenList('www.hospitalmedicine.org',pagination,15,modifiedMax,socket);
       report.getBrokenList();
       //link_test.brokenList('www.hospitalmedicine.org',8,4,25);
    }.bind(socket));
});

server.listen(process.env.PORT || 8080);
//