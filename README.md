# waypointer

## IN DEVELOPMENT

A HAPI plug-in that provides a template framework for OpenAPI (aka swagger).


````bash
$ npm install hapi-waypointer
```

``` javascript
const Inert = require('inert');
const Vision = require('vision');
const HapiSwagger = require('hapi-swagger');
const Waypointer = require('hapi-waypointer');

let server = new Hapi.Server();
server.connection({
    host: 'localhost',
    port: 3007
});

let waypointerOptions = {
    'themes': [{
        theme: require('waypointer-plain'),
        options: {'path': '/plain'}
    }]
}

server.register([
    Inert,
    Vision,
    HapiSwagger,
    {
        register: Waypointer,
        options: waypointerOptions
    }], (err) => {

        server.route(Routes);

        server.start((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Server running at:', server.info.uri);
            }
        });
    });
```

## Current themes
* [Plain](https://github.com/glennjones/waypointer-plain) - A plain html theme.
* [Hub](https://github.com/glennjones/waypointer-hub) - A theme based lossly on githubs API documentation style.
* [Form](https://github.com/glennjones/waypointer-form) - A form or playground theme



## Lab test
The project has integration and unit tests. To run the test within the project type one of the following commands.
```bash
$ lab
$ lab -r html -o coverage.html
$ lab -r html -o coverage.html --lint
$ lab -r console -o stdout -r html -o coverage.html --lint
```

## Issues
If you find any issue please file here on github and I will try and fix them.
