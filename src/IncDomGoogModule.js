'use strict';

// This file just creates a goog module for the global IncrementalDOM variable,
// so that it can work inside soy compiled files.

/* jshint ignore:start */
goog.module('incrementaldom');
Object.keys(IncrementalDOM).forEach(key => exports[key] = IncrementalDOM[key]);
/* jshint ignore:end */
