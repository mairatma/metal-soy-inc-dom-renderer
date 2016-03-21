'use strict';

var metalKarmaConfig = require('metal-karma-config');

module.exports = function (config) {
  metalKarmaConfig(config);
  config.files = [
    'node_modules/metal-soy-bundle/build/bundle.js',
    'node_modules/html2incdom/src/*.js',
    'node_modules/metal*/src/**/*.js',
    'src/**/*.js',
    'test/**/*.js'
  ];
  config.preprocessors['node_modules/html2incdom/src/*.js'] = ['babel', 'commonjs'];
  config.preprocessors['node_modules/metal-soy-bundle/build/bundle.js'] = ['commonjs'];
};
