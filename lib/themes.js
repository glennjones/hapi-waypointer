
const Joi = require('@hapi/joi');

const themes = module.exports = {};

themes.schema = Joi.object({
    'name': Joi.string().required(),
    'version': Joi.string().required(),
    'shortName': Joi.string().required(),
    'templatesPath': Joi.string().required(),
    'partialsPath': Joi.string(),
    'helpersPath': Joi.string(),
    'indexPage': Joi.boolean(),
    'groupPages': Joi.boolean(),
    'itemPages': Joi.boolean(),
    'assetPath': Joi.string().required(),
    'cssLinks': Joi.array().items(Joi.string()),
    'jsLinks': Joi.array().items(Joi.string()),
}).unknown();

