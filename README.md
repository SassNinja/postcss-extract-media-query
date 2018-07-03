# postcss-extract-media-query

[![Build Status](https://travis-ci.com/SassNinja/postcss-extract-media-query.svg?branch=master)](https://travis-ci.com/SassNinja/postcss-extract-media-query)

If page speed is important to you chances are high you're already doing code splitting. If your CSS is built mobile-first (in particular if using a framework such as [Bootstrap](https://getbootstrap.com/) or [Foundation](https://foundation.zurb.com/sites.html)) chances are also high you're loading more CSS than the current viewport actually needs.

It would be much better if a mobile user doesn't need to load desktop specific CSS, wouldn't it?

That's the use case I've written this PostCSS plugin for! It lets you extract all `@media` rules from your CSS and emit them as separate files which you can load as `<link rel="stylesheet" media="screen and (min-width: 1024px)" href="desktop.css">` or as dynamic import.

**Before**

- example.css
```css
.foo { color: red }
@media screen and (min-width: 1024px) {
    .foo { color: green }
}
.bar { font-size: 1rem }
@media screen and (min-width: 1024px) {
    .bar { font-size: 2rem }
}
```

**After**

- example.css
```css
.foo { color: red }
.bar { font-size: 1rem }
```

- example-desktop.css
```css
@media screen and (min-width: 1024px) {
    .foo { color: green }
    .bar { font-size: 2rem }
}
```

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

Simply add the plugin to your PostCSS config. If you're not familiar with using PostCSS you should read the official [PostCSS documentation](https://github.com/postcss/postcss#usage) first.

You can find complete examples <a href="examples">here</a>.

## Options

| option        | default                    |
| ------------- | -------------------------- |
| output.path   | path.join(__dirname, '..') |
| output.name   | '[name]-[query].[ext]'     |
| queries       | {}                         |
| combine       | true                       |
| stats         | true                       |
| entry         | null                       |

### output

By default the plugin will emit the extracted CSS files to your root folder. If you want to change this you have to define an **absolute** path for `output.path`.

Apart from that you can customize the emited filenames by using `output.name`. `[name]` is the filename of the original CSS file, `[query]` the key of the extracted media query and `[ext]` the orignal file extension (mostly `css`). Those three placeholders get replaced by the plugin later.

> :warning: by emiting files itself the plugin breaks out of your bundler / task runner context meaning all your other loaders / pipes won't get applied to the extracted files!

```javascript
'postcss-extract-media-query': {
    output: {
        path: path.join(__dirname, 'dist'), // emit to 'dist' folder in root
        name: '[name]-[query].[ext]' // pattern of emited files
    }
}
```

### queries

By default the params of the extracted media query is converted to kebab case and taken as key (e.g. `screen-and-min-width-1024-px`). You can change this by defining a certain name for a certain match. Make sure it **exactly** matches the params (see example below).

```javascript
'postcss-extract-media-query': {
    queries: {
        'screen and (min-width: 1024px)': 'desktop'
    }
}
```

### whitelist

By default the plugin extracts all media queries into separate files. If you want it to only extract the ones you've defined a certain name for (see `queries` option) you have to set this option `true`. This ignores all media queries that don't have a custom name defined.

```javascript
'postcss-extract-media-query': {
    whitelist: true
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

### minimize

Since the emited, extracted files are outside of the bundler / task runner context your possibly defined CSS minification doesn't take effect. To minimize the emited files as well you have to set this option true.

```javascript
'postcss-extract-media-query': {
    minimize: true
}
```

### stats

By default the plugin displays in your terminal / command prompt which files have been emited. If you don't want to see it just set this option `false`.

```javascript
'postcss-extract-media-query': {
    stats: true
}
```

### entry

By default the plugin uses the `from` value from the options of the loader or of the options you define in `postcss().process(css, { from: ... })`. Usually you don't need to change it but if you have to (e.g. when using the plugin standalone) you can define an **absolute** file path as entry.

```javascript
'postcss-extract-media-query': {
    entry: path.join(__dirname, 'some/path/example.css')
}
```

## Webpack User?

If you're using webpack you should use [media-query-plugin](https://github.com/SassNinja/media-query-plugin) which is built for webpack only and thus comes with several advantages such as applying all other loaders you've defined and hash support for caching.

## Credits

If this plugin is helpful to you it'll be great when you give me a star on github and share it. Keeps me motivated to continue the development.