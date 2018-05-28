
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const postcss = require('postcss');

module.exports = postcss.plugin('postcss-extract-media-query', opts => {
    
    opts = _.merge({
        output: {
            path: path.join(__dirname, '..'),
            name: '[name]-[query].[ext]'
        },
        queries: {},
        combine: true,
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

        const file = result.opts.from.match(/[^/\\]+\.\w+$/)[0].split('.');
        const name = file[0];
        const ext = file[1];

        const newAtRules = {};

        root.walkAtRules('media', atRule => {

            // use custom query name if available (e.g. tablet)
            // or otherwise the query key (converted to kebab case)
            const key = typeof opts.queries[atRule.params] === 'string'
                        ? opts.queries[atRule.params] 
                        : _.kebabCase(atRule.params);

            // extract media atRule
            // and concatenate with existing atRule (same key)
            addToAtRules(newAtRules, key, atRule);
        });

        Object.keys(newAtRules).forEach(key => {

            const newFile = opts.output.name
                                .replace('[name]', name)
                                .replace('[query]', key)
                                .replace('[ext]', ext);

            const newFilePath = path.join(opts.output.path, newFile);

            // create new root
            // and append all extracted atRules with current key
            const newRoot = postcss.root();
            newAtRules[key].forEach(newAtRule => {
                newRoot.append(newAtRule);
            });

            // emit extracted css file
            fs.outputFile(newFilePath, newRoot.toString())
                .then(() => {
                    if (opts.stats === true) {
                        console.log(chalk.green('[extracted media query]'), newFile);
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        });
    };
});