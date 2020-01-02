
const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const postcss = require('postcss');
const plugin = require('../index.js');

const exampleFile = fs.readFileSync('test/data/example.css', 'utf-8');
const entryExampleFile = fs.readFileSync('test/data/entry-example.css', 'utf-8');

describe('Options', function() {

    before((done) => {
        rimraf('test/output', done);
    });

    describe('extractAll', function() {
        it('should only extract specified queries if false', (done) => {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'screen and (min-width: 999px)': 'specified'
                },
                extractAll: false,
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then(() => {
                const files = fs.readdirSync('test/output/');

                assert.isTrue(fs.existsSync('test/output/example-specified.css'));
                assert.equal(files.length, 1);
                done();
            });
        });
        it('should extract all queries if true', (done) => {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'screen and (min-width: 999px)': 'specified'
                },
                extractAll: true,
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then((result) => {
                const files = fs.readdirSync('test/output/');

                assert.isAbove(files.length, 1);
                assert.notMatch(result.css, /@media/);
                done();
            });
        });
    });

    describe('entry', function() {
        it('should override any other from option', (done) => {
            const opts = {
                entry: path.join(__dirname, 'data/entry-example.namespace.css'),
                output: {
                    path: path.join(__dirname, 'output')
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(entryExampleFile, { from: 'test/data/example.css' }).then(() => {
                assert.isTrue(fs.existsSync('test/output/entry-example.namespace-screen.css'));
                done();
            });
        });
    });

    describe('output', function() {
        it('should not emit any files if output.path is false and not touch the CSS', (done) => {
            const opts = {
                output: {
                    path: false
                }
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then((result) => {
                assert.isFalse(fs.existsSync('output'))
                assert.equal(result.css, exampleFile);
                done();
            });
        });
        it('should use output.name for the emitted files if specified', (done) => {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output'),
                    name: '[query].[ext]'
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then(() => {
                assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1024-px.css'));
                assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1200-px.css'));
                done();
            });
        });
        it('should support using the same placeholder in output.name multiple times', (done) => {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output'),
                    name: '[query]-[query].[ext]'
                },
                stats: false
            };
            postcss([plugin(opts)]).process(exampleFile, { from: 'test/data/example.css' }).then(() => {
                assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1024-px-screen-and-min-width-1024-px.css'));
                assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1200-px-screen-and-min-width-1200-px.css'));
                done();
            });
        });
    });

    describe('queries', function() {
        it('should use specified query that exactly matches', (done) => {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'screen and (min-width: 1024px)': 'desktop'
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then(() => {
                assert.isTrue(fs.existsSync('test/output/example-desktop.css'));
                done();
            });
        });
        it('should ignore specified query that does not exactly match', (done) => {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'min-width: 1200px': 'xdesktop'
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then(() => {
                assert.isFalse(fs.existsSync('test/output/example-xdesktop.css'));
                done();
            });
        });
    });

    describe('config', function() {
        it('should use opts.config if present to apply plugins', (done) => {
            let precedingPluginCalls = 0;
            const precedingPlugin = postcss.plugin('preceding-plugin', (opts) => {
                return (root, result) => {
                    precedingPluginCalls++;
                };
            });
            let subsequentPluginCalls = 0;
            const subsequentPlugin = postcss.plugin('subsequent-plugin', (opts) => {
                return (root, result) => {
                    subsequentPluginCalls++;
                };
            });
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                stats: false,
                config: {
                    pluginsSrc: {
                        'preceding-plugin': precedingPlugin,
                        'subsequent-plugin': subsequentPlugin
                    },
                    plugins: {
                        'preceding-plugin': {},
                        'postcss-extract-media-query': {},
                        'subsequent-plugin': {}
                    }
                }
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css' }).then(() => {
                assert.equal(precedingPluginCalls, 0);
                assert.isAtLeast(subsequentPluginCalls, 1);
                done();
            });
        });
    });

});
