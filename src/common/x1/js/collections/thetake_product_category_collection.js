/**
 * Created by deluxe on 5/5/15.
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){

    var TTProductCategory = Backbone.Model.extend({
        idAttribute: "categoryId"

    });

    var TTProductCategories = Backbone.Collection.extend({

        model: TTProductCategory,

        initialize: function(models, options) {
            this.url = 'https://jaredbrowarnik-thetake-v1.p.mashape.com/categories/listProductCategories?media=' + options.mediaId;
        }
    });

    return TTProductCategories
});
