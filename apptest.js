var fcgiApp = require("./fcgi"),
	http = require("http");

var myServer = http.createServer(function(req, res) {
	res.writeHead(200, {"Content-type": "text/html"});
	res.end("It works! :) " + Date.now() + "<pre>" + require("util").inspect(req) + "</pre>");
});

// Instead of this:
//myServer.listen(12345);

// You do this:
fcgiApp.handle(myServer);