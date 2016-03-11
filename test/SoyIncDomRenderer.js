'use strict';

import HelloWorldComponent from './assets/HelloWorld.soy';
import SoyIncDomRenderer from '../src/SoyIncDomRenderer';

HelloWorldComponent.ATTRS = {
	name: {}
};

describe('SoyIncDomRenderer', function() {
	var comp;

	afterEach(function() {
		if (comp) {
			comp.dispose();
		}
	});

	it('should render component\'s "render" template', function() {
		comp = new HelloWorldComponent().render();
		assert.strictEqual('SPAN', comp.element.tagName);
		assert.strictEqual('Hello World!', comp.element.textContent);
	});

	it('should pass attribute values to "render template"', function() {
		comp = new HelloWorldComponent({
			name: 'Foo'
		}).render();
		assert.strictEqual('SPAN', comp.element.tagName);
		assert.strictEqual('Hello Foo!', comp.element.textContent);
	});
});
