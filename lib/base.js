
const Hoek = require('@hapi/hoek');
const Slugify = require('slugify');
const Endpoints = require('../lib/endpoints');
const Text = require('../lib/text');
const Utilities = require('../lib/utilities');

const base = module.exports = {};



base.getJSON = async function(swagger, settings, ){

     const endpoints = await Endpoints.get(swagger, settings);
     return base.build(swagger, endpoints, settings);
}


base.build = function (swagger, endpoints, settings) {

    let out = {
        'waypointer': '1.0.0'
    };

    base.copyProperties(swagger, out, [
        'schemes',
        'host',
        'basePath',
        'info',
        'security',
        'securityDefinitions']);

    if(out.info){
        Utilities.convertMarkdownProperties(out.info, ['title','description'], true);
    }
    base.endpointConvertMarkdown(endpoints);

    out.groups = base.groupByTags(swagger, endpoints);
    out.groups.forEach(function(group){

        Utilities.convertMarkdownProperties(group, ['name','description'], true);
        group.endpoints.sort(base.operationsSorter['method']);
        group.endpoints.sort(base.operationsSorter['path']);
        group.endpoints.sort(base.operationsSorter['ordered']);
    })

    out = base.groupErrors( out );
    Text.inject(out, settings);
    return out;
};


base.copyProperties = function(source, target, propertyNames){
    propertyNames.forEach(function(name){
        if(source[name] !== undefined){
            target[name] = source[name];
        }
    })
}


base.groupByTags = function(swagger, endpoints){
    let groups = [];
    let found = [];

    if(swagger.tags){
        swagger.tags.forEach(function(tag){
            tag = Hoek.clone(tag);
            tag.pathFragment = Slugify(tag.name, {
                replacement: '-',
                lower: true,
                strict: true,
              });
            tag.endpoints = [];

            endpoints.forEach(function(endpoint){

                if(endpoint.tags){
                    endpoint.tags.forEach(function(endpointTag){

                        if(endpointTag.toLowerCase() === tag.name.toLowerCase()){
                            tag.endpoints.push(endpoint);
                            found.push(endpoint.id)
                        }
                    });
                }
            })

            groups.push(tag)
        })
    }

    let untaggedItems = {
        endpoints: []
    }
    endpoints.forEach(function (endpoint) {
        if (found.indexOf(endpoint.id) === -1) {
            untaggedItems.endpoints.push(endpoint);
        }
    });
    if (untaggedItems.endpoints.length > 0) {
        groups.push(untaggedItems);
    }


    return groups;
}


base.operationsSorter = {
    ordered: function (a, b) {
        if(a['x-order'] && b['x-order']){
        if (a['x-order'] < b['x-order']) return -1;
        if (a['x-order'] > b['x-order']) return 1;
        }
        return 0;
    },
    path: function (a, b) {
        if (a.path < b.path) return -1;
        if (a.path > b.path) return 1;
        return 0;
    },
    method: function (a, b) {
        if (a.method < b.method) return -1;
        if (a.method > b.method) return 1;
        return 0;
    }
}


base.endpointConvertMarkdown = function(endpoints){
    endpoints.forEach(function(endpoint){
        Utilities.convertMarkdownProperties(endpoint, ['summary','description'], true);
    });
    return endpoints
}


base.groupErrors = function( waypointer ){

    let apiErrors = [];
    if(waypointer.groups){
        waypointer.groups.forEach(function(group){

            let groupErrors = [];
            if(group.endpoints){
                group.endpoints.forEach(function(endpoint){

                    if(endpoint.responses && endpoint.responses.errors){
                        endpoint.responses.errors.sort(base.sortByStatusCode);
                        endpoint.responses.errors.forEach(function(err){

                            base.appendError(err, apiErrors);
                            base.appendError(err, groupErrors);
                        })
                    }
                })
            }
            if(groupErrors.length > 0){
                group.errors = groupErrors.sort(base.sortByStatusCode);
            }
        });
    }
    if(apiErrors.length > 0){
        waypointer.errors = apiErrors.sort(base.sortByStatusCode);
    }
    return waypointer
}


base.appendError = function( err, errArray ){
    let found = false;
    errArray.forEach(function(errItem){

        if(Hoek.deepEqual(err, errItem)){
            found = true;
        }
    });
    if(!found){
        errArray.push(err)
    }
    return errArray;
}



base.sortByStatusCode = function (a, b) {
    if (a.statusCode < b.statusCode) return -1;
    if (a.statusCode > b.statusCode) return 1;
    return 0;
}