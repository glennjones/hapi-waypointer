'use strict';
const Joi = require('joi');
const Hoek = require('hoek');
const Path = require('path');
const JSONDeRef = require('json-schema-ref-parser');
const SwaggerHAR  = require('swagger-har');
const CodeSnippets = require('../lib/code-snippets');
const Endpoints = require('../lib/endpoints');
const Base = require('../lib/base');
const Themes = require('../lib/themes');
const Handlebars = require('handlebars');
const HandlebarsHalpers = require('handlebars-helpers')({handlebars: Handlebars});


// schema for properties
const schema = Joi.object({
    'swagger': Joi.object(),
    'themes': Joi.array().items({
        'theme':  Joi.object(),
        'options':  Joi.object(),
    }),
    'text': Joi.array().items(Joi.object({
        'group': Joi.string(),
        'path': Joi.string(),
        'method': Joi.string(),
        'place': Joi.string().required().allow('after', 'before'),
        'text': Joi.array().items(Joi.object({
            'name': Joi.string(),
            'class': Joi.string(),
            'markdown': Joi.string().required()
        })).required()
     })),
    'snippets': Joi.object({
        'lanugages': Joi.array().items({
            'lanugage': Joi.string(),
            'methodology': Joi.string()
        }),
        'useExamples': Joi.boolean(),
        'useDefaults': Joi.boolean(),
        'defaults': Joi.object({
            'string': Joi.string(),
            'integer': Joi.string(),
            'number': Joi.string(),
            'boolean': Joi.string(),
            'file': Joi.string()
        }).unknown(),
    }),
}).unknown();


// defaults settings
const defaults = {
    'text': [],
    'snippets': {
        lanugages: [{
            'lanugage': 'shell',
            'methodology': 'curl'
        }],
        'useExamples': true,
        'useDefaults': true,
        'useEnum': true,
        'defaults': {
            'string': 'string',
            'integer': '0',
            'number': '0',
            'boolean': 'true',
            'file': 'filename.txt',
            'int32': '0',
            'int64': '0',
            'float': '0.0',
            'double': '0',
            'byte': '',
            'binary': '',
            'date': '2016-01-01',
            'date-time': '2016-01-01T00:00:00Z',
            'password': '********'
        }
    }
};



