/**
 * Created by deluxe on 5/4/15.
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){

    var TTCharacter = Backbone.Model.extend({
        idAttribute: "characterId"

    });

    return Backbone.Collection.extend({

        model: TTCharacter,
        page: 0,

/*
        url: function() {
            this.page = Math.max(0, this.page);
            var startIndex = this.page * 20;
            return 'https://jaredbrowarnik-thetake-v1.p.mashape.com/characters/listCharacters?limit=20&media=' + this.mediaId + '&start=' + startIndex;
        },
*/

        initialize: function (models, options) {
//            console.log('initialize TTCharacterCollection');
//            this.url = 'https://jaredbrowarnik-thetake-v1.p.mashape.com/characters/listCharacters?limit=20&media=' + options.mediaId;
            this.url = 'js/thetake_f7_characters.json'
        }
    })
});
