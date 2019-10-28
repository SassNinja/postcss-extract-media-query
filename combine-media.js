/**
 * TODO: move this into own repo for more use cases
 */

const postcss = require('postcss');

module.exports = postcss.plugin('postcss-combine-media-query', opts => {

    const atRules = {};

    function addToAtRules(atRule) {
        const key = atRule.params;

        if (!atRules[key]) {
            atRules[key] = postcss.atRule({ name: atRule.name, params: atRule.params });
        }
        atRule.nodes.forEach(node => {
            atRules[key].append(node.clone());
        });

        atRule.remove();
    }
    
    return (root) => {

        root.walkAtRules('media', atRule => {
            addToAtRules(atRule);
        });

        Object.keys(atRules).forEach(key => {
            root.append(atRules[key]);
        });
    };
});