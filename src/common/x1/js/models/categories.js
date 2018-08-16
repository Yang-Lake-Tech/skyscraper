define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone){
	
	var Category = Backbone.Model.extend({
		initialize: function() {

		},
		idAttribute: "guid"

	});

	var Categories = Backbone.Collection.extend({
		initialize: function() {
			
		},
		model: Category
	});

	return Categories
});