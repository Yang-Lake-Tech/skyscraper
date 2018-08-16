// models/user.js
define([
	'jquery',
	'underscore',
	'backbone',
	'platform/models/bookmarks'
], function($, _, Backbone, Bookmarks){
	
	var UserModel = Backbone.Model.extend({
		initialize: function() {
			var self = this;

			// TODO: get the titleid in initialize
			this.studioId = 'wb';
			if( localStorage && localStorage['userId'] ) {
				this.attributes.provider_user_id = localStorage['userId'];
			} else {
				localStorage['userId'] = this.attributes.provider_user_id = this.studioId + "_" + _.sample("1234567890qwertyuioplkjhgfdsazxcvbnm".split('') ,5).join('');
			}	


			if(localStorage && localStorage['experience_platform_user_id']) {
				this.set("experience_platform_user_id", localStorage['experience_platform_user_id']);
			}



			var userStatusUpdated = function() {
				if(!this.get("social_platform_user_id")) return;
				self.set('loggedIn', 1);
				bookmarks.userID = self.get('experience_platform_user_id');
				bookmarks.titleID = self.get('title_guid');
			}

			var bookmarks = new Bookmarks();
			this.set('bookmarks', bookmarks );
			this.listenTo(self, 'change:social_platform_user_id', userStatusUpdated);
			this.listenTo(self, 'change:raw_data', this.update);
			this.listenTo(self, 'change:experience_platform_user_id', this.storeExperienceId);

			_.bindAll(this, 'isBookmarked', 'toggleBookmark' );
			
		},
		storeExperienceId: function() {
			if(localStorage) localStorage["experience_platform_user_id"] = this.get("experience_platform_user_id");
		},
		update: function() {
			var raw_data = this.get("raw_data");
			if(!raw_data) return;

			var userData = JSON.parse( raw_data );

			var data = {
			   				first_name: userData.first_name,
			   				last_name: userData.last_name,
			   				social_platform_name: 'facebook',
			   				social_platform_id: '1',
			   				social_platform_user_id: userData.id,
			   				access_token: userData.access_token,
							name: userData.name, 
							first_name: userData.first_name, 
							last_name: userData.last_name,
							gender: userData.gender,
							link: userData.link,
							locale: userData.locale,
							timezone: userData.timezone,
							verified: userData.verified,
							email: userData.email,
							birthday: userData.birthday
			   			}
			this.set(data);
		},
		sync: function(method, model, options) {
			switch(method) {
				case 'create':
					options.url = 'http://api.theplatform.services/user/register';
					break;
				case 'update':
					options.url = 'http://api.theplatform.services/user/update';
					break;
				case 'read':
					options.url = 'http://api.theplatform.services/user/' + this.get('experience_platform_user_id') + '/profile';
					break;
			}
			 return Backbone.sync(method, model, options);
		},
		defaults: {
			loggedIn: false,
			provider_id: 'deluxe',
			provider_user_id: 'deluxe_user01',
			firstName: '',
			id: 0,
			spoilers: 1,
			token: 'dlux', // web-widget token
			notifications: new Backbone.Model({help:1, spoilers:1, optIn:1}) // notifications
		},
		idAttribute: 'experience_platform_user_id',
		url: 'http://localhost:54056/provider/user',
		isBookmarked: function(id) {
			return this.get('bookmarks').filter(function(b) {b.content_guid && id && b.content_guid.toLowerCase() == id.toLowerCase()}).length;
			//where({content_guid: id}).length;
		},
		logOut: function() {
			this.set({'first_name': null,
						'last_name': null,
						'social_platform_name': null,
						'social_platform_id': null,
						'social_platform_user_id': null,
						'loggedIn': null,
						'access_token': null,
						'name': null,
						'first_name': null,
						'last_name': null,
						'gender': null,
						'link': null,
						'locale': null,
						'timezone': null,
						'verified': null,
						'loggedIn': false,
						'raw_data':null,
						'widgetConnected': 0
					});
			this.unset('experience_platform_user_id');
			this.save();
		},
		toggleBookmark: function(id) {
			var bookmarks = this.get('bookmarks');
			var self = this;
			if( bookmarks.where({content_guid: id}).length == 0 ) {
				var newB = bookmarks.add({content_guid: id});
				newB.save(); // add bookmark
			} 
			else {
				bookmarks.remove(bookmarks.where({content_guid: id}).filter(function(b) {
					
					$.ajax({
					    url: 'http://api.theplatform.services/User/' +  self.get('experience_platform_user_id') + '/Title/' + self.get('title_guid') + '/BookmarkContent/',
					    type: 'DELETE',
					    data: b.toJSON()
					});

					b.destroy();

					return true;
				}) );
			}
		}
	});
	
	var model = new UserModel();
	return model;
});