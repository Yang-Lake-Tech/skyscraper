define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!templates/dossiers/DossiersCharacterFilesView.html'
], function($, _, Backbone, Hammer, InteractiveComp, template) {
    return InteractiveComp.View.extend({
        className: 'dossiers-character-files-view popup-component',

        events: {
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.experienceName = options.experienceName;

            this.contentItem = options.contentItem;

            this.audioSrc = "Assets/Audio/AB_Dossier_menu_audio.mp3?NO_MTHEORY_DECODER";

            this.baseUrl = options.app.titleMetaData.title.base_url;

            this.listenTo(this.fm, 'activeElementChanged', this.onActiveElementChanged);
        },

        onAppAssociation: function () {
            this.enableMobileModeIfNecessary();

            InteractiveComp.View.prototype.onAppAssociation.apply(this, Array.prototype.slice.call(arguments));
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Dossiers Experience - Character Files Page");
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        enableMobileModeIfNecessary: function () {
            if (!this.browserPlatformHelper.isExperienceOnEmulator() && !(this.app && this.app.debug)) {
                $('.focusable', this.el).addClass('focused');
            }
        },

        render: function() {
            $(this.el).html(_.template(template));

            this.audio = $('#audio-content');

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.background = $('#dossier-character-file-background', this.el);

            this.bioBackground = $('#dossier-character-bio-background', this.el);

            this.fm.firstElementIndex = "1,1";
            this.initFocusManager();

            this.background[0].src = this.contentItem.fileBackground;

            $('#start-experience').hide();

            return this;
        },

        onActiveElementChanged: function (trigger, active, hitEnter, previousActive) {
            if (hitEnter !== true && hitEnter !== false) {
                if (previousActive.attributes['data-position'].nodeValue.split(',')[1] === "1" &&
                    Number(previousActive.attributes['data-position'].nodeValue.split(',')[0]) > 0 &&
                    active.attributes['data-position'].nodeValue === "2,0") {

                    this.lastActiveElementPosition = previousActive.attributes['data-position'].nodeValue;

                } else if (previousActive.attributes['data-position'].nodeValue === "2,0" &&
                           active.attributes['data-position'].nodeValue.split(',')[1] === "1" &&
                           Number(active.attributes['data-position'].nodeValue.split(',')[0]) > 0) {

                    this.fm.initFocus(this.lastActiveElementPosition, true, true, true, true);
                }
            }
        },

        resume: function() {
            if (this.audio[0].paused) {
                this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audioSrc, 2000);
            }
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Dossiers Experience - Character Files Page", true);

            this.enableMobileModeIfNecessary();
        },

        onBackButtonPressed: function() {
            if (this.bioVisible) {
                this.enableMobileModeIfNecessary();
                this.bioBackground.fadeOut(function(){
                    this.bioBackground[0].src = "";
                    this.bioVisible = false;
                }.bind(this));
            } else {
                if (!this.fm.blockKeyDown) {
                    this.OmnitureAnalyticsHelper.setAction("Exit Pitch Perfect 3 Dossiers Character Files Page", true);

                    InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                    this.app.toggleKeyPress(true);
                }
            }
        },

        onSelect: function (content, data, noAudio) {
            this.enableMobileModeIfNecessary();

            if (content) {
                this.app.toggleKeyPress(true);

                this.app.playContent(content, null, data);

                if (noAudio) {
                    this.audio.animate({volume: 0}, this.app.getHalfDurationForTransition({ type: 'fade' }), 'linear', function(){
                        this.audio[0].pause();
                    }.bind(this));
                }
            }
        },

        onCharacterVideo: function () {
            this.onSelect(this.contentItem.video, null, true);
        },

        onCharacterGallery: function () {
            this.onSelect(this.contentItem.gallery, null, true);
        },

        onCharacterBio: function () {
            this.onSelect();

            this.app.toggleKeyPress(true);

            this.bioVisible = true;

            this.bioBackground[0].src = this.contentItem.bio;
            this.bioBackground.fadeIn(function(){
                this.app.toggleKeyPress(false);
            }.bind(this));
        },

        onCharacterLocations: function () {
            var dossiersPlacesViewMetadata = _.findWhere(this.app.movieModel.get('contents'), { viewName: "dossiers-character-places-view" });
            var characterLocations = this.contentItem.places;

            this.onSelect(dossiersPlacesViewMetadata.id, { characterName: this.contentItem.name, locations: characterLocations });
        }
    });
});