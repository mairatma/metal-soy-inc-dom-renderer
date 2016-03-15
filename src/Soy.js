'use strict';

import { core, object } from 'metal';
import IncrementalDomRenderer from 'metal-incremental-dom';
import { SoyAop, SoyTemplates } from 'metal-soy';

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
			if (name !== 'element') {
				data[name] = component[name];
			}
		});
		return data;
	}

	/**
	 * Gets the soy template function for this component.
	 * @return {function()}
	 * @protected
	 */
	getTemplateFn_() {
		return SoyTemplates.get(this.component_.getName(), 'render');
	}

	/**
	 * Handles an intercepted soy template call. If the call is for a component's
	 * main template, then it will be replaced to a call that incremental dom
	 * will use for both handling an instance of that component and rendering it.
	 * @param {string} componentName The name of the component that this template
	 *     belongs to.
	 * @param {string} templateName The name of this template.
	 * @param {!function()} originalFn The original template function that was
	 *     intercepted.
	 * @param {Object} data The data the template was called with.
	 * @param {*} opt_ignored
	 * @param {Object} opt_ijData Template injected data object.
	 * @protected
	 */
	handleInterceptedCall_(componentName, templateName, originalFn, opt_data, opt_ignored, opt_ijData) {
		if (templateName === 'render') {
			var args = [componentName, null, []];
			var data = opt_data || {};
			object.map(data, key => {
				args.push(key, data[key]);
			});
			IncrementalDOM.elementVoid.apply(null, args);
		} else {
			originalFn(opt_data, opt_ignored, opt_ijData);
		}
	}

	/**
	 * Overrides the default method from `IncrementalDomRenderer` so the component's
	 * soy template can be used for rendering.
	 * @override
	 */
	renderIncDom() {
		var elementTemplate = this.getTemplateFn_();
		if (core.isFunction(elementTemplate)) {
			elementTemplate = SoyAop.getOriginalFn(elementTemplate);
			this.addMissingAttrs_(elementTemplate.params);

			SoyAop.startInterception(this.handleInterceptedCall_.bind(this));
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
