
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const postcss = require('postcss');
const csswring = require('csswring');

module.exports = postcss.plugin('postcss-extract-media-query', opts => {
    
    opts = _.merge({
        entry: null,
        output: {
            path: path.join(__dirname, '..'),
            name: '[name]-[query].[ext]'
        },
        queries: {},
        whitelist: false,
        combine: true,
        minimize: false,
        stats: true
    }, opts);

    function addToAtRules(atRules, key, atRule) {

        // init array for target key if undefined
        if (!atRules[key]) {
            atRules[key] = [];
        }

        // create new atRule if none existing or combine false
        if (atRules[key].length < 1 || opts.combine === false) {
            atRules[key].push(postcss.atRule({ name: atRule.name, params: atRule.params }));
        }

        // pointer to last item in array
        const lastAtRule = atRules[key][atRules[key].length - 1];

        // append all rules
        atRule.walkRules(rule => {
            lastAtRule.append(rule);
        });

        // remove atRule from original chunk
        atRule.remove();
    }

    return (root, result) => {

        let from = 'undefined.css';

        if (opts.entry) {
            from = opts.entry;
        } else if (result.opts.from) {
            from = result.opts.from;
        }

        const file = from.match(/[^/\\]+\.\w+$/)[0].split('.');
        const name = file[0];
        const ext = file[1];

        const newAtRules = {};

        root.walkAtRules('media', atRule => {

            // use custom query name if available (e.g. tablet)
            // or otherwise the query key (converted to kebab case)
            const hasCustomName = typeof opts.queries[atRule.params] === 'string';
            const key = hasCustomName === true
                        ? opts.queries[atRule.params]
                        : _.kebabCase(atRule.params);

            // extract media atRule and concatenate with existing atRule (same key)
            // if no whitelist set or if whitelist and atRule has custom query name match
            if (opts.whitelist === false || hasCustomName === true) {
                addToAtRules(newAtRules, key, atRule);
            }
        });

        Object.keys(newAtRules).forEach(key => {

            // emit extracted css file
            if (opts.output.path) {

                const newFile = opts.output.name
                                .replace(/\[name\]/g, name)
                                .replace(/\[query\]/g, key)
                                .replace(/\[ext\]/g, ext)

                const newFilePath = path.join(opts.output.path, newFile);

                // create new root
                // and append all extracted atRules with current key
                const newRoot = postcss.root();
                newAtRules[key].forEach(newAtRule => {
                    newRoot.append(newAtRule);
                });

                if (opts.minimize === true) {
                    const newRootMinimized = postcss([ csswring() ])
                                                .process(newRoot.toString(), { from: newFilePath })
                                                .root;
                    fs.outputFileSync(newFilePath, newRootMinimized.toString());
                } else {
                    fs.outputFileSync(newFilePath, newRoot.toString());
                }


                if (opts.stats === true) {
                    console.log(chalk.green('[extracted media query]'), newFile);
                }
            }
            // if no output path defined (mostly testing purpose) merge back to root
            else {
                newAtRules[key].forEach(newAtRule => {
                    root.append(newAtRule);
                });
            }

        });

    };

});