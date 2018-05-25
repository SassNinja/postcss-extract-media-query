
const pkg = require('./package.json');
const postcss = require('postcss');

module.exports = postcss.plugin(pkg.name, opts => {
    
    opts = Object.assign({}, opts);
    
    return css => {};
});