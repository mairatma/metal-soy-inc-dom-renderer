'use strict';

import core from 'metal';
import IncrementalDomRenderer from 'metal-incremental-dom';
import { SoyAop, SoyTemplates } from 'metal-soy';

class SoyIncDomRenderer extends IncrementalDomRenderer {
	/**
	 * Adds the specified attributes to the component, if they don't exist yet.
	 * @param {Array<string>} attrs
	 * @protected
	 */
	addMissingAttrs_(attrs = []) {
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
	 * Overrides the default method from `IncrementalDomRenderer` so the component's
	 * soy template can be used for rendering.
	 * @override
	 */
	renderIncDom() {
		var elementTemplate = this.getTemplateFn_();
		if (core.isFunction(elementTemplate)) {
			this.addMissingAttrs_(SoyAop.getOriginalFn(elementTemplate).params);
			elementTemplate(this.buildTemplateData_());
		}
	}
}

export default SoyIncDomRenderer;
