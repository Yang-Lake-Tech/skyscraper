/**
 * Created by Diana Fisher on 5/5/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTProductByCharacterView.html'
], function($, _, Backbone, InteractiveComp, template){

    var TTProductByCharacterView = InteractiveComp.View.extend({

        render: function() {

            $(this.el).html(_.template( template, this.model ));
            this.initFocusManager();
            return this;
        },

        showProductDetails: function(el) {
//            console.log('showProductDetails');
            // Which product was selected?
            var product = $(el).attr("data-role");
//            console.log(product);

            // Trigger an event
            this.trigger('productSelected', product);
        }

    });

    return TTProductByCharacterView
});
