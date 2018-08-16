define([
    'backbone'
], function (Backbone) {
    return Backbone.Model.extend({
        initialize: function() {
            this.url = 'title_metadata.json';
        }
    });
});