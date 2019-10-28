
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const postcss = require('postcss');
const csswring = require('csswring');
const combineMedia = require('./combine-media');

module.exports = postcss.plugin('postcss-extract-media-query', opts => {
    
    opts = _.merge({
        entry: null,
        output: {
            path: path.join(__dirname, '..'),
            name: '[name]-[query].[ext]'
        },
        queries: {},
        extractAll: true,
        combine: true,
        minimize: false,
        stats: true
    }, opts);

    // Deprecation warnings
    // TODO: remove in future
    if (typeof opts.whitelist === 'boolean') {
        console.log(chalk.yellow(`[WARNING] whitelist option is deprecated and will be removed in future – please use extractAll`));
        if (opts.whitelist === true) {
            opts.extractAll = false;
        }
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

        root.walkAtRules('media', atRule => {

            const query = atRule.params;
            const queryname = opts.queries[query] || (opts.extractAll && _.kebabCase(query));

            if (queryname) {
                const css = postcss.root().append(atRule).toString();

                addMedia(queryname, css, query);

                if (opts.output.path) {
                    atRule.remove();
                }
            }
        });

        // emit file(s) with extracted css
        if (opts.output.path) {

            Object.keys(media).forEach(queryname => {

                let { css } = getMedia(queryname);

                const newFile = opts.output.name
                                .replace(/\[name\]/g, name)
                                .replace(/\[query\]/g, queryname)
                                .replace(/\[ext\]/g, ext)

                const newFilePath = path.join(opts.output.path, newFile);

                if (opts.combine === true) {
                    css = postcss([ combineMedia() ])
                                .process(css, { from: newFilePath })
                                .root
                                .toString();
                }

                if (opts.minimize === true) {
                    const cssMinimized = postcss([ csswring() ])
                                                .process(css, { from: newFilePath })
                                                .root
                                                .toString();
                    fs.outputFileSync(newFilePath, cssMinimized);
                } else {
                    fs.outputFileSync(newFilePath, css);
                }

                if (opts.stats === true) {
                    console.log(chalk.green('[extracted media query]'), newFile);
                }
            });
        }

        // if no output path defined (mostly testing purpose) merge back to root
        // TODO: remove this in v2 together with combine & minimize
        else {
            
            Object.keys(media).forEach(queryname => {

                let { css } = getMedia(queryname);

                if (opts.combine === true) {
                    css = postcss([ combineMedia() ])
                            .process(css, { from })
                            .root
                            .toString();
                }
                if (opts.minimize === true) {
                    css = postcss([ csswring() ])
                            .process(css, { from })
                            .root
                            .toString();
                }

                root.append(postcss.parse(css));
            });
        }

    };

});