/**
 * Created by Diana Fisher on 5/6/15.
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){

    var TTProductDetail = Backbone.Model.extend({
        idAttribute: "productId"

    });

    var TTProductDetails = Backbone.Collection.extend({

        model: TTProductDetail,

        initialize: function(models, options) {
//            console.log('initialize TTProductsByCharacter');
            this.url = 'https://jaredbrowarnik-thetake-v1.p.mashape.com/products/productDetails?product='
                + options.productId;
        }
    });

    return TTProductDetails
});


//curl --get --include 'https://jaredbrowarnik-thetake-v1.p.mashape.com/products/productDetails?product=63931' \
//-H 'X-Mashape-Key: zxuiCsa0SemshSHgCQUEbm709nd2p1976vkjsnIrqB4WOE2Pne' \
//-H 'Accept: application/json'