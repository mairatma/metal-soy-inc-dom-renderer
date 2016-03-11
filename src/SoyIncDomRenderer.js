'use strict';

import core from 'metal';
import IncrementalDomRenderer from 'metal-incremental-dom';
import { SoyTemplates } from 'metal-soy';

class SoyIncDomRenderer extends IncrementalDomRenderer {
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
	 * Overrides the default method from `IncrementalDomRenderer` so the component's
	 * soy template can be used for rendering.
	 * @override
	 */
	renderIncDom() {
		var elementTemplate = SoyTemplates.get(this.component_.getName()).render;
		if (core.isFunction(elementTemplate)) {
			elementTemplate(this.buildTemplateData_());
		}
	}
}

export default SoyIncDomRenderer;
