/**
 * Created by Diana Fisher on 6/1/15.
 */


define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){

    var TTCategoryProduct= Backbone.Model.extend({
        idAttribute: "productId"

    });

    return Backbone.Collection.extend({

        model: TTCategoryProduct,
        page: 0,
        limit: 51,

        url: function () {
            this.page = Math.max(0, this.page);
            var startIndex = this.page * this.limit;
            return 'https://jaredbrowarnik-thetake-v1.p.mashape.com/products/listProducts?actor=0&category=' + this.categoryId +'&limit=' + this.limit + '&media=' + this.mediaId + '&start=' + startIndex;
        },

        initialize: function (models, options) {
//            console.log('initialize TTCategoryProductsCollection');
            this.mediaId = options.mediaId;
            this.categoryId = options.categoryId;
        }

    })
});
