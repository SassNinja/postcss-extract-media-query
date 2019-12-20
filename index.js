
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { green, yellow } = require('kleur');
const postcss = require('postcss');
const SubsequentPlugins = require('./subsequent-plugins');

const plugins = new SubsequentPlugins();

module.exports = postcss.plugin('postcss-extract-media-query', opts => {
    
    opts = _.merge({
        output: {
            path: path.join(__dirname, '..'),
            name: '[name]-[query].[ext]'
        },
        queries: {},
        extractAll: true,
        stats: true,
        entry: null
    }, opts);

    if (opts.config) {
        plugins.updateConfig(opts.config);
    }

    // Deprecation warnings
    // TODO: remove in future
    if (typeof opts.whitelist === 'boolean') {
        console.log(yellow('[WARNING] whitelist option is deprecated – please use extractAll'));
        if (opts.whitelist === true) {
            opts.extractAll = false;
        }
    }
    if (opts.combine) {
        console.log(yellow('[WARNING] combine option is deprecated – please use another plugin for this'));
    }
    if (opts.minimize) {
        console.log(yellow('[WARNING] minimize option is deprecated – please use another plugin for this'));
    }

    const media = {};

    function addMedia(key, css, query) {
        if (!Array.isArray(media[key])) {
            media[key] = [];
        }
        media[key].push({ css, query });
    }

    function getMedia(key) {
        const css = media[key].map(data => data.css).join('\n');
        const query = media[key][0].query;

        return { css, query };
    }

    return (root, result) => {

        let from = 'undefined.css';

        if (opts.entry) {
            from = opts.entry;
        } else if (result.opts.from) {
            from = result.opts.from;
        }

        const file = from.match(/([^/\\]+)\.(\w+)(?:\?.+)?$/);
        const name = file[1];
        const ext = file[2];

        if (opts.output.path) {
            
            root.walkAtRules('media', atRule => {
    
                const query = atRule.params;
                const queryname = opts.queries[query] || (opts.extractAll && _.kebabCase(query));
    
                if (queryname) {
                    const css = postcss.root().append(atRule).toString();
    
                    addMedia(queryname, css, query);
                    atRule.remove();
                }
            });
        }

        const promises = [];

        // gather promises only if output.path specified because otherwise
        // nothing has been extracted
        if (opts.output.path) {
            Object.keys(media).forEach(queryname => {
                promises.push(new Promise(resolve => {
                    let { css } = getMedia(queryname);
                    const newFile = opts.output.name
                                    .replace(/\[name\]/g, name)
                                    .replace(/\[query\]/g, queryname)
                                    .replace(/\[ext\]/g, ext);
                    const newFilePath = path.join(opts.output.path, newFile);
                    const newFileDir = path.dirname(newFilePath);

                    plugins.applyPlugins(css, newFilePath).then(css => {

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
                }));
            });
        }

        return Promise.all(promises);
    };

});