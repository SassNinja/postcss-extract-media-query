
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');

module.exports = postcss.plugin('postcss-extract-media-query', opts => {
    
    opts = _.merge({
        output: {
            path: path.join(__dirname, '..'),
            name: '[name]-[query].[ext]'
        },
        queries: {},
        combine: true
    }, opts);

    function addToCss(css, key, val) {
        if (!css[key]) {
            css[key] = postcss.parse(val);
        } else {
            css[key].append(val);
        }
    }

    return (css, res) => {

        const file = res.opts.from.match(/[^/\\]+\.\w+$/)[0].split('.');
        const name = file[0];
        const ext = file[1];

        const newCss = {};

        css.walkAtRules(rule => {
            if (rule.name === 'media') {

                // use custom query name if available (e.g. tablet)
                // or otherwise the query key (converted to kebab case)
                const key = typeof opts.queries[rule.params] === 'string'
                            ? opts.queries[rule.params] 
                            : _.kebabCase(rule.params);

                // extract media rule
                addToCss(newCss, key, rule);
            }
        });

        Object.keys(newCss).forEach(key => {
            
            const newFile = opts.output.name
                                .replace('[name]', name)
                                .replace('[query]', key)
                                .replace('[ext]', ext);
            const newFilePath = path.join(opts.output.path, newFile);

            // emit extracted css file
            fs.outputFile(newFilePath, newCss[key].toString())
                .catch(err => {
                    console.error(err);
                });
        });
    };
});