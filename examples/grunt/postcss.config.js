
const path = require('path');

module.exports = {
    plugins: {
        'postcss-extract-media-query': {
            output: {
                path: path.join(__dirname, 'dist')
            },
            queries: {
                'screen and (min-width: 1024px)': 'desktop'
            }
        }
    }
};