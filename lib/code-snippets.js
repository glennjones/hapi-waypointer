'use strict';
const Hoek = require('hoek');
const Joi = require('joi');
const SwaggerHAR = require('swagger-har');
const HTTPSnippet = require('httpsnippet');


const internals = {};
const codesnippets = module.exports = {};


codesnippets.toRequests = function (json, options, callback) {

    SwaggerHAR.toRequests( json, options, callback);
};


codesnippets.toCode = function (json, settings, callback) {

    let out = [];
    let options = Hoek.clone(settings.snippets);
    delete options.lanugages;

    this.toRequests(json, options, function (err, requestArr) {

        requestArr.forEach(function (requestItem) {

            let snippet = new HTTPSnippet(requestItem);
            if(settings.snippets){
                let itemOut = {
                    'path': options.path,
                    'method': options.method,
                    'code': []
                }

                settings.snippets.lanugages.forEach(function(lanugageItem){
                    let target = internals.getTarget(lanugageItem.lanugage, lanugageItem.methodology)
                    if(target){
                        itemOut.code.push({
                            name: target.title,
                            format: target.key,
                            snippet: snippet.convert(target.key, lanugageItem.methodology || target.default)
                        })
                    }
                });
                out.push(itemOut);
            }
        });
        callback(err, out);
    });
};


codesnippets.available = function () {

    const snippetsData = internals.availableTargets();
    return snippetsData.map(function(format){
        return {
             'lanugage': format.key,
             'methodologies': format.clients.map(function(client){
                 return client.key;
             })
        }
    });
}


internals.getTarget = function (language, methodology) {

    const snippetsData = internals.availableTargets();
    let i = snippetsData.length;
    while (i--) {
        if(snippetsData[i].key === language){
            if(!methodology){
                methodology = snippetsData[i].default
            }
            let x = snippetsData[i].clients.length;
             while (x--) {
                 if(snippetsData[i].clients[x].key === methodology){
                     return snippetsData[i];
                     break
                 }
             }
             break
        }
    }
    return null;
}




