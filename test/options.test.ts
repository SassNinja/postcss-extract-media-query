import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';
import postcss from 'postcss';
import plugin from '../index';
import { NameFunction } from '../types';

const exampleFile = fs.readFileSync('test/data/example.css', 'utf-8');
const entryExampleFile = fs.readFileSync(
  'test/data/entry-example.css',
  'utf-8'
);
const nameExampleFile = fs.readFileSync('test/data/name-example.css', 'utf-8');
const nameNestedExampleFile = fs.readFileSync(
  'test/data/nested/name-example.css',
  'utf-8'
);

describe('Options', () => {
  beforeEach(async () => {
    await rimraf('test/output');
  });

  describe('extractAll', () => {
    it('should only extract specified queries if false', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
        },
        queries: {
          'screen and (min-width: 999px)': 'specified',
        },
        extractAll: false,
        stats: false,
      };
      await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      const files = fs.readdirSync('test/output/');
      expect(fs.existsSync('test/output/example-specified.css')).toBe(true);
      expect(files.length).toEqual(1);
    });
    it('should extract all queries if true', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
        },
        queries: {
          'screen and (min-width: 999px)': 'specified',
        },
        extractAll: true,
        stats: false,
      };
      const result = await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      const files = fs.readdirSync('test/output/');
      expect(files.length).toBeGreaterThan(1);
      expect(result.css).not.toMatch(/@media/);
    });
  });

  describe('entry', () => {
    it('should override any other from option', async () => {
      const opts = {
        entry: path.join(__dirname, 'data/entry-example.namespace.css'),
        output: {
          path: path.join(__dirname, 'output'),
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(entryExampleFile, {
        from: 'test/data/example.css',
      });
      expect(
        fs.existsSync('test/output/entry-example.namespace-screen.css')
      ).toBe(true);
    });
  });

  describe('output', () => {
    it('should not emit any files if output.path is empty and not touch the CSS', async () => {
      const opts = {
        output: {
          path: '',
        },
      };
      const result = await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      expect(fs.existsSync('output')).toBe(false);
      expect(result.css).toEqual(exampleFile);
    });
    it('should use output.name for the emitted files if specified', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
          name: '[query].[ext]',
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      expect(
        fs.existsSync('test/output/screen-and-min-width-1024-px.css')
      ).toBe(true);
      expect(
        fs.existsSync('test/output/screen-and-min-width-1200-px.css')
      ).toBe(true);
    });
    it('should support using the same placeholder in output.name multiple times', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
          name: '[query]-[query].[ext]',
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      expect(
        fs.existsSync(
          'test/output/screen-and-min-width-1024-px-screen-and-min-width-1024-px.css'
        )
      ).toBe(true);
      expect(
        fs.existsSync(
          'test/output/screen-and-min-width-1200-px-screen-and-min-width-1200-px.css'
        )
      ).toBe(true);
    });
    it('should allow preserving the original folder structure using path placeholder', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
          name: '[path]/[name]-[query].[ext]',
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(nameExampleFile, {
        from: 'test/data/name-example.css',
      });
      expect(
        fs.existsSync('test/output/test/data/name-example-screen.css')
      ).toBe(true);
    });
    it('should allow processing multiple files with identical filename using path placeholder', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
          name: ({ path, name, query, ext }: Parameters<NameFunction>[0]) => {
            return `${path.replace(/^test\//, '')}/${name}-${query}.${ext}`;
          },
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(nameExampleFile, {
        from: 'test/data/name-example.css',
      });
      await postcss([plugin(opts)]).process(nameNestedExampleFile, {
        from: 'test/data/nested/name-example.css',
      });
      expect(fs.existsSync('test/output/data/name-example-screen.css')).toBe(
        true
      );
      expect(
        fs.existsSync('test/output/data/nested/name-example-screen.css')
      ).toBe(true);
    });
    it('should allow overriding the srcPath instead of relying on automatic determination', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
          name: '[path]/[name]-[query].[ext]',
        },
        src: {
          path: path.join(__dirname, '../test/data'),
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(nameNestedExampleFile, {
        from: 'test/data/nested/name-example.css',
      });
      expect(fs.existsSync('test/output/nested/name-example-screen.css')).toBe(
        true
      );
    });
  });

  describe('queries', () => {
    it('should use specified query that exactly matches', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
        },
        queries: {
          'screen and (min-width: 1024px)': 'desktop',
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      expect(fs.existsSync('test/output/example-desktop.css')).toBe(true);
    });
    it('should ignore specified query that does not exactly match', async () => {
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
        },
        queries: {
          'min-width: 1200px': 'xdesktop',
        },
        stats: false,
      };
      await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      expect(fs.existsSync('test/output/example-xdesktop.css')).toBe(false);
    });
  });

  describe('config', () => {
    it('should use opts.config if present to apply plugins', async () => {
      let precedingPluginCalls = 0;
      const precedingPlugin = () => {
        return {
          postcssPlugin: 'preceding-plugin',
          Once() {
            precedingPluginCalls++;
          },
        };
      };
      let subsequentPluginCalls = 0;
      const subsequentPlugin = () => {
        return {
          postcssPlugin: 'subsequent-plugin',
          Once() {
            subsequentPluginCalls++;
          },
        };
      };
      const opts = {
        output: {
          path: path.join(__dirname, 'output'),
        },
        stats: false,
        config: {
          pluginsSrc: {
            'preceding-plugin': precedingPlugin,
            'subsequent-plugin': subsequentPlugin,
          },
          plugins: {
            'preceding-plugin': {},
            'postcss-extract-media-query': {},
            'subsequent-plugin': {},
          },
        },
      };
      await postcss([plugin(opts)]).process(exampleFile, {
        from: 'test/data/example.css',
      });
      expect(precedingPluginCalls).toEqual(0);
      expect(subsequentPluginCalls).toBeGreaterThanOrEqual(1);
    });
  });
});
