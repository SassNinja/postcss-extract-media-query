const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const { green } = require("kleur");
const postcss = require("postcss");
const SubsequentPlugins = require("./subsequent-plugins");

const plugins = new SubsequentPlugins();

module.exports = (opts) => {
  opts = _.merge(
    {
      output: {
        path: path.join(__dirname, ".."),
        name: "[name]-[query].[ext]",
      },
      queries: {},
      extractAll: true,
      stats: true,
      entry: null,
    },
    opts,
  );

  if (opts.config) {
    plugins.updateConfig(opts.config);
  }

  const media = {};

  function addMedia(name, key, css, query) {
    if (!Array.isArray(media?.[name]?.[key])) {
      media[name] = {
        ...media[name],
        [key]: new Array(),
      };
    }
    media[name][key].push({ css, query });
  }

  function getMedia(name, key) {
    if (media?.[name]?.[key]?.length) {
      const css = media[name][key].map((data) => data.css).join("\n");
      const query = media[name][key][0].query;

      return { css, query };
    } else {
      return {};
    }
  }

  return {
    postcssPlugin: "postcss-extract-media-query",
    Once(root, { result }) {
      let from = "undefined.css";

      if (opts.entry) {
        from = opts.entry;
      } else if (result.opts.from) {
        from = result.opts.from;
      }

      const file = from.match(/([^/\\]+)\.(\w+)(?:\?.+)?$/);
      const name = file[1];
      const ext = file[2];

      if (opts.output.path) {
        root.walkAtRules("media", (atRule) => {
          const query = atRule.params;
          const queryname =
            opts.queries[query] || (opts.extractAll && _.kebabCase(query));

          if (queryname) {
            const css = postcss.root().append(atRule).toString();
            addMedia(name, queryname, css, query);
            atRule.remove();
          }
        });
      }

      const promises = [];

      // gather promises only if output.path specified because otherwise
      // nothing has been extracted
      if (opts.output.path) {
        Object.entries(media).forEach(([name, value]) => {
          Object.keys(value).forEach((queryname) => {
            promises.push(
              new Promise((resolve) => {
                let { css } = getMedia(name, queryname);
                const newFile = opts.output.name
                  .replace(/\[name\]/g, name)
                  .replace(/\[query\]/g, queryname)
                  .replace(/\[ext\]/g, ext);
                const newFilePath = path.join(opts.output.path, newFile);
                const newFileDir = path.dirname(newFilePath);
                plugins.applyPlugins(css, newFilePath).then((css) => {
                  if (!fs.existsSync(path.dirname(newFilePath))) {
                    // make sure we can write
                    fs.mkdirSync(newFileDir, { recursive: true });
                  }
                  fs.writeFileSync(newFilePath, css);

                  if (opts.stats === true) {
                    console.log(green("[extracted media query]"), newFile);
                  }
                  resolve();
                });
              }),
            );
          });
        });
      }

      return Promise.all(promises);
    },
  };
};

module.exports.postcss = true;