internals.availableTargets = function () {
    // cuases error
    //let targets = HTTPSnippet.availableTarget();
    return [
        {
            'default': 'libcurl',
            'extname': '.c',
            'title': 'C',
            'key': 'c',
            'clients': [
                {
                    'key': 'libcurl',
                    'title': 'Libcurl',
                    'link': 'http://curl.haxx.se/libcurl/',
                    'description': 'Simple REST and HTTP API Client for C'
                }
            ]
        },
        {
            'default': 'restsharp',
            'extname': '.cs',
            'title': 'C#',
            'key': 'csharp',
            'clients': [
                {
                    'key': 'restsharp',
                    'title': 'RestSharp',
                    'link': 'http://restsharp.org/',
                    'description': 'Simple REST and HTTP API Client for .NET'
                }
            ]
        },
        {
            'default': 'native',
            'extname': '.go',
            'title': 'Go',
            'key': 'go',
            'clients': [
                {
                    'key': 'native',
                    'title': 'NewRequest',
                    'link': 'http://golang.org/pkg/net/http/#NewRequest',
                    'description': 'Golang HTTP client request'
                }
            ]
        },
        {
            'default': 'unirest',
            'extname': '.java',
            'title': 'Java',
            'key': 'java',
            'clients': [
                {
                    'key': 'okhttp',
                    'title': 'OkHttp',
                    'link': 'http://square.github.io/okhttp/',
                    'description': 'An HTTP Request Client Library'
                },
                {
                    'key': 'unirest',
                    'title': 'Unirest',
                    'link': 'http://unirest.io/java.html',
                    'description': 'Lightweight HTTP Request Client Library'
                }
            ]
        },
        {
            'default': 'xhr',
            'extname': '.js',
            'title': 'JavaScript',
            'key': 'javascript',
            'clients': [
                {
                    'key': 'jquery',
                    'title': 'jQuery',
                    'link': 'http://api.jquery.com/jquery.ajax/',
                    'description': 'Perform an asynchronous HTTP (Ajax) requests with jQuery'
                },
                {
                    'key': 'xhr',
                    'title': 'XMLHttpRequest',
                    'link': 'https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest',
                    'description': 'W3C Standard API that provides scripted client functionality'
                }
            ]
        },
        {
            'default': 'native',
            'extname': '.js',
            'title': 'Node.js',
            'key': 'node',
            'clients': [
                {
                    'key': 'native',
                    'title': 'HTTP',
                    'link': 'http://nodejs.org/api/http.html#http_http_request_options_callback',
                    'description': 'Node.js native HTTP interface'
                },
                {
                    'key': 'request',
                    'title': 'Request',
                    'link': 'https://github.com/request/request',
                    'description': 'Simplified HTTP request client'
                },
                {
                    'key': 'unirest',
                    'title': 'Unirest',
                    'link': 'http://unirest.io/nodejs.html',
                    'description': 'Lightweight HTTP Request Client Library'
                }
            ]
        },
        {
            'default': 'nsurlsession',
            'extname': '.m',
            'title': 'Objective-C',
            'key': 'objc',
            'clients': [
                {
                    'key': 'nsurlsession',
                    'title': 'NSURLSession',
                    'link': 'https://developer.apple.com/library/mac/documentation/Foundation/Reference/NSURLSession_class/index.html',
                    'description': 'Foundation\'s NSURLSession request'
                }
            ]
        },
        {
            'default': 'cohttp',
            'extname': '.ml',
            'title': 'OCaml',
            'key': 'ocaml',
            'clients': [
                {
                    'key': 'cohttp',
                    'title': 'CoHTTP',
                    'link': 'https://github.com/mirage/ocaml-cohttp',
                    'description': 'Cohttp is a very lightweight HTTP server using Lwt or Async for OCaml'
                }
            ]
        },
        {
            'default': 'curl',
            'extname': '.php',
            'title': 'PHP',
            'key': 'php',
            'clients': [
                {
                    'key': 'curl',
                    'title': 'cURL',
                    'link': 'http://php.net/manual/en/book.curl.php',
                    'description': 'PHP with ext-curl'
                },
                {
                    'key': 'http1',
                    'title': 'HTTP v1',
                    'link': 'http://php.net/manual/en/book.http.php',
                    'description': 'PHP with pecl/http v1'
                },
                {
                    'key': 'http2',
                    'title': 'HTTP v2',
                    'link': 'http://devel-m6w6.rhcloud.com/mdref/http',
                    'description': 'PHP with pecl/http v2'
                }
            ]
        },
        {
            'default': 'python3',
            'extname': '.py',
            'title': 'Python',
            'key': 'python',
            'clients': [
                {
                    'key': 'python3',
                    'title': 'http.client',
                    'link': 'https://docs.python.org/3/library/http.client.html',
                    'description': 'Python3 HTTP Client'
                },
                {
                    'key': 'requests',
                    'title': 'Requests',
                    'link': 'http://docs.python-requests.org/en/latest/api/#requests.request',
                    'description': 'Requests HTTP library'
                }
            ]
        },
        {
            'default': 'native',
            'extname': '.rb',
            'title': 'Ruby',
            'key': 'ruby',
            'clients': [
                {
                    'key': 'native',
                    'title': 'net::http',
                    'link': 'http://ruby-doc.org/stdlib-2.2.1/libdoc/net/http/rdoc/Net/HTTP.html',
                    'description': 'Ruby HTTP client'
                }
            ]
        },
        {
            'default': 'curl',
            'extname': '.sh',
            'title': 'Shell',
            'key': 'shell',
            'clients': [
                {
                    'key': 'curl',
                    'title': 'cURL',
                    'link': 'http://curl.haxx.se/',
                    'description': 'cURL is a command line tool and library for transferring data with URL syntax'
                },
                {
                    'key': 'httpie',
                    'title': 'HTTPie',
                    'link': 'http://httpie.org/',
                    'description': 'a CLI, cURL-like tool for humans'
                },
                {
                    'key': 'wget',
                    'title': 'Wget',
                    'link': 'https://www.gnu.org/software/wget/',
                    'description': 'a free software package for retrieving files using HTTP, HTTPS'
                }
            ]
        },
        {
            'default': 'nsurlsession',
            'extname': '.swift',
            'title': 'Swift',
            'key': 'swift',
            'clients': [
                {
                    'key': 'nsurlsession',
                    'title': 'NSURLSession',
                    'link': 'https://developer.apple.com/library/mac/documentation/Foundation/Reference/NSURLSession_class/index.html',
                    'description': 'Foundation\'s NSURLSession request'
                }
            ]
        }
    ]
}
