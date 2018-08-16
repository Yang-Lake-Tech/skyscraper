/**
 * Created by Diana Fisher on 5/31/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'platform/collections/thetake_character_collection',
    'platform/views/thetake/tt_character_thumb_view',
    'text!platformTemplate/templates/thetake/TTCharactersView.html'
], function($, _, Backbone, InteractiveComp, TTCharacterCollection, TTCharacterThumbView, template){

    return InteractiveComp.View.extend({

        initialize: function (options) {
            this.mediaId = options.mediaId;
            this.headers = options.headers;
            this.childViews = [];

            this.loadCharacters();
            InteractiveComp.View.prototype.initialize.call(this);
        },

        delegateEvents: function() {
            InteractiveComp.View.prototype.delegateEvents.call(this);
            // make sure delegate events is called on all child views
            _.each(this.childViews, function(child) {
                if(child.delegateEvents) child.delegateEvents.apply(child);
            });
        },

        render: function () {

            $(this.el).html(_.template(template, this.model));

            var self = this;

            // remove any existing views
            _.each(this.childViews, function(child) {
                child.remove();
            });
            this.childViews = [];

            _.each(this.characters.models, function (model, index) {
//                console.log(model);
                // Calculate row and column.
                var row = Math.floor(index / 2);
                var col = index % 2;

                // Create position value from row and col.
                // Add position to model attributes.
                model.attributes.position = row + ',' + col;

                // Get the element we plan on appending the character view to.
                var element = $('#tt_characters', self.el);

                var characterData = {
                    'mediaId' : self.mediaId,
                    'headers' : self.headers,
                    'position' : row + ',' + col,
                    'characterId' : model.attributes.characterId,
                    'characterName' : model.attributes.characterName,
                    'characterImage' : model.attributes.keyFrameImage['1000pxFrameLink']
                };

                // Create a new character thumb view.
                var characterThumbView = new TTCharacterThumbView({model: characterData});
                self.childViews.push(characterThumbView);

                // Append character view to the DOM.
                element.append(characterThumbView.render().el);
            });
            self.initFocusManager();

            return this;
        },

        loadCharacters: function () {
            var options = {mediaId: this.mediaId};
            this.characters = new TTCharacterCollection([], options);

            var self = this;

            this.characters.fetch({
                headers: self.headers,
                success: function (data) {
//                    console.log('characters collection fetch success.');
//                    console.log(data);
                    self.render();
                },
                error: function () {
                    console.error('error fetching tt_characters.');
                }
            });

        }
    })
});
