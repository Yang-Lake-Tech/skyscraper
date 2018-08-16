define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!templates/dossiers/DossiersView.html',
    'text!experience/dossiers.json'
], function($, _, Backbone, Hammer, InteractiveComp, template, data) {
    return InteractiveComp.View.extend({
        className: 'dossiers-view popup-component',

        events: {
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.experienceName = options.experienceName;

            this.hasAudio = true;

            this.contentItems = JSON.parse(data);
            this.currentSelection = 0;

            this.baseUrl = options.app.titleMetaData.title.base_url;

            this.listenTo(this.fm, 'activeElementChanged', this.onTabChange);

            var assetsToPreload = _.findWhere(options.app.movieModel.get("contents"), { type: "preload" }).metadata.dossiers;
            this.preloadAssets(assetsToPreload);
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Dossiers Experience - Main Page");
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        getAudioSource: function () {
            return "Assets/Audio/AB_Dossier_menu_audio.mp3?NO_MTHEORY_DECODER";
        },

        render: function() {
            $(this.el).html(_.template(template, { characters: this.contentItems }));

            this.audio = $('#audio-content');

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.background = $('#dossier-background', this.el);

            this.characters = $('.character', this.el);

            $.each(this.characters, function (index, character) {
                $(character).css('left', this.contentItems[index].coords[0]);
                $(character).css('background-image', 'url("' + this.contentItems[index].nor + '")');
            }.bind(this));

            this.fm.firstElementIndex = "1,0";
            this.initFocusManager();

            this.onTabChange(true, this.characters[0]);

            $('#start-experience').hide();

            Hammer($('#character-image-hitbox', this.el)[0]).on('tap', function (event) {
                this.skipEnterFile = false;
                this.onEnterCharacterFile(this.lastActive[0]);
            }.bind(this));

            return this;
        },

        onEnterCharacterFile: function (element) {
            if (!this.skipEnterFile) {
                var characterFileViewMetadata = _.findWhere(this.app.movieModel.get('contents'), { viewName: "dossiers-character-files-view" });
                var characterMetadata = this.contentItems[element.attributes['data-position'].nodeValue.split(',')[1]];
                this.app.playContent(characterFileViewMetadata.id, null, characterMetadata);
            }
        },

        onTabChange: function (trigger, active, hitEnter, previousActive) {
            var $active = $(active);
            var $previousActive = $(previousActive);
            var skipActive;

            // Handle hitting enter on the close buttons
            if (hitEnter === true || hitEnter === false) { // hitEnter has 3 states: true, false and undefined,
                                                           // all of which are useful
                if (!$active.hasClass('character')) {
                    return;
                }
            }

            if (hitEnter === false) {
                this.skipEnterFile = true;
            } else {
                this.skipEnterFile = false;
            }

            if ($previousActive.hasClass('character')) {
                $previousActive.css('background-image', 'url("' + this.contentItems[previousActive.attributes['data-position'].nodeValue.split(',')[1]].nor + '")');
            } else {
                if (this.lastActive) {
                    skipActive = true;

                    var $currentFocused = $('.focused', this.el);
                    $currentFocused.css('background-image', 'url("' + this.contentItems[$currentFocused.attr('data-position').split(',')[1]].nor + '")');
                    this.fm.initFocus(this.lastActive.attr('data-position'), true, true, true, true);
                }
            }

            if (!skipActive && $active.hasClass('character')) {
                var newContentItem = this.contentItems[active.attributes['data-position'].nodeValue.split(',')[1]];
                $active.css('background-image', 'url("' + newContentItem.sel + '")');
                this.background[0].src = newContentItem.background;
                this.lastActive = $active;
            } else {
                this.lastActive = $previousActive;
            }
        },

        resume: function() {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Dossiers Experience", true);
        },

        onBackButtonPressed: function() {
            if (!this.fm.blockKeyDown) {
                this.OmnitureAnalyticsHelper.setAction("Exit Pitch Perfect 3 Dossiers Experience", true);

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);

                this.audio.animate({volume: 0}, this.app.getHalfDurationForTransition({ type: 'fade' }), 'linear');
            }
        }
    });
});