'use strict';

var fcgi = require('fastcgi-stream');
var http = require('http');
var net = require('net');
var stream = require('stream');

// FCGI record content must not exceed 65535 bytes of data.
var FCGI_MAX_CONTENT_LEN = 65535;

/**
 * @param appCb  function to be called with `http.ClientRequest` and `http.ServerResponse` objects
 * @param errCb  socket error handler
 * @returns {connectFunction}
 */
function createHandler(appCb, errCb) {
  errCb = errCb || function (e) {
    console.error(e);
    console.error(e.stack);
  };

  return function connectFunction(socket) {
    // Register an error handler so the process doesn't get killed in case of socket read errors, etc.
    socket.on('error', errCb);

    var fastcgiStream = new fcgi.FastCGIStream(socket);

    var requests = {};

    fastcgiStream.on('record', function (requestId, record) {
      var request = requests[requestId];

      if (record instanceof fcgi.records.BeginRequest) {
        if (request) {
          socket.end();
        }

        var incomingStream = new stream.PassThrough();

        request = requests[requestId] = {
          req: new http.IncomingMessage(incomingStream)
        };

        // Express relies on this property being non-null.
        request.req.connection = {};

        // FastCGI environment variables.
        request.req.env = {};
      } else if (record instanceof fcgi.records.Params) {
        record.params.forEach(function (paramPair) {
          var key = paramPair[0].toLowerCase().replace(/_/g, '-');
          var val = paramPair[1];

          if (key && key.length && val && val.length) {
            if (key.indexOf('http-') === 0) {
              // This is a browser header.
              key = key.substr(5);
              request.req._addHeaderLine(key, val, request.req.headers);
            } else {
              // This is an FCGI environment property.
              switch (key) {
                case 'server-protocol':
                  var httpVersionParts = val.replace(/^HTTP\//, '').split('.');
                  if (httpVersionParts.length != 2)
                    httpVersionParts = [1, 1];
                  request.req.httpVersionMajor = Number(httpVersionParts[0]);
                  request.req.httpVersionMinor = Number(httpVersionParts[1]);
                  request.req.httpVersion = request.req.httpVersionMajor + '.' + request.req.httpVersionMinor;
                  break;

                case 'request-uri':
                  request.req.url = val;
                  break;

                case 'request-method':
                  request.req.method = val;
                  break;

                case 'request-scheme':
                  request.req.connection.encrypted = (val === 'https');
                  break;

                case 'remote-addr':
                  request.req.connection.remoteAddress = val;
                  break;

                case 'content-length':
                case 'content-type':
                  // These are CGI headers that need to be present in the HTTP request.
                  // No break here - we want these to be present on the `env` property too.
                  request.req._addHeaderLine(key, val, request.req.headers);

                default:
                  // Make these available on a special `env` property on the request object.
                  request.req.env[key] = val;
                  break;
              }
            }
          }
        });

        if (record.params.length == 0) {
          // Setup http response.
          request.res = new http.ServerResponse(request.req);

          var writable = new stream.Writable();

          writable._write = function (chunk, encoding, next) {
            if (!Buffer.isBuffer(chunk)) {
              chunk = new Buffer(chunk, encoding);
              encoding = buffer;
            }

            var currChunk;
            var record;
            var consumed = 0;
            var remaining = chunk.length;
            do {
              currChunk = chunk.slice(consumed, consumed + Math.min(remaining, FCGI_MAX_CONTENT_LEN));

              record = new fcgi.records.StdOut(currChunk);
              record.encoding = encoding;
              fastcgiStream.writeRecord(requestId, record);

              consumed += FCGI_MAX_CONTENT_LEN;
              remaining -= FCGI_MAX_CONTENT_LEN;
            } while (remaining > 0);

            next();
          };

          // When we try to write more data to the 'writable' stream than the highWaterMark,
          // it will pause the readable stream, so we need to pass on the 'drain' notification.
          writable.on('drain', function () {
            request.res.emit('drain');
          });
          request.res.assignSocket(writable);

          // TODO: would be nice to support this, but it's causing weird
          // shit when sent over the FCGI wire.
          request.res.useChunkedEncodingByDefault = false;

          // Sorta hacky, we override the _storeHeader implementation of
          // OutgoingMessage and blank out the http response header line.
          // Instead, we parse it out and put it into the Status http header.
          // TODO: should we check if we're supposed to be sending NPH or
          // something? Can we even do that in FCGI?
          request.res._storeHeader = function (statusLine, headers) {
            var matches = statusLine.match(/^HTTP\/[0-9]\.[0-9] (.+)/);
            if (!headers) {
              headers = {};
            }
            headers['Status'] = matches[1];
            http.OutgoingMessage.prototype._storeHeader.apply(this, ['', headers]);
          };

          request.res.on('finish', function () {
            var end = new fcgi.records.EndRequest(0, fcgi.records.EndRequest.protocolStatus.REQUEST_COMPLETE);
            fastcgiStream.writeRecord(requestId, end);

            socket.end();
          });

          try {
            appCb(request.req, request.res);
          } catch (e) {
            var end = new fcgi.records.EndRequest(-1, fcgi.records.EndRequest.protocolStatus.REQUEST_COMPLETE);
            fastcgiStream.writeRecord(requestId, end);

            socket.end();

            throw e;
          }
        }
      } else if (record instanceof fcgi.records.StdIn) {
        if (record.data.length) {
          request.req.emit('data', record.data);
        } else {
          // Emit 'end' on the IncomingMessage.
          request.req.emit('end');
        }
      }
    });
  };
};

exports.createServer = function(app) {
  return net.createServer(createHandler(app));
};

exports.listenFd = function(app, fd) {
  var server = exports.createServer(app);
  server.listen({fd: fd});
  return server;
};

exports.listenStdin = function(app) {
  return exports.listenFd(app, process.stdin.fd);
};

exports.listenPort = function(app, port) {
  var server = exports.createServer(app);
  server.listen(port);
  return server;
};
