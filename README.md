## Node FastCGI Application Interface

Allows Node.js applications to run through a FastCGI link to a webserver. Useful if you're on a shared host and can't run stuff yourself.

Look at the `apptest.js` code to see how it works. Essentially all you need to do is change your usual

	server.listen(PORT);

to this:

	require("./fcgi").handle(server)

This library will handle all the FCGI uglies for you, no additional fuss required.

Of course, your FCGI process manager/friendly webserver will need to be able to start up your app, the easiest way is to just do something like this:

	#!/usr/bin/env node
	require("./myAppEntryPoint");

Bear in mind your webserver may run under a user like wwwdata/nobody, so you might need to fix the PATH, as they probably won't be able to see the node binary.

Getting this running is pretty simple in Lighttpd. Just add something like this to your config:

	server.modules += ("mod_fastcgi")
	#fastcgi.debug = 1
	fastcgi.server = (
	  "/nodetest" =>
	  ((
	        "bin-path" => "/path/to/that/shell/bootstrap/script/you/wrote/server.fcgi",
	        "socket" => "/tmp/nodeapp.sock"
	        # or you can use this:
	        # "port" => 1666
	  ))
	)

Then just `touch /path/to/www/nodetest`.

## Dependencies

Needs my [fastcgi-stream](https://www.github.com/samcday/node-fastcgi-stream) module.

	npm install fastcgi-stream

## Huh?

I dunno. I was bored. I don't actually know if anyone would find this useful. Only situation I can think of is running Node.js stuff on a shared host or something.

If you actually find a use for this, let me know! If you need anything else added, don't hesistate to ask, or submit a pull request with your changes.
