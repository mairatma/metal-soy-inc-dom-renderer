'use strict';

import { Component, ComponentCollector } from 'metal-component';
import HelloWorldComponent from './assets/HelloWorld.soy';

// For now we can't follow alphabetical order here, since HelloWorld.soy needs
// to be imported before ExternalTemplate.soy, since ExternalTemplate depends
// on it.
// TODO: We should have a better dependency management for soy files so that
// the order in which they're required doesn't matter.
import ExternalTemplateComponent from './assets/ExternalTemplate.soy';
import NestedComponent from './assets/Nested.soy';
import NestedNoDataComponent from './assets/NestedNoData.soy';
import SoyIncDomRenderer from '../src/SoyIncDomRenderer';

describe('SoyIncDomRenderer', function() {
	var comp;

	afterEach(function() {
		if (comp) {
			comp.dispose();
		}
		ComponentCollector.components = {};
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
			});
			assert.ok(!comp.name);

			comp.render();
			assert.strictEqual('Foo', comp.name);
		});

		it('should not add soy param as attr if attr already exists', function() {
			comp = new HelloWorldComponent({
				name: 'Foo'
			});
			assert.ok(!comp.name);

			comp.addAttr('name', {
				value: 'Bar'
			});
			comp.render();
			assert.strictEqual('Bar', comp.name);
		});

		it('should pass attribute values to "render template"', function() {
			comp = new HelloWorldComponent({
				name: 'Foo'
			}).render();
			assert.strictEqual('SPAN', comp.element.tagName);
			assert.strictEqual('Hello Foo!', comp.element.textContent);
		});

		it('should update content when attribute value changes', function(done) {
			comp = new HelloWorldComponent({
				name: 'Foo'
			}).render();

			comp.name = 'Bar';
			comp.once('attrsSynced', function() {
				assert.strictEqual('Hello Bar!', comp.element.textContent);
				done();
			});
		});

		it('should not throw error if component has no templates', function() {
			class NoTemplateComponent extends Component {}
			NoTemplateComponent.RENDERER = SoyIncDomRenderer;

			assert.doesNotThrow(function() {
				comp = new NoTemplateComponent().render();
			});
		});

		it('should render contents from external templates', function() {
			comp = new ExternalTemplateComponent().render();
			assert.strictEqual('DIV', comp.element.tagName);
			assert.strictEqual('Hello External!', comp.element.textContent);
		});
	});

	describe('Nested Components', function() {
		it('should render and instantiate nested components', function() {
			comp = new NestedComponent().render();

			var nested = comp.components.hello;
			assert.ok(nested instanceof HelloWorldComponent);
			assert.strictEqual(nested.element, comp.element.childNodes[0]);
			assert.strictEqual('Hello World!', nested.element.textContent);
		});

		it('should pass data to nested components', function() {
			comp = new NestedComponent({
				name: 'Foo'
			}).render();

			var nested = comp.components.hello;
			assert.ok(nested instanceof HelloWorldComponent);
			assert.strictEqual(nested.element, comp.element.childNodes[0]);
			assert.strictEqual('Hello Foo!', nested.element.textContent);
		});

		it('should render and instantiate nested components even without id', function() {
			comp = new NestedNoDataComponent().render();
			var subComponentIds = Object.keys(comp.components);
			assert.strictEqual(1, subComponentIds.length);

			var nested = comp.components[subComponentIds[0]];
			assert.ok(nested instanceof HelloWorldComponent);
			assert.strictEqual(nested.element, comp.element.childNodes[0]);
			assert.strictEqual('Hello World!', nested.element.textContent);
		});
	});
});
