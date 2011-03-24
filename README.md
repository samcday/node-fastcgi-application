## Node FastCGI Application Interface

Run Node.js applications through a FastCGI link to a webserver. Useful if you're on a shared host and can't run stuff yourself.

Checkout the code to see how it works. Easiest way to test this is setup an Apache vhost to point to the fcgi-bin directory, and install+enable mod_fcgid. 

## Dependencies

Needs my (fastcgi-stream)[https://www.github.com/samcday/node-fastcgi-stream] module.

	npm install fastcgi-stream

## Huh?

I dunno. I was bored. I don't actually know if anyone would find this useful. Only situation I can think of is running Node.js stuff on a shared host or something.

If you actually find a use for this, let me know! If you need anything else added, don't hesistate to ask, or submit a pull request with your changes.
