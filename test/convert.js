const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');

const Convert = require('../lib/convert.js');
const SwaggerExample = require('../swagger-examples/01.json');

const expect = Code.expect;
const lab = exports.lab = Lab.script();


lab.experiment('convert - ', () => {


    lab.test('toRequests', (done) => {

        Convert.toRequests(SwaggerExample, function(err,api){
            console.log(err,api)
        })

        /*
        expect(Properties.parseProperty('x', Joi.string())).to.deep.equal({ 'type': 'string' });
        expect(Properties.parseProperty('x', Joi.array())).to.deep.equal({
            'type': 'array',
            'items': {
                'type': 'string'
            }
        });
        */

        done();
    });

});