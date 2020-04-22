const Fs = require("fs");
const Path = require("path");
const Blipp = require('blipp');
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Nunjucks = require('nunjucks');
const NunjucksTools = require('@glennjones/nunjucks-tools');

const Routes = require('../bin/routes-simple.js');
const Pack = require('../package');
const Waypointer = require('../lib/index.js');



let swaggerOptions = {
    basePath: '/v1',
    pathPrefixSize: 2,
    info: {
        'title': 'Test Documentation',
        'description': 'This is a sample example of `API` documentation.',
        'version': Pack.version,
        'termsOfService': 'https://github.com/glennjones/waypointer/',
        'contact': {
            'email': 'glennjonesnet@gmail.com'
        },
        'license': {
            'name': 'MIT',
            'url': 'https://raw.githubusercontent.com/glennjones/waypointer/master/license.txt'
        }
    },
    tags: [{
        'name': 'Sum',
        'description': 'An API for working with maths. Provides add, divide, mulitple and subtract endpoints which calulate your sums.',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }, {
        'name': 'Store',
        'description': 'An API for storing sum data. You can list, add, delete, get and update the sums in the store. It has 3 ways of adding a new sum.',
        'externalDocs': {
            'description': 'Find out more',
            'url': 'http://example.org'
        }
    }],
    jsonEditor: true
};


// defaults settings
// 'swagger': JSON.parse(Fs.readFileSync(Path.join(__dirname, '../bin/petstore.json'))),
let waypointerOptions = {
    'themes': [{
        theme: require('waypointer-plain'),
        options: {'path': '/plain'}
    }],
    'text': [{
        group: 'Sum',
        place: 'before',
        text: [{
            name: 'Introduction',
            markdown: 'Introduction',
            class: 'group-section'
        }]
    },{
        group: 'Sum',
        place: 'after',
        text: [{
            name: 'Maths',
            markdown: ' __Text to explain maths__',
            class: 'group-footer'
        }]
    },{
        path: '/sum/add/{a}/{b}',
        method: 'put',
        place: 'after',
        text: [{
            markdown: '__Notes:__ Some notes about this endpoint',
            class: 'alert tip'
        }]
    },{
        place: 'before',
        text: [{
            name: 'Introduction',
            markdown: Fs.readFileSync(Path.join(__dirname, '/markdown/intro.md'), 'utf8'),
            class: 'introduction'
        },{
            name: 'API key',
            markdown: Fs.readFileSync(Path.join(__dirname, '/markdown/api-keys.md'), 'utf8'),
            class: 'api-key'
        }]
    },{
        place: 'after',
        text: [{
            name: 'Usage policy',
            markdown: 'Usage policy defines the uses you can put the data to.',
            class: 'data-usage'
        }]
    }],
    'snippets': {
        lanugages: [{
            'lanugage': 'javascript',
        },{
            'lanugage': 'node',
        }, {
            'lanugage': 'shell',
            'methodology': 'curl'
        }]
    }
};



   (async () => {
    const server = await new Hapi.Server({
        host: 'localhost',
        port: 3025,
    });



    await server.register([
        Inert,
        Vision,
        Blipp,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        },{
            plugin: Waypointer,
            options: waypointerOptions
        }
    ]);

    try {
        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch(err) {
        console.log(err);
    }

    let noCache = true
    server.views({
        path: Path.join(__dirname, '../templates'),
        engines: {
        njk: {
            compile: (src, options) => {
                const template = Nunjucks.compile(src, options.environment);
                return  (context) => {
                    return template.render(context);
                };
            },
            prepare:  (options, next) => {

                let env = Nunjucks.configure(options.path, { watch: noCache, noCache: noCache });
                //env.addExtension('with', new NunjucksTools.withTag(env));
                env.addExtension('withInclude', new NunjucksTools.includeWith(env));
                options.compileOptions.environment = env;

                return next();
            }
        }
        },
        isCached: false,
    });

    server.route(Routes);
})();
