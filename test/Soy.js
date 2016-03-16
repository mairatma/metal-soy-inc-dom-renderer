'use strict';

import dom from 'metal-dom';
import { Component, ComponentCollector } from 'metal-component';
import {
	HelloWorld as HelloWorldComponent,
	templates as helloWorldTemplates
} from './assets/HelloWorld.soy';
import { IJData as IJDataComponent } from './assets/IJData.soy';
import { Events as EventsComponent } from './assets/Events.soy';

// For now we can't follow alphabetical order here, since HelloWorld.soy needs
// to be imported before ExternalTemplate.soy, since ExternalTemplate depends
// on it.
// TODO: We should have a better dependency management for soy files so that
// the order in which they're required doesn't matter.
import { ExternalTemplate as ExternalTemplateComponent } from './assets/ExternalTemplate.soy';
import { Nested as NestedComponent } from './assets/Nested.soy';
import { NestedLevels as NestedLevelsComponent } from './assets/NestedLevels.soy';
import { NestedNoData as NestedNoDataComponent } from './assets/NestedNoData.soy';
import Soy from '../src/Soy';

describe('Soy', function() {
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
			assert.ok(dom.hasClass(comp.element, 'render'));
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

		it('should not trigger update when changed attribute is not used by template', function(done) {
			comp = new HelloWorldComponent().render();
			comp.addAttr('foo');
			sinon.spy(IncrementalDOM, 'patchOuter');

			comp.foo = 'Bar';
			comp.once('attrsSynced', function() {
				assert.strictEqual(0, IncrementalDOM.patchOuter.callCount);
				IncrementalDOM.patchOuter.restore();
				done();
			});
		});

		it('should not throw error if rendering component with no templates', function() {
			class NoTemplateComponent extends Component {}
			NoTemplateComponent.RENDERER = Soy;

			assert.doesNotThrow(function() {
				comp = new NoTemplateComponent().render();
			});
		});

		it('should not throw error if updating component with no templates', function(done) {
			class NoTemplateComponent extends Component {}
			NoTemplateComponent.ATTRS = {
				foo: {
				}
			};
			NoTemplateComponent.RENDERER = Soy;

			comp = new NoTemplateComponent().render();
			sinon.spy(IncrementalDOM, 'patchOuter');

			comp.foo = 'Bar';
			comp.once('attrsSynced', function() {
				assert.strictEqual(0, IncrementalDOM.patchOuter.callCount);
				IncrementalDOM.patchOuter.restore();
				done();
			});
		});

		it('should render contents from external templates', function() {
			comp = new ExternalTemplateComponent().render();
			assert.strictEqual('DIV', comp.element.tagName);
			assert.strictEqual('Hello External!', comp.element.textContent);
		});

		it('should allow specifying injected data content', function() {
			Soy.setInjectedData({
				content: 'Foo'
			});
			comp = new IJDataComponent().render();
			assert.strictEqual('DIV', comp.element.tagName);
			assert.strictEqual('Foo', comp.element.textContent);
		});

		it('should not throw error if setting injected data to null', function() {
			Soy.setInjectedData(null);
			comp = new IJDataComponent().render();
			assert.strictEqual('DIV', comp.element.tagName);
			assert.strictEqual('', comp.element.textContent);
		});

		it('should allow registering template with any name for a component', function() {
			class TestComponent extends Component {}
			Soy.register(TestComponent, helloWorldTemplates, 'content');

			comp = new TestComponent().render();
			assert.strictEqual('SPAN', comp.element.tagName);
			assert.ok(dom.hasClass(comp.element, 'content'));
			assert.strictEqual('Hello World!', comp.element.textContent);
		});
	});

	describe('Inline Events', function() {
		beforeEach(function() {
			EventsComponent.prototype.handleClick= sinon.stub();
		});

		it('should attach inline events found in component\'s soy template', function() {
			comp = new EventsComponent().render();

			dom.triggerEvent(comp.element, 'click');
			assert.strictEqual(0, comp.handleClick.callCount);

			dom.triggerEvent(comp.element.querySelector('button'), 'click');
			assert.strictEqual(1, comp.handleClick.callCount);
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

		it('should render and instantiate nested components inside nested components', function() {
			comp = new NestedLevelsComponent({
				name: 'Foo'
			}).render();

			var nested = comp.components.nested;
			assert.ok(nested instanceof NestedComponent);
			assert.strictEqual(nested.element, comp.element.childNodes[0]);

			var nested2 = nested.components.hello;
			assert.ok(nested2 instanceof HelloWorldComponent);
			assert.strictEqual(nested2.element, nested.element.childNodes[0]);
			assert.strictEqual('Hello Foo!', nested2.element.textContent);
		});
	});
});