exports.register = function (plugin, options, next) {
    //console.log(options)

    let settings = Hoek.applyToDefaults(defaults, options);

    const publicDirPath = __dirname + Path.sep + '..' + Path.sep + 'public';

    let dependencyList = ['inert', 'vision']
    if(!settings.swagger || !settings.swagger.swagger){
        dependencyList.push('hapi-swagger');
    }



    // make sure we have other plug-in dependencies
    plugin.dependency(dependencyList, (pluginWithDependencies, nextWithDependencies) => {


        let routes = [{
            method: 'GET',
            path: '/waypointer.json',
            handler: (request, reply) => {

                getSwagger(settings, request, function(err, schema){

                    Base.getJSON(schema, settings, function(err, waypointer){
                        reply( waypointer ).type('application/json; charset=utf-8');;
                    })

                })
            }
        },{
            method: 'GET',
            path: '/waypointer.har',
            handler: (request, reply) => {

                getSwagger(settings, request, function(err, schema){

                    SwaggerHAR.toRequests( schema, {}, function(err, har){
                        reply(har).type('application/json; charset=utf-8');;
                    });
                })
            }
        }];

        let templatesPaths = [];
        let partialsPaths = [];
        let helpersPaths = [];


        // get all themes
        // loop them
        // add routes for each theme
        if(settings.themes){
            settings.themes.forEach(function(theme){
                if(theme.theme){
                    theme.theme.register(pluginWithDependencies, (theme.options)? theme.options : {}, function(themeOptions){

                        //console.log(JSON.stringify(themeOptions));
                        //console.log(JSON.stringify(theme.options.path));
                        Joi.assert(themeOptions, Themes.schema);

                        let customPath = Hoek.reach(theme,'options.path');

                        // concat together the path info for template engine
                        templatesPaths.push(themeOptions.templatesPath);
                        if(themeOptions.partialsPath){
                            partialsPaths.push(themeOptions.partialsPath);
                        }
                        if(themeOptions.helpersPath){
                            helpersPaths.push(themeOptions.helpersPath);
                        }

                        routes.push({
                            method: 'GET',
                            path: (customPath)? customPath : '/waypointer/'+ themeOptions.shortName + '/documentation',
                            handler: (request, reply) => {

                                getSwagger(settings, request, function(err, schema){

                                    Base.getJSON(schema, settings, function(err, waypointer){

                                         getThemeData(themeOptions, (err,theme) => {
                                            let out = Hoek.clone(waypointer);
                                            out.theme = theme;
                                            out.theme.pathRoot = (customPath)? customPath : '/waypointer/'+ themeOptions.shortName;
                                            reply.view(themeOptions.shortName + '-index.html', out);
                                        });
                                    });
                                });
                            }
                        });

                        routes.push({
                            method: 'GET',
                            path: (customPath)? customPath + '/{group}' : '/waypointer/'+ themeOptions.shortName + '/{group}',
                            handler: (request, reply) => {

                                getSwagger(settings, request, function(err, schema){

                                    Base.getJSON(schema, settings, function(err, waypointer){

                                         getThemeData(themeOptions, (err,theme) => {
                                            let out = Hoek.clone(waypointer);
                                            out.theme = theme;
                                            out.theme.groupSelection = request.params.group;
                                            out.theme.pathRoot = (customPath)? customPath : '/waypointer/'+ themeOptions.shortName;
                                            reply.view(themeOptions.shortName + '-group.html', out);
                                        });
                                    });
                                });
                            }
                        });

                        routes.push({
                            method: 'GET',
                            path: (customPath)? customPath + '/{group}/{item}' : '/waypointer/'+ themeOptions.shortName + '/{group}/{item}',
                            handler: (request, reply) => {

                                getSwagger(settings, request, function(err, schema){

                                    Base.getJSON(schema, settings, function(err, waypointer){

                                         getThemeData(themeOptions, (err,theme) => {
                                            let out = Hoek.clone(waypointer);
                                            out.theme = theme;
                                            out.theme.groupSelection = request.params.group;
                                            out.theme.itemSelection = request.params.item;
                                            out.theme.pathRoot = (customPath)? customPath : '/waypointer/'+ themeOptions.shortName;
                                            reply.view(themeOptions.shortName + '-item.html', out);
                                        });
                                    });
                                });
                            }
                        });

                        routes.push({
                            method: 'GET',
                            path: '/waypointer/assets/' + themeOptions.shortName + '/{path*}',
                            handler: {
                                directory: {
                                    path: themeOptions.assetPath,
                                    listing: true,
                                    index: false
                                }
                            }
                        });

                    })
                }
            })
        }

        // add routing for swaggerui static assets
        let engineOptions = {
            engines: {
                html: {
                    module: Handlebars
                }
            },
            path: templatesPaths,
            isCached: false,
            compileOptions: {preventIndent: true}
        }
        //console.log(partialsPaths);
        //console.log(helpersPaths);


        if(partialsPaths.length > 0){
            engineOptions.partialsPath = partialsPaths;
        }
        if(helpersPaths.length > 0){
            engineOptions.helpersPath = helpersPaths;
        }
        pluginWithDependencies.views(engineOptions);



        pluginWithDependencies.route(routes);
        nextWithDependencies();

    });

    next();
};


/**
 * attributes for plug-in uses 'name' and 'version' from package.json files
 */
exports.register.attributes = {
    pkg: require('../package.json')
};


const getSwagger = function(settings, request, callback){
    if(settings.swagger && settings.swagger.swagger){
        let schema = Hoek.clone(settings.swagger);
        JSONDeRef.dereference(schema, callback);
    }else{
        var swagger = request.server.plugins['hapi-swagger'];
        swagger.getJSON({}, request, callback);
    }
}

const getThemeData = function(theme, callback){
    let out = Hoek.clone(theme)
    // delete those items which would not be pass into template context
    delete out.templatePath;
    delete out.partialsPath;
    delete out.halpersPath;
    delete out.groupPages;
    delete out.groupItemPages;
    delete out.assetPath;

    callback(null, out);
}
