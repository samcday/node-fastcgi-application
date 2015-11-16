#!/usr/bin/env node
var fcgiApp = require('./index');
var http = require('http');

var app = function (req, res) {
  res.writeHead(200, {'Content-type': 'text/html'});
  res.end('It works! :) ' + Date.now() + '<pre>' + require('util').inspect(req) + '</pre>');
}

// Instead of this:
//var myServer = http.createServer(app);
//myServer.listen(12345);

// You do this:
var myServer = fcgiApp.listenStdin(app);
// OR (depending on webserver configuration)
var myServer = fcgiApp.listenPort(app, 1666);

// fcgiApp.listen* methods return a regular net.Server
// So you can stop it as normal:
myServer.close();
