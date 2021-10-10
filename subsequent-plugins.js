const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const rootPath = require('app-root-path').path;

class SubsequentPlugins {
  constructor() {
    this.config = {};
    this.updateConfig();
  }

  /**
   * (Re)init with current postcss config
   */
  _init() {
    this.allNames = this.config.plugins ? Object.keys(this.config.plugins) : [];
    this.subsequentNames = this.allNames.slice(
      this.allNames.indexOf('postcss-extract-media-query') + 1
    );
    this.subsequentPlugins = this.subsequentNames.map((name) => ({
      name,
      mod:
        (this.config.pluginsSrc && this.config.pluginsSrc[name]) ||
        require(name),
      opts: this.config.plugins[name],
    }));
  }

  /**
   * Updates the postcss config by resolving file path
   * or by using the config file object
   *
   * @param {string|Object} file
   * @returns {Object}
   */
  updateConfig(file) {
    if (typeof file === 'object') {
      this.config = file;
      this._init();
      return this.config;
    }
    if (typeof file === 'string' && !path.isAbsolute(file)) {
      file = path.join(rootPath, file);
    }
    const filePath = file || path.join(rootPath, 'postcss.config.js');

    if (fs.existsSync(filePath)) {
      this.config = require(filePath);
    }
    this._init();
    return this.config;
  }

  /**
   * Apply all subsequent plugins to the (extracted) css
   *
   * @param {string} css
   * @param {string} filePath
   * @returns {string}
   */
  applyPlugins(css, filePath) {
    const plugins = this.subsequentPlugins.map((plugin) =>
      plugin.mod(plugin.opts)
    );

    if (plugins.length) {
      return new Promise((resolve) => {
        postcss(plugins)
          .process(css, { from: filePath, to: filePath })
          .then((result) => {
            resolve(result.css);
          });
      });
    }
    return Promise.resolve(css);
  }
}

module.exports = SubsequentPlugins;
