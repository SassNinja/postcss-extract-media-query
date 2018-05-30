
const extractMediaQuery = require('postcss-extract-media-query');
const extractMediaQueryConfig = require('./postcss.config').plugins['postcss-extract-media-query'];

const { FuseBox, PostCSSPlugin, CSSPlugin } = require('fuse-box');
const { src, task, exec, context } = require('fuse-box/sparky');

context(class {
    getConfig() {
        return FuseBox.init({
            homeDir: 'src',
            output: 'dist/$name.js',
            target: 'browser@es2015',
            ensureTsConfig: false,
            plugins: [
                [
                    PostCSSPlugin([
                        extractMediaQuery(extractMediaQueryConfig)
                    ]),
                    CSSPlugin({
                        outFile: (file) => `dist/${file}`
                    })
                ]
            ]
        });
    }
});

task('clean', async context => {
    await src('./dist')
        .clean('dist/')
        .exec()
});

task('default', ['clean'], async context => {
    const fuse = context.getConfig();
    fuse.bundle('example').instructions('> example.js');
    await fuse.run();
});
