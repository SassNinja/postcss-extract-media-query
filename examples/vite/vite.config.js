export default {
  build: {
    minify: false,
    assetsDir: '',
    rollupOptions: {
      input: ['src/example.js'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },

    // Unfortunately vite seems to empty the output directory after my postcss plugin
    // has emitted the extracted files to it. This reveals the limitation of a postcss-only solution.
    emptyOutDir: false,
  },
};
