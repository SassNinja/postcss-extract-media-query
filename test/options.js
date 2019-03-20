
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const plugin = require('../index.js');

const exampleFile = fs.readFileSync('test/data/example.css');
const entryExampleFile = fs.readFileSync('test/data/entry-example.css');

describe('Options', function() {

    before(function() {
        fs.removeSync('test/output');
    });

    describe('whitelist', function() {
        it('true should cause to ignore all media queries except of the ones defined in the queries options', function() {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'screen and (min-width: 999px)': 'whitelist'
                },
                whitelist: true,
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).css;
            const filesCount = fs.readdirSync('test/output/').length;
            assert.isTrue(fs.existsSync('test/output/example-whitelist.css'));
            assert.equal(filesCount, 1);
        });
    });

    describe('entry', function() {
        it('entry should override any other from option', function() {
            const opts = {
                entry: path.join(__dirname, 'data/entry-example.css'),
                output: {
                    path: path.join(__dirname, 'output')
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(entryExampleFile, { from: 'test/data/example.css'}).css;
            assert.isTrue(fs.existsSync('test/output/entry-example-screen.css'));
        });
    });

    describe('output', function() {
        it('output.path false should prevent emitting any files', function() {
            const opts = {
                output: {
                    path: false
                }
            };
            postcss([ plugin(opts) ]).process(exampleFile).css;
            assert.isFalse(fs.existsSync('output'))
        });
        it('output.path should save extracted css to specific destination', function() {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).css;
            assert.isTrue(fs.existsSync('test/output/example-screen-and-min-width-1024-px.css'));
            assert.isTrue(fs.existsSync('test/output/example-screen-and-min-width-1200-px.css'));
        });
        it('output.name should affect emited filenames', function() {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output'),
                    name: '[query].[ext]'
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).css;
            assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1024-px.css'));
            assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1200-px.css'));
        });
        it('output.name should support using the same placeholder multiple times', function () {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output'),
                    name: '[query]-[query].[ext]'
                },
                stats: false
            };
            postcss([plugin(opts)]).process(exampleFile, { from: 'test/data/example.css' }).css;
            assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1024-px-screen-and-min-width-1024-px.css'));
            assert.isTrue(fs.existsSync('test/output/screen-and-min-width-1200-px-screen-and-min-width-1200-px.css'));
        });
    });

    describe('queries', function() {
        it('query with exact match should affect the emited filename', function() {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'screen and (min-width: 1024px)': 'desktop'
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).css;
            assert.isTrue(fs.existsSync('test/output/example-desktop.css'));
        });
        it('query without exact match should not affect the emited filename', function() {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output')
                },
                queries: {
                    'min-width: 1200px': 'xdesktop'
                },
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).css;
            assert.isFalse(fs.existsSync('test/output/example-xdesktop.css'));
        });
    });

    describe('combine', function() {
        it('combine true should merge equal query atRules', function() {
            const opts = {
                output: {
                    path: false
                },
                combine: true
            };
            let count = 0;
            const testRoot = postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).root;
            testRoot.walkAtRules(atRule => {
                count++;
            });
            assert.equal(count, 3);
        });
        it('combine false should prevent merge of equal query atRules', function() {
            const opts = {
                output: {
                    path: false
                },
                combine: false
            };
            let count = 0;
            const testRoot = postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).root;
            testRoot.walkAtRules(atRule => {
                count++;
            });
            assert.equal(count, 4);
        });
    });

    describe('minimize', function() {
        it('minimize true should minify the emited files\' CSS to one line', function() {
            const opts = {
                output: {
                    path: path.join(__dirname, 'output'),
                    name: '[name]-[query].min.[ext]'
                },
                queries: {
                    'screen and (min-width: 1024px)': 'desktop'
                },
                minimize: true,
                stats: false
            };
            postcss([ plugin(opts) ]).process(exampleFile, { from: 'test/data/example.css'}).css;
            const output = fs.readFileSync('test/output/example-desktop.min.css', 'utf8');
            const lines = output.split(/\r\n|\r|\n/).length;
            assert.equal(lines, 1);
        });
    });

});