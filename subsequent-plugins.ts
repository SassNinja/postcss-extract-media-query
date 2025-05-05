import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { path as rootPath } from 'app-root-path';
import { PostcssConfig } from './types';

class SubsequentPlugins {
  protected config: PostcssConfig = {};
  protected allNames: string[] = [];
  protected subsequentNames: string[] = [];
  protected subsequentPlugins: {
    name: string;
    mod: any;
    opts: object | false;
  }[] = [];

  constructor() {
    this.updateConfig();
  }

  /**
   * (Re)init with current postcss config
   */
  private init() {
    this.allNames =
      typeof this.config.plugins === 'object'
        ? Object.keys(this.config.plugins)
        : [];
    this.subsequentNames = this.allNames.slice(
      this.allNames.indexOf('postcss-extract-media-query') + 1
    );
    this.subsequentPlugins = this.subsequentNames.map((name) => ({
      name,
      mod: this.config.pluginsSrc?.[name] || require(name),
      opts: (this.config.plugins as Record<string, object | false>)[name],
    }));
  }

  /**
   * Updates the postcss config by resolving file path or by using the config file object
   */
  public updateConfig(file?: string | PostcssConfig): PostcssConfig {
    if (typeof file === 'object') {
      this.config = file;
      this.init();
      return this.config;
    }
    if (typeof file === 'string' && !path.isAbsolute(file)) {
      file = path.join(rootPath, file);
    }
    const filePath = file || path.join(rootPath, 'postcss.config.js');

    if (fs.existsSync(filePath)) {
      this.config = require(filePath);
    }
    this.init();
    return this.config;
  }

  /**
   * Apply all subsequent plugins to the (extracted) css
   */
  public async applyPlugins(css: string, filePath: string): Promise<string> {
    const plugins = this.subsequentPlugins.map((plugin) =>
      plugin.mod(plugin.opts)
    );

    if (plugins.length) {
      const result = await postcss(plugins).process(css, {
        from: filePath,
        to: filePath,
      });
      return result.css;
    }
    return css;
  }
}

export = SubsequentPlugins;
