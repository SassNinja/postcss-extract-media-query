import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { green } from 'kleur';
import postcss, { AcceptedPlugin } from 'postcss';
import SubsequentPlugins from './subsequent-plugins';
import { DeepPartial, PluginOptions } from './types';

const plugins = new SubsequentPlugins();

const plugin = (options?: DeepPartial<PluginOptions>): AcceptedPlugin => {
  const opts = _.merge(
    {
      output: {
        path: path.join(__dirname, '..'),
        name: '[name]-[query].[ext]',
      },
      queries: {},
      extractAll: true,
      stats: true,
      entry: null,
      src: {
        path: null,
      },
    },
    options
  ) as PluginOptions;

  if (opts.config) {
    plugins.updateConfig(opts.config);
  }

  const media: Record<string, { css: string; query: string }[]> = {};

  function addMedia(key: string, css: string, query: string) {
    if (!Array.isArray(media[key])) {
      media[key] = [];
    }
    media[key].push({ css, query });
  }

  function getMedia(key: string) {
    const css = media[key].map((data) => data.css).join('\n');
    const query = media[key][0].query;

    return { css, query };
  }

  function getRootPath(currentPath: string) {
    if (opts.src.path) {
      return null;
    }
    if (!currentPath || fs.existsSync(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }
    const parentPath = path.resolve(currentPath, '..');
    if (currentPath === parentPath) {
      return null;
    }
    return getRootPath(parentPath);
  }

  function getSrcPath(rootPath: string | null) {
    if (opts.src.path) {
      return opts.src.path;
    }
    if (!rootPath) {
      return rootPath;
    }
    const attempts = [
      path.join(rootPath, 'src', 'app'),
      path.join(rootPath, 'app', 'src'),
      path.join(rootPath, 'src'),
      path.join(rootPath, 'app'),
    ];
    for (const attempt of attempts) {
      if (fs.existsSync(attempt)) {
        return attempt;
      }
    }
    return rootPath;
  }

  return {
    postcssPlugin: 'postcss-extract-media-query',
    async Once(root, { result }) {
      let from = '';

      if (opts.entry) {
        from = opts.entry;
      } else if (result.opts.from) {
        from = result.opts.from;
      }

      const file = from.match(/([^/\\]+)\.(\w+)(?:\?.+)?$/);
      const name = file ? file[1] : 'undefined';
      const ext = file ? file[2] : 'css';
      const rootPath = getRootPath(opts.output.path);
      const srcPath = getSrcPath(rootPath);
      const relativePath =
        srcPath && from ? path.dirname(path.relative(srcPath, from)) : '';

      if (opts.output.path) {
        root.walkAtRules('media', (atRule) => {
          const query = atRule.params;
          const queryname =
            opts.queries[query] || (opts.extractAll && _.kebabCase(query));

          if (queryname) {
            const css = postcss.root().append(atRule).toString();

            addMedia(queryname, css, query);
            atRule.remove();
          }
        });
      }

      const promises: Promise<void>[] = [];

      // gather promises only if output.path specified because otherwise
      // nothing has been extracted
      if (opts.output.path) {
        Object.keys(media).forEach((queryname) => {
          promises.push(
            new Promise((resolve) => {
              let { css } = getMedia(queryname);
              const newFile =
                typeof opts.output.name === 'function'
                  ? opts.output.name({
                      path: relativePath,
                      name,
                      query: queryname,
                      ext,
                    })
                  : opts.output.name
                      .replace(/\[path\](\/)?/g, (_, sep = '') =>
                        // avoid absolute path if relativePath is empty
                        relativePath ? relativePath + sep : ''
                      )
                      .replace(/\[name\]/g, name)
                      .replace(/\[query\]/g, queryname)
                      .replace(/\[ext\]/g, ext);
              const newFilePath = path.isAbsolute(newFile)
                ? newFile
                : path.join(opts.output.path, newFile);
              const newFileDir = path.dirname(newFilePath);

              plugins.applyPlugins(css, newFilePath).then((css: string) => {
                if (!fs.existsSync(path.dirname(newFilePath))) {
                  // make sure we can write
                  fs.mkdirSync(newFileDir, { recursive: true });
                }
                fs.writeFileSync(newFilePath, css);

                if (opts.stats === true) {
                  console.log(green('[extracted media query]'), newFile);
                }
                resolve();
              });
            })
          );
        });
      }

      await Promise.all(promises);
    },
  };
};

plugin.postcss = true;

export = plugin;
