'use strict';

// This file just creates a goog module for the global IncrementalDOM variable,
// so that it can work inside soy compiled files.

/* jshint ignore:start */
goog.loadModule(function() {
	goog.module('incrementaldom');
	return IncrementalDOM;
});
/* jshint ignore:end */
