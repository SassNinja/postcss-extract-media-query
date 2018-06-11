
const parcel = require('parcel-bundler');
const path = require('path');

const file = path.join(__dirname, 'src/example.js');

const options = {
    watch: false,
    sourceMaps: false
};

const bundler = new parcel(file, options);

bundler.bundle();