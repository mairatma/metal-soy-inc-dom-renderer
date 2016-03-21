'use strict';

import 'metal-soy-bundle';
import './requireWarning';

import core from 'metal';
import HTML2IncDom from 'html2incdom';
import IncrementalDomRenderer from 'metal-incremental-dom';
import SoyAop from './SoyAop';

// The injected data that will be passed to soy templates.
var ijData = {};

class Soy extends IncrementalDomRenderer {
	/**
	 * Adds the specified attributes to the component, if they don't exist yet.
	 * @param {Array<string>} attrs
	 * @protected
	 */
	addMissingAttrs_(attrs) {
		if (this.addedMissingAttrs_) {
			return;
		}

		this.addedMissingAttrs_ = true;
		var component = this.component_;
		for (var i = 0; i < attrs.length; i++) {
			if (!component.getAttrConfig(attrs[i])) {
				component.addAttr(attrs[i], {}, component.getInitialConfig()[attrs[i]]);
			}
		}
	}

	/**
	 * Copies the component's attributes to an object so it can be passed as it's
	 * template call's data. The copying needs to be done because, if the component
	 * itself is passed directly, some problems occur when soy tries to merge it
	 * with other data, due to property getters and setters. This is safer.
	 * @return {!Object}
	 * @protected
	 */
	buildTemplateData_() {
		var component = this.component_;
		var data = {};
		component.getAttrNames().forEach(name => {
			// Get all attribute values except "element", since it helps performance
			// and this attribute shouldn't be referenced inside a soy template anyway.
			if (name === 'element') {
				return;
			}

			var value = component[name];
			if (component.getAttrConfig(name).isHtml && core.isString(value)) {
				value = HTML2IncDom.buildFn(value);
			}
			data[name] = value;
		});
		return data;
	}

	/**
	 * Handles an intercepted soy template call. If the call is for a component's
	 * main template, then it will be replaced with a call that incremental dom
	 * can use for both handling an instance of that component and rendering it.
	 * @param {!function()} originalFn The original template function that was
	 *     intercepted.
	 * @param {Object} data The data the template was called with.
	 * @protected
	 */
	static handleInterceptedCall_(originalFn, opt_data) {
		var ctor = originalFn.componentCtor;
		var data = opt_data;
		IncrementalDOM.elementVoid('Component', null, [], 'ctor', ctor, 'data', data);
	}

	/**
	 * Overrides the original `IncrementalDomRenderer` method so that only
	 * attributes used by the main template can cause updates.
	 * @param {!Object} changes
	 * @return {boolean}
	 */
	shouldUpdate(changes) {
		var fn = this.component_.constructor.TEMPLATE;
		var params = fn ? SoyAop.getOriginalFn(fn).params : [];
		for (var i = 0; i < params.length; i++) {
			if (changes[params[i]]) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Registers the given templates to be used by `Soy` for the specified
	 * component constructor.
	 * @param {!Function} componentCtor The constructor of the component that
	 *     should use the given templates.
	 * @param {!Object} templates Object containing soy template functions.
	 * @param {string=} mainTemplate The name of the main template that should be
	 *     used to render the component. Defaults to "render".
	 */
	static register(componentCtor, templates, mainTemplate = 'render') {
		componentCtor.RENDERER = Soy;
		componentCtor.TEMPLATE = templates[mainTemplate];
		templates[mainTemplate].componentCtor = componentCtor;
		SoyAop.registerForInterception(templates, mainTemplate);
	}

	/**
	 * Overrides the default method from `IncrementalDomRenderer` so the component's
	 * soy template can be used for rendering.
	 * @override
	 */
	renderIncDom() {
		var elementTemplate = this.component_.constructor.TEMPLATE;
		if (core.isFunction(elementTemplate)) {
			elementTemplate = SoyAop.getOriginalFn(elementTemplate);
			this.addMissingAttrs_(elementTemplate.params);

			SoyAop.startInterception(Soy.handleInterceptedCall_);
			elementTemplate(this.buildTemplateData_(), null, ijData);
			SoyAop.stopInterception();
		} else {
			super.renderIncDom();
		}
	}

	/**
	 * Sets the injected data object that should be passed to templates.
	 * @param {Object} data
	 */
	static setInjectedData(data) {
		ijData = data || {};
	}
}

export default Soy;
