/**
 * Created by Diana Fisher on 5/31/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTCharacterThumbView.html',
    'platform/views/thetake/tt_character_products_view'
], function($, _, Backbone, InteractiveComp, template, TTCharacterProductsView){

    return InteractiveComp.View.extend({

        className: 'tt_character_thumb',

        render: function () {

            $(this.el).html(_.template(template, this.model));
            this.initFocusManager();
            return this;
        },

        showCharacterProducts: function (el) {
//            console.log('showCharacterProducts');

            // Which character was selected?
            var character = $(el).attr("data-role");
            var characterProductsView = new TTCharacterProductsView(this.model);
            this.app.pushView(characterProductsView);

        }

    })
});
