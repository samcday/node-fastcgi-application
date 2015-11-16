"use strict";
var fastcgi = require('fastcgi-stream');
var fs = require('fs');
var net = require('net');
var path = require('path');
var should = require('should');

var fcgiApp = require('../index');

var SOCK = path.join(__dirname, './test.sock');

describe('FastCGI application tests', function () {
  beforeEach(function (done) {
    fs.exists(SOCK, function (exists) {
      if (exists) {
        fs.unlink(SOCK, done);
      } else {
        done();
      }
    });
  });

  it('should set headers and environment variables on the request', function (done) {
    var server = fcgiApp.createServer(function (req, res) {
      should(req.env).be.ok();
      req.env.should.have.property('remote-user');
      req.env['remote-user'].should.eql('user-env');

      should(req.headers).be.ok();
      req.headers.should.have.property('remote-user');
      req.headers['remote-user'].should.equal('user-header');

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end();
    });
    server.listen(SOCK);

    var client = net.connect({ path: SOCK }, function () { });
    var fcgiStream = new fastcgi.FastCGIStream(client);

    var requestId = 1;
    fcgiStream.writeRecord(requestId, new fastcgi.records.BeginRequest(
      fastcgi.records.BeginRequest.roles.RESPONDER,
      fastcgi.records.BeginRequest.flags.KEEP_CONN
    ));

    fcgiStream.writeRecord(requestId, new fastcgi.records.Params([
      ['REMOTE_USER', 'user-env'],
      ['HTTP_REMOTE_USER', 'user-header']
    ]));
    fcgiStream.writeRecord(requestId, new fastcgi.records.Params([]));
    fcgiStream.writeRecord(requestId, new fastcgi.records.StdIn(''));
    client.end();

    // Consume the response.
    fcgiStream.on('record', function (requestId, record) {
      should(requestId).be.eql(1);

      if (requestId !== fastcgi.constants.NULL_REQUEST_ID) {
        switch (record.TYPE) {
          case fastcgi.records.EndRequest.TYPE: {
            server.close(done);
            break;
          }
        }
      }
    });
  });

  it('should set request attributes based on common environment variables', function (done) {
    var server = fcgiApp.createServer(function (req, res) {
      should(req.env).be.ok();

      should(req.httpVersionMinor).be.eql(1);
      should(req.httpVersionMajor).be.eql(1);
      should(req.httpVersion).be.eql('1.1');

      should(req.url).be.eql('/');
      should(req.method).be.eql('GET');
      should(req.connection.encrypted).be.eql(true);
      should(req.connection.remoteAddress).be.eql('192.168.1.100');

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end();
    });
    server.listen(SOCK);

    var client = net.connect({ path: SOCK }, function () { });
    var fcgiStream = new fastcgi.FastCGIStream(client);

    var requestId = 1;
    fcgiStream.writeRecord(requestId, new fastcgi.records.BeginRequest(
      fastcgi.records.BeginRequest.roles.RESPONDER,
      fastcgi.records.BeginRequest.flags.KEEP_CONN
    ));

    fcgiStream.writeRecord(requestId, new fastcgi.records.Params([
      ['SERVER_PROTOCOL', 'HTTP/1.1'],
      ['REQUEST_URI', '/'],
      ['REQUEST_METHOD', 'GET'],
      ['REQUEST_SCHEME', 'https'],
      ['REMOTE_ADDR', '192.168.1.100']
    ]));
    fcgiStream.writeRecord(requestId, new fastcgi.records.Params([]));
    fcgiStream.writeRecord(requestId, new fastcgi.records.StdIn(''));
    client.end();

    // Consume the response.
    fcgiStream.on('record', function (requestId, record) {
      should(requestId).be.eql(1);

      if (requestId !== fastcgi.constants.NULL_REQUEST_ID) {
        switch (record.TYPE) {
          case fastcgi.records.EndRequest.TYPE: {
            server.close(done);
            break;
          }
        }
      }
    });
  });
});
