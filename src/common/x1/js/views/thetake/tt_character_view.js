/**
 * Created by Diana Fisher on 5/4/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTCharacterView.html'
], function($, _, Backbone, InteractiveComp, template){

    var TTCharacterView = InteractiveComp.View.extend({

        render: function() {

            $(this.el).html(_.template( template, this.model ));
            this.initFocusManager();
            return this;
        },

        showCharacterProducts: function(el) {
//            console.log('showCharacterProducts');
            // Which character was selected?
            var character = $(el).attr("data-role");
//            console.log(character);

            // Trigger an event
            this.trigger('characterSelected', character);

        }

    });

    return TTCharacterView
});

