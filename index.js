
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { green, yellow } = require('kleur');
const postcss = require('postcss');
const rootPath = require('app-root-path').path

function readConfigFile(file) {
    if (file && !path.isAbsolute(file)) {
        file = path.join(rootPath, file);
    }
    const filePath = file || path.join(rootPath, 'postcss.config.js');

    if (fs.existsSync(filePath)) {
        return require(filePath);
    }
    return {};
}

const config = readConfigFile();
const allPluginNames = config.plugins ? Object.keys(config.plugins) : [];
const subsequentPluginNames = allPluginNames.slice(allPluginNames.indexOf('postcss-extract-media-query') + 1);
const subsequentPlugins = subsequentPluginNames.map(name => ({ name, mod: require(name), opts: config.plugins[name] }));

function applySubsequentPlugins(css, filePath) {
    const plugins = subsequentPlugins.map(plugin => plugin.mod(plugin.opts))

    if (plugins.length) {
        return new Promise(resolve => {
            postcss(plugins)
                .process(css, { from: filePath })
                .then(result => {
                    resolve(result.css);
                })
        });
    }
    return Promise.resolve(css);
}

module.exports = postcss.plugin('postcss-extract-media-query', opts => {
    
    opts = _.merge({
        entry: null,
        output: {
            path: path.join(__dirname, '..'),
            name: '[name]-[query].[ext]'
        },
        queries: {},
        extractAll: true,
        stats: true
    }, opts);

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

        Object.keys(media).forEach(queryname => {

            promises.push(new Promise(resolve => {

                let { css } = getMedia(queryname);

                if (opts.output.path) {

                    const newFile = opts.output.name
                                    .replace(/\[name\]/g, name)
                                    .replace(/\[query\]/g, queryname)
                                    .replace(/\[ext\]/g, ext)
    
                    const newFilePath = path.join(opts.output.path, newFile);
                    const newFileDir = path.dirname(newFilePath);

                    if (opts.output.path) {

                        applySubsequentPlugins(css, newFilePath).then(css => {
    
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
                    }
                }
            }));
        });

        return Promise.all(promises);
    };

});