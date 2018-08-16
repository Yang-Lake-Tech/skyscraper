/**
 * Created by Diana Fisher on 5/26/15.
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){

    var TTProduct = Backbone.Model.extend({
        idAttribute: "productId"

    });

    return Backbone.Collection.extend({

        model: TTProduct,
        page: 0,
        limit: 51,

        url: function() {
            this.page = Math.max(0, this.page);
            var startIndex = this.page * this.limit;
            return 'https://jaredbrowarnik-thetake-v1.p.mashape.com/products/listProducts?actor=0&category=0&limit=' + this.limit + '&media=' + this.mediaId + '&start=' + startIndex;
        },

        initialize: function(models, options) {
//            console.log('initialize TTProductCollection');
            this.mediaId = options.mediaId;

        }


    });
});
