# fastcgi-application

[![Build Status][badge-travis-img]][badge-travis-url]
[![Dependency Information][badge-david-img]][badge-david-url]
[![Code Climate][badge-climate-img]][badge-climate-url]
[![Test Coverage][badge-coverage-img]][badge-coverage-url]

Run your Node.js server under a FastCGI link from a webserver. Useful if you want to run Node on a shared host, or if you have some kind of middleware you rely on in your webserver.

## Quickstart

```
npm install fastcgi-application --save
```

You can integrate this into an existing project by simply changing your listen call to use this library.

```js
// i.e change this:
server.listen(PORT);

// to this
require("fastcgi-application").handle(server);
```

A complete example can be seen in [example.js](example.js).

Your FCGI process manager will need to be able to start up your app directly.

The easiest way to do that is to add a `#!/usr/bin/env node` hashbang to the top of your entrypoint file and make it executable.

Bear in mind your webserver may run under a user like wwwdata/nobody, so you might need to fix the PATH, as the user probably won't be able to see the node binary.

### Lighttpd example

Here's some example config for Lighty.

```
server.modules += ("mod_fastcgi")
#fastcgi.debug = 1
fastcgi.server = (
  "/nodetest" =>
  ((
    "bin-path" => "/path/to/your/server/entrypoint.fcgi",
    "socket" => "/tmp/nodeapp.sock"
    # or you can use this:
    # "port" => 1666
  ))
)
```

Then just `touch /path/to/www/nodetest`.

## License

[Apache License 2.0](LICENSE)

[badge-travis-img]: https://img.shields.io/travis/samcday/node-fastcgi-application.svg?style=flat-square
[badge-travis-url]: https://travis-ci.org/samcday/node-fastcgi-application
[badge-david-img]: https://img.shields.io/david/samcday/node-fastcgi-application.svg?style=flat-square
[badge-david-url]: https://david-dm.org/samcday/node-fastcgi-application
[badge-npm-img]: https://nodei.co/npm/google-spreadsheets.png?downloads=true&downloadRank=true&stars=true
[badge-npm-url]: https://www.npmjs.org/package/google-spreadsheets
[badge-climate-img]: https://img.shields.io/codeclimate/github/samcday/node-fastcgi-application.svg?style=flat-square
[badge-climate-url]: https://codeclimate.com/github/samcday/node-fastcgi-application
[badge-coverage-img]: https://img.shields.io/codeclimate/coverage/github/samcday/node-fastcgi-application.svg?style=flat-square
[badge-coverage-url]: https://codeclimate.com/github/samcday/node-fastcgi-application