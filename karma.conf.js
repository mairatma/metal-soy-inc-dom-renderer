'use strict';

var metalKarmaConfig = require('metal-karma-config');

module.exports = function (config) {
  metalKarmaConfig(config);
  config.files = [
    'node_modules/metal-soy-incremental-dom-bundle/build/bundle.js',
    'node_modules/metal*/src/**/*.js',
    'src/**/*.js',
    'test/**/*.js'
  ];
};
