/**
 * Created by Diana Fisher on 5/25/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTProductSmallView.html'
], function($, _, Backbone, InteractiveComp, template){

    return InteractiveComp.View.extend({

        className: 'tt_product_small',

        render: function () {

            $(this.el).html(_.template(template, this.model));
            $(this.el).css('left', this.model.left);

//            console.log(this.model);
            this.initFocusManager();
            return this;
        },

        onProductSelected: function (el) {
            var product = $(el).attr("data-role");
//            console.log(product);

            // Trigger an event
            this.trigger('productSelected', product);
        }

    })
});