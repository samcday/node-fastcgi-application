#!/usr/bin/env node
var fcgiApp = require('./index');
var http = require('http');
var net = require('net');

var app = function (req, res) {
  res.writeHead(200, {'Content-type': 'text/html'});
  res.end('It works! :) ' + Date.now() + '<pre>' + require('util').inspect(req) + '</pre>');
}

// Instead of this:
//var myServer = http.createServer(app);
//myServer.listen(12345);

// You do this:
var myServer = net.createServer(fcgiApp(app));
myServer.listen({fd: process.stdin.fd});
// OR (depending on webserver configuration)
//myServer.listen(1666);
