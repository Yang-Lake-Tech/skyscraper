/**
 * Created by deluxe on 2/17/15.
 */
define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone) {
    var SearchModel = Backbone.Model.extend({

        initialize: function (options) {
            this.contents = options.contents;
            this.tags = options.search_tags;
            this.set('tags', this.tags);
            //console.log(this.tags);
        },

        searchFor: function(searchTerm) {
            var self = this;
            var ids = this.get('tags')[searchTerm];
            var results = ids.map(function(id) {
                return _.findWhere(self.contents, {id: id});
            });

            var sections = {};
            sections["Timeline"] = [];

            //console.log("Search term " + searchTerm + " has result count = " + results.length);

            for (var index = 0; index < results.length; index++) {
                var item = results[index];
                var section = item.content_type;
                if (!sections[section]) {
                    sections[section] = [];
                }
                sections[section] = sections[section].concat(item);

                if (item.timeCode) {
                    sections["Timeline"] = sections["Timeline"].concat(item);
                }
            }

            return sections;
        }
    });

    return SearchModel;
});


