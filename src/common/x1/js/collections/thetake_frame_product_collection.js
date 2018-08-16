/**
 * Created by Diana Fisher on 5/7/15.
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){

    var TTFrameProduct = Backbone.Model.extend({
        idAttribute: "productId"

    });

    var TTFrameProducts = Backbone.Collection.extend({

        model: TTFrameProduct,
        comparator: 'productX',
        mediaTime: 0,

        url: function() {
            return 'https://jaredbrowarnik-thetake-v1.p.mashape.com/frameProducts/listFrameProducts?media=' + this.mediaId + '&time=' + this.mediaTime;
        },

        initialize: function(models, options) {
//            console.log('initialize TTFrameProducts');
            this.mediaId = options.mediaId;
        }
    });

    return TTFrameProducts
});