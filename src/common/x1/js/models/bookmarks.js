define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone){
	var Bookmark = Backbone.Model.extend({
		//idAttribute: 'content_guid'
		initialize: function() {
			//if(this.attributes.content_guid ) this.attributes.content_guid = this.attributes.content_guid.toUpperCase();
		},

	});
	
	var Bookmarks = Backbone.Collection.extend({
		initialize: function() {
			var self = this;
		},
		url: function() {
			return 'http://api.theplatform.services/User/' +  this.userID + '/Title/' + this.titleID + '/BookmarkContent';
		},
		model: Bookmark,
		defaults: {
		}
	});
	
	var bookmarks = new Bookmarks(); 
	
	return Bookmarks
});