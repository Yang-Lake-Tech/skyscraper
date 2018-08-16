define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone){
	var Content = Backbone.Model.extend({
	});
	
	var Galleries = Backbone.Collection.extend({
		initialize: function() {
		},
		defaults: {
		}
	});
	
	var galleries = new Galleries();
	
	return galleries
});