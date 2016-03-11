'use strict';

import HelloWorldComponent from './assets/HelloWorld.soy';
import SoyIncDomRenderer from '../src/SoyIncDomRenderer';

describe('SoyIncDomRenderer', function() {
	var comp;

	afterEach(function() {
		if (comp) {
			comp.dispose();
		}
	});

	describe('Rendering', function() {
		it('should render component\'s "render" template', function() {
			comp = new HelloWorldComponent().render();
			assert.strictEqual('SPAN', comp.element.tagName);
			assert.strictEqual('Hello World!', comp.element.textContent);
		});

		it('should add soy param as attributes automatically', function() {
			comp = new HelloWorldComponent({
				name: 'Foo'
			}).render();
			assert.strictEqual('Foo', comp.name);
		});

		it('should pass attribute values to "render template"', function() {
			comp = new HelloWorldComponent({
				name: 'Foo'
			}).render();
			assert.strictEqual('SPAN', comp.element.tagName);
			assert.strictEqual('Hello Foo!', comp.element.textContent);
		});
	});
});
