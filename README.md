# postcss-extract-media-query

If page speed is important to you chances are high you're already doing code splitting (hopefully with a bundler such as [webpack](https://webpack.js.org/)). If your CSS is built mobile-first (in particular if using a framework such as [Bootstrap](https://getbootstrap.com/) or [Foundation](https://foundation.zurb.com/sites.html)) chances are also high you're loading more CSS than the current viewport actually needs.

It would be much better if a mobile user doesn't need to load desktop specific CSS, wouldn't it?

That's the use case I've written this PostCSS plugin for! It lets you extract all `@media` rules from your CSS and emit them as separate files which you can load as `<link rel="stylesheet" media="screen and (min-width: 1024px)" href="desktop.css">` or as dynamic import.

## Installation

- npm
```bash
npm install postcss-extract-media-query --save-dev
```

- yarn
```bash
yarn add postcss-extract-media-query --dev
```

## Usage

Simply add the plugin to you PostCSS config. If you're not familiar with PostCSS you should read the official [PostCSS documentation](https://github.com/postcss/postcss#usage) first.

### Webpack

Use the [postcss-loader](https://github.com/postcss/postcss-loader) in your `webpack.config.js`.

Then create a `postcss.config.js`:

```javascipt
const path = require('path');

module.exports = {
    plugins: {
        'postcss-extract-media-query': {
            output: {
                path: path.join(__dirname, 'dist')
            },
            queries: {
                'screen and (min-width: 1024)': 'desktop'
            }
        }
    }
};
```

You can find complete example setups in the <a href="examples">examples</a> folder.

## Options

| option        | default                      |
| ------------- | ---------------------------- |
| output.path   | path.join(__dirname, 'dist') |
| output.name   | '[name]-[query].[ext]'       |
| queries       | {}                           |
| combine       | true                         |
| stats         | true                         |

### output

By default the plugin will emit the extracted CSS files to your root folder. If you want to change this you have to specify an **absolute** path in `output.path`.

Apart from that you can customize the emited filenames by using `output.name`. `[name]` is the filename of the original CSS file, `[query]` the key of the extracted media rule and `[ext]` orignal file extension (mostly `css`).

```javascript
'postcss-extract-media-query': {
    output: {
        path: path.join(__dirname, 'dist'), // emit to 'dist' folder in root
        name: '[name]-[query].[ext]' // emited filename pattern
    }
}
```

### queries

By default the params of the extracted media rule is converted to kebab case and taken as key (e.g. `screen-and-min-width-1024-px`). You can change this by defining a certain name for this match.

```javascript
'postcss-extract-media-query': {
    queries: {
        'screen and (min-width: 1024)': 'desktop'
    }
}
```

### combine

The same media rules will probably appear several times in your original CSS file. This happens when you develop a CSS component and don't want to define the responsive behavior in another file / context.

By default the plugin will merge equal media rules into one after the extraction so you've got finally only one media rule per file. In case you don't want this merge (for whatever reason) you can disable it by setting this option `false`.

```javascript
'postcss-extract-media-query': {
    combine: true
}
```

### stats

By default the plugin displays in your terminal / command prompt which files have been emited. If you don't want to see it just set this option `false`.

```javascript
'postcss-extract-media-query': {
    stats: true
}
```

