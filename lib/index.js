
const Joi = require("@hapi/joi");
const Hoek = require("@hapi/hoek");
const Path = require("path");
const JSONDeRef = require("json-schema-ref-parser");
const SwaggerHAR = require("swagger-har");
const Base = require("../lib/base");
const Themes = require("../lib/themes");
const Handlebars = require("handlebars");
const HandlebarsHalpers = require("handlebars-helpers")({
  handlebars: Handlebars
});

// schema for properties
const schema = Joi.object({
  swagger: Joi.object(),
  themes: Joi.array().items({
    theme: Joi.object(),
    options: Joi.object()
  }),
  text: Joi.array().items(
    Joi.object({
      group: Joi.string(),
      path: Joi.string(),
      method: Joi.string(),
      place: Joi.string()
        .required()
        .allow("after", "before"),
      text: Joi.array()
        .items(
          Joi.object({
            name: Joi.string(),
            class: Joi.string(),
            markdown: Joi.string().required()
          })
        )
        .required()
    })
  ),
  snippets: Joi.object({
    lanugages: Joi.array().items({
      lanugage: Joi.string(),
      methodology: Joi.string()
    }),
    useExamples: Joi.boolean(),
    useDefaults: Joi.boolean(),
    defaults: Joi.object({
      string: Joi.string(),
      integer: Joi.string(),
      number: Joi.string(),
      boolean: Joi.string(),
      file: Joi.string()
    }).unknown()
  })
}).unknown();

// defaults settings
const defaults = {
  text: [],
  snippets: {
    lanugages: [
      {
        lanugage: "shell",
        methodology: "curl"
      }
    ],
    useExamples: true,
    useDefaults: true,
    useEnum: true,
    defaults: {
      string: "string",
      integer: "0",
      number: "0",
      boolean: "true",
      file: "filename.txt",
      int32: "0",
      int64: "0",
      float: "0.0",
      double: "0",
      byte: "",
      binary: "",
      date: "2016-01-01",
      "date-time": "2016-01-01T00:00:00Z",
      password: "********"
    }
  }
};

exports.plugin = {
  pkg: require("../package.json"),
  register: async function(server, options) {
    // Create a route for example
    let settings = Hoek.applyToDefaults(defaults, options);
    const publicDirPath = __dirname + Path.sep + ".." + Path.sep + "public";

    let dependencyList = ["@hapi/inert", "@hapi/vision"];
    if (!settings.swagger || !settings.swagger.swagger) {
      dependencyList.push("hapi-swagger");
    }
    function after(server) {
      console.log("done");
    }

    let routes = [
      {
        method: "GET",
        path: "/waypointer.json",
        handler: async (request, h) => {
          const schema = await getSwagger(settings, request);
          const waypointer = await Base.getJSON(schema, settings);
          return h.response(waypointer).type("application/json; charset=utf-8");
        }
      },
      {
        method: "GET",
        path: "/waypointer.har",
        handler: async (request, h) => {
          const schema = await getSwagger(settings, request);
          const har = await SwaggerHAR.toRequests(schema, {});
          return h.response(har).type("application/json; charset=utf-8");
        }
      }
    ];

    let templatesPaths = [];
    let partialsPaths = [];
    let helpersPaths = [];

    server.dependency(dependencyList, after);

    if (settings.themes) {
      settings.themes.forEach(function(theme) {
        if (theme.theme) {
          console.log(JSON.stringify(theme.options));

          theme.theme.register(
            null,
            theme.options ? theme.options : {},
            function(themeOptions) {
              //console.log(JSON.stringify(themeOptions));
              //console.log(JSON.stringify(theme.options.path));
              Joi.assert(themeOptions, Themes.schema);

              let customPath = Hoek.reach(theme, "options.path");

              // concat together the path info for template engine
              templatesPaths.push(themeOptions.templatesPath);
              if (themeOptions.partialsPath) {
                partialsPaths.push(themeOptions.partialsPath);
              }
              if (themeOptions.helpersPath) {
                helpersPaths.push(themeOptions.helpersPath);
              }

              routes.push({
                method: "GET",
                path: customPath
                  ? customPath
                  : "/waypointer/" + themeOptions.shortName + "/documentation",
                handler: async (request, h) => {
                  const schema = await getSwagger(settings, request);
                  const waypointer = await Base.getJSON(schema, settings);
                  const theme = getThemeData(themeOptions);
                  const out = Hoek.clone(waypointer);
                  out.theme = theme;
                  out.theme.pathRoot = customPath
                    ? customPath
                    : "/waypointer/" + themeOptions.shortName;

                  return h.view(themeOptions.shortName + "-index.html", out);
                }
              });

              routes.push({
                method: "GET",
                path: customPath
                  ? customPath + "/{group}"
                  : "/waypointer/" + themeOptions.shortName + "/{group}",
                handler: async (request, h) => {
                  const schema = await getSwagger(settings, request);
                  const waypointer = await Base.getJSON(schema, settings);
                  const theme = getThemeData(themeOptions);
                  const out = Hoek.clone(waypointer);
                  out.theme = theme;
                  out.theme.groupSelection = request.params.group;
                  out.theme.pathRoot = customPath
                    ? customPath
                    : "/waypointer/" + themeOptions.shortName;

                  return h.view(themeOptions.shortName + "-group.html", out);
                }
              });

              routes.push({
                method: "GET",
                path: customPath
                  ? customPath + "/{group}/{item}"
                  : "/waypointer/" + themeOptions.shortName + "/{group}/{item}",
                handler: async (request, h) => {
                  const schema = await getSwagger(settings, request);
                  const waypointer = await Base.getJSON(schema, settings);
                  const theme = getThemeData(themeOptions);
                  const out = Hoek.clone(waypointer);
                  out.theme = theme;
                  out.theme.groupSelection = request.params.group;
                  out.theme.itemSelection = request.params.item;
                  out.theme.pathRoot = customPath
                    ? customPath
                    : "/waypointer/" + themeOptions.shortName;

                  return h.view(themeOptions.shortName + "-item.html", out);
                }
              });

              routes.push({
                method: "GET",
                path:
                  "/waypointer/assets/" + themeOptions.shortName + "/{path*}",
                handler: {
                  directory: {
                    path: themeOptions.assetPath,
                    listing: true,
                    index: false
                  }
                }
              });
            }
          );
        }
      });

      // add routing for swaggerui static assets
      let engineOptions = {
        engines: {
          html: {
            module: Handlebars
          }
        },
        path: templatesPaths,
        isCached: false,
        compileOptions: { preventIndent: true }
      };
      //console.log(partialsPaths);
      //console.log(helpersPaths);

      if (partialsPaths.length > 0) {
        engineOptions.partialsPath = partialsPaths;
      }
      if (helpersPaths.length > 0) {
        engineOptions.helpersPath = helpersPaths;
      }
      server.views(engineOptions);

      server.route(routes);
    }

    return true;
  }
};

const getSwagger = async function(settings, request) {
  if (settings.swagger && settings.swagger.swagger) {
    let schema = Hoek.clone(settings.swagger);
    return JSONDeRef.dereference(schema, request);
  } else {
    var swagger = request.server.plugins["hapi-swagger"];
    return swagger.getJSON({deReference: true}, request);
  }
};

const getThemeData = function(theme) {
  let out = Hoek.clone(theme);
  // delete those items which would not be pass into template context
  delete out.templatePath;
  delete out.partialsPath;
  delete out.halpersPath;
  delete out.groupPages;
  delete out.groupItemPages;
  delete out.assetPath;

  return out;
};
