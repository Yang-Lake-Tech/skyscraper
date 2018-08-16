/**
 * Created by deluxe on 5/5/15.
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

        url: function () {
            this.page = Math.max(0, this.page);
            var startIndex = this.page * this.limit;

            return 'https://jaredbrowarnik-thetake-v1.p.mashape.com/products/listProducts?actor=0&category=0&character=' + this.characterId + '&limit=' + this.limit + '&media=' + this.mediaId + '&start=' + startIndex;
        },

        initialize: function (models, options) {
//            console.log('initialize TTProductsByCharacter');
            console.log(options);
            this.characterId = options.characterId;
            this.mediaId = options.mediaId;

//            this.url = 'https://jaredbrowarnik-thetake-v1.p.mashape.com/products/listProducts?actor=0&category=0&character='
//                + options.characterId +'&limit=10&media='
//                + options.mediaId + '&start=0';
        }
    })
});
