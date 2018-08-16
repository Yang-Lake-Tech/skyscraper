/**
 * Created by Diana Fisher on 5/26/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTProductThumbView.html',
    'platform/views/thetake/tt_product_details_view'
], function($, _, Backbone, InteractiveComp, template, TTProductDetailsView){

    return InteractiveComp.View.extend({

        className: 'tt_product_thumb',

        render: function () {

            $(this.el).html(_.template(template, this.model));

            this.initFocusManager();
            return this;
        },

        showProductDetails: function (el) {
//            console.log('tt_product_thumb_view: showProductDetails');

            // Which product was selected?
            var product = $(el).attr("data-role");
//            console.log(product);

            var productDetailsView = new TTProductDetailsView({headers:this.model.headers, productId:product});
            this.app.pushView(productDetailsView);


        }

    })
});
