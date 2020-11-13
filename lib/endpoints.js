const Hoek = require('@hapi/hoek');
const Slugify = require('slugify');
const Async = require('async');
const CodeSnippets = require('../lib/code-snippets');
const Beautify = require('js-beautify').js_beautify;
const Exemplar = require('swagger-exemplar');


const internals = {};
const endpoints = module.exports = {};


endpoints.get = async function (swagger, settings) {

    let out = [];
    const baseUrl = swagger.schemes[0] + '://' + swagger.host + swagger.basePath;
    let fcnArray = [];

    for (let pathName in swagger.paths) {
        let path = swagger.paths[pathName];
        for (let methodName in path) {

            fcnArray.push(function(callback){
                let swaggerEndpoint = path[methodName];
                let options = Hoek.clone(settings.snippets);
                options.path = pathName;
                options.method = methodName;

                CodeSnippets.toCode(swagger, {snippets: options}, function (err, endpointArr) {
                    let endpoint = endpointArr[0];
                    //endpoint.path = endpoint.url.replace(baseUrl, '');
                    let swaggerEndpoint = endpoints.getByPathMethod(swagger, endpoint.path, endpoint.method);
                    endpoints.copyProperties(swaggerEndpoint, endpoint, [
                        'summary',
                        'description',
                        'produces',
                        'consumes',
                        'deprecated',
                        'tags',
                        'x-order']);

                    endpoint.id = endpoint.method.toLowerCase() + swaggerEndpoint.operationId;
                    endpoint.pathFragment = Slugify(endpoint.summary, {
                        replacement: '-',
                        lower: true,
                        strict: true,
                      });
                    endpoints.copyParameters(swaggerEndpoint, endpoint);
                    endpoints.copyResponses(swaggerEndpoint, endpoint, swagger);
                    callback(null, endpoint);
                });
            })
         }
    }

    return Async.parallel(fcnArray);
};

endpoints.getByPathMethod = function(swagger, path, method){
    
    return Hoek.reach(swagger, ['paths', path, method.toLowerCase()]);
}

endpoints.copyProperties = function(source, target, propertyNames){
    propertyNames.forEach(function(name){
        if(source && source[name] !== undefined){
            target[name] = source[name];
        }
    })
}

endpoints.copyResponses = function(swaggerEndpoint, endpoint, swagger){

    if(swaggerEndpoint.responses){
        endpoint.responses = {};
        for(let response in swaggerEndpoint.responses){

            let statusCode = parseInt(response,10)

            if(statusCode < 300 || response.toLowerCase() === 'default'){
                if(!endpoint.responses.success){
                    endpoint.responses.success = [];
                }
                let successResponse = swaggerEndpoint.responses[response];
                let out = {
                    'statusCode': statusCode || 200,
                    'description': successResponse.description
                }

                if(successResponse.schema && successResponse.schema.type === 'object'){
                    out.schema = Beautify(JSON.stringify(successResponse.schema), { indent_size: 2 });
                    out.examples = [];
                    let example = Exemplar.convert(successResponse.schema, {});

                    let pkg = {
                        name: 'JSON',
                        mimeType: 'application/json',
                        data: '{err: "not found"}'
                    };
                    if(example){
                        pkg.data = Beautify(JSON.stringify(example), { indent_size: 2 })
                    }
                    out.examples.push(pkg)


                    if(successResponse.headers){
                        for(let headerName in successResponse.headers){
                           let header = successResponse.headers[headerName];
                           header.example = Exemplar.convert(header, {});
                        }
                        out.headers = successResponse.headers;
                    }


                    /*
                    out.examples.push({
                        name: 'XML',
                        mimeType: 'application/xml',
                        data: Schema.toXML(successResponse.schema)
                    });
                    */
                }




                endpoint.responses.success.push( out );
            }else{
                if(!endpoint.responses.errors){
                    endpoint.responses.errors = [];
                }

                endpoint.responses.errors.push({
                    'statusCode': statusCode,
                    'description': swaggerEndpoint.responses[response].description
                })
            }



        }
    }
}


endpoints.copyParameters = function(swaggerEndpoint, endpoint){
    if(swaggerEndpoint.parameters){
        endpoint.parameters = {};
        swaggerEndpoint.parameters.forEach(function(parameter){
            let prama;
            switch (parameter.in) {
                case 'header':
                    if(endpoint.parameters.header === undefined){
                        endpoint.parameters.header = [];
                    }
                    prama = Hoek.clone(parameter);
                    delete prama.in
                    endpoint.parameters.header.push(prama);
                    break;
                case 'path':
                    if(endpoint.parameters.path === undefined){
                        endpoint.parameters.path = [];
                    }
                    prama = Hoek.clone(parameter);
                    delete prama.in
                    endpoint.parameters.path.push(prama);
                    break;
                case 'query':
                    if(endpoint.parameters.query === undefined){
                        endpoint.parameters.query = [];
                    }
                    prama = Hoek.clone(parameter);
                    delete prama.in
                    endpoint.parameters.query.push(prama);
                    break;
                case 'formData':
                    if(endpoint.parameters.form === undefined){
                        endpoint.parameters.form = [];
                    }
                    prama = Hoek.clone(parameter);
                    delete prama.in
                    endpoint.parameters.form.push(prama);
                    break;
                case 'body':
                    prama = Hoek.clone(parameter);
                    delete prama.in
                    if(prama.schema){
                        prama.examples = [];
                        let example = Exemplar.convert(prama.schema,{}) || {err: 'not found'}

                        prama.examples.push({
                            name: 'JSON',
                            mimeType: 'application/json',
                            data: Beautify(JSON.stringify(example), { indent_size: 2 })
                        });
                    }

                    endpoint.parameters.body = prama;
                    break;
                }
        });
    }
}