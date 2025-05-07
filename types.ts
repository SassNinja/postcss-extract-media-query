import { Plugin, Transformer, Processor } from 'postcss';

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface PostcssConfig {
  plugins?:
    | Array<Transformer | Plugin | Processor | false>
    | Record<string, object | false>;
  pluginsSrc?: Record<string, any>;
}

export type NameFunction = ({
  path,
  name,
  query,
  ext,
}: {
  path: string;
  name: string;
  query: string;
  ext: string;
}) => string;

export interface PluginOptions {
  /**
   * By default the plugin will emit the extracted CSS files to your root folder. If you want to change this you have to define an **absolute** path for `output.path`.
   *
   * Apart from that you can customize the emitted filenames by using `output.name`. `[path]` is the relative path of the original CSS file relative to root, `[name]` is the filename of the original CSS file, `[query]` the key of the extracted media query and `[ext]` the original file extension (mostly `css`). Those three placeholders get replaced by the plugin later.
   *
   * Alternatively you may pass a name function which gets called with all placeholders as args.
   */
  output: {
    name: string | NameFunction;
    path: string;
  };
  /**
   * By default the params of the extracted media query is converted to kebab case and taken as key (e.g. `screen-and-min-width-1024-px`). You can change this by defining a certain name for a certain match. Make sure it **exactly** matches the params (see example below).
   */
  queries: Record<string, string>;
  /**
   * By default the plugin extracts all media queries into separate files. If you want it to only extract the ones you've defined a certain name for (see `queries` option) you have to set this option `false`. This ignores all media queries that don't have a custom name defined.
   */
  extractAll: boolean;
  /**
   * By default the plugin displays in your terminal / command prompt which files have been emitted. If you don't want to see it just set this option `false`.
   */
  stats: boolean;
  /**
   * By default the plugin uses the `from` value from the options of the loader or of the options you define in `postcss().process(css, { from: ... })`. Usually you don't need to change it but if you have to (e.g. when using the plugin standalone) you can define an **absolute** file path as entry.
   */
  entry: string | null;
  /**
   * This option is only relevant if you're using the `path` placeholder in `output.name`
   *
   * By default the plugin determines the root by looking for the package.json file and uses it as srcPath (if there's no app or src folder) to compute the relative path.
   *
   * In case the automatically determined srcPath doesn't suit you, it's possible to override it with this option.
   */
  src: {
    path: string | null;
  };
  /**
   * By default the plugin looks for a `postcss.config.js` file in your project's root (read [node-app-root-path](https://github.com/inxilpro/node-app-root-path) to understand how root is determined) and tries to apply all subsequent PostCSS plugins to the extracted CSS.
   *
   * In case this lookup doesn't suite you it's possible to specify the config path yourself.
   */
  config?: string | PostcssConfig;
}
