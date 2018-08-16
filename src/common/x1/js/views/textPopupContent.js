// views/textPopupContent.js
define([
	'jquery',
	'underscore',
	'backbone',
	'platform/views/interactiveComp',
	'text!platformTemplate/templates/textPopupContent.html',
], function($, _, Backbone, InteractiveComp, tmp){
	
	var TextPopupContent = InteractiveComp.View.extend({
		className: "textPopupContent",
		initialize: function() {
			var self = this;
			InteractiveComp.View.prototype.initialize.call(this);
			this.fm.scrollPageSize = 55*5;
		},
		render: function() {
			var self = this;
			$(this.el).append(_.template( tmp)(this.model.toJSON()));
			self.initFocusManager();
			return this;
		}
	});
	return TextPopupContent;
});