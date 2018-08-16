define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'platform/views/contentList',
    'platform/views/contentListNoScroll',
    'text!templates/featurettes/FeaturettesView.html',
    'text!experience/featurettes.json',
    'text!experience/the_final_climax.json',
    'text!experience/games.json',
    'text!experience/panoramaVideos.json',
    'text!experience/jurassicjournal.json',
    'text!templates/360/FloorNavigation.html',
    'text!experience/floorNavigation.json',
], function($
        , _
        , Backbone
        , Hammer
        , InteractiveComp
        , ContentList
        , ContentListNoScroll
        , template
        , featurettesData
        , deletedScenesData
        , gamesData
        , panoramaVideosData
        , jurassicJournalData
        , floorNavigationTemplate
        , floorNavigationData) {
    return InteractiveComp.View.extend({
        className: 'featurettes-view popup-component',

        events: {
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.superView = options.superView;
            this.experienceType = options.experienceType;
            this.experienceName = options.experienceName;
            this.assetType = options.assetType
            this.mainContentItem = options.contentItem
            this.hasAudio = false;
            this.app = options.app;

            var elementHeight = 124;
            var elementsLength = 5;

            switch (this.assetType.toLowerCase()) {
                case "featurettes":
                    this.contentItems =  JSON.parse(featurettesData)
                    break;
                case "jurassicjournal":
                    this.contentItems =  JSON.parse(jurassicJournalData)
                    break;
                case "the_final_climax":
                    this.contentItems =  JSON.parse(deletedScenesData)
                    break;
                case "third_party":
                    this.contentItems =  JSON.parse(gamesData)
                    break;
                case "panorama_video_list":
                    this.contentItems =  JSON.parse(panoramaVideosData)
                    break;
                case "floor_navigation":
                    this.contentItems =  JSON.parse(floorNavigationData)
                    elementHeight = 110;
                    elementsLength = 4;
                    break;
            }

            this.baseUrl = "./";//options.app.titleMetaData.title.base_url;

            /*if (this.contentItems.length <= 4) {
                this.featurettesClips = new ContentListNoScroll({
                    contentList: this.contentItems,
                    displayCount: this.contentItems.length,
                    elementHeight: 118,
                    parent: this
                });
            } else */{
                this.featurettesClips = new ContentList({
                    contentList: this.contentItems,
                    displayCount: (this.contentItems.length <= elementHeight) ? this.contentItems.length : elementHeight,
                    elementHeight: elementHeight,
                    parent: this
                });
            }

            this.listenTo(this.featurettesClips, "CONTENT_HIGHLIGHTED", this.onClipHighlight);
            this.listenTo(this.featurettesClips, "CONTENT_SELECTED", this.onClipSelect);

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);

            switch (this.assetType.toLowerCase()) {
                case "featurettes":
                    var assetsToPreload = _.findWhere(options.app.movieModel.get("contents"), { type: "preload" }).metadata.featurettes;
                    this.preloadAssets(assetsToPreload);
                    this.preloadImages = this.preloadImageAssets();
                    break;
                case "jurassicjournal":
                    var assetsToPreload = _.findWhere(options.app.movieModel.get("contents"), { type: "preload" }).metadata.jurassicjournal;
                    this.preloadAssets(assetsToPreload);
                    this.preloadImages = this.preloadImageAssets();
                    break;
            }

            this.audio = $('#audio-content-2');
            this.audioSrc = "Assets/Audio/JWFK_HUB_loop_02_v2.mp3?NO_MTHEORY_DECODER";
            this.audio[0].src = this.audioSrc;
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.startSessionOnPage(this.experienceName);
        },

        render: function() {
            var self = this

            switch (this.assetType.toLowerCase()) {
                case "floor_navigation":
                    $(this.el).html(_.template(floorNavigationTemplate, {}));
                    break;
                default:
                    $(this.el).html(_.template(template, {}));
                    break;
            }

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.featurettesPanel = $('.featurettes-panel', this.el);
            this.subtitle = $('#featurettes-subtitle', this.el);

            this.contentItemsElement = $('#content-items', this.el);
            this.contentContainer = $('#content-container-area',this.el);

            this.fm.firstElementIndex = "1,0";
            this.initFocusManager();

            var clips = this.featurettesClips.render();
            this.$("#content-items").html(clips.el);
            this.fm.addView(this.featurettesClips);

            _.each(this.featurettesPanel, function (element) {
                Hammer(element).on('tap', function () {
                    this.onClipSelect(clips.getCurrentContent());
                }.bind(this));
            }.bind(this));

            this.onClipHighlight(this.featurettesClips.getCurrentContent());


            $('#start-experience').hide();

            _.delay(function(){

                $('#featurettes-subtitle').addClass(self.assetType)
                $('#featurettes-title').addClass(self.assetType)
                $('#focusedContentPlayIcon').addClass(self.assetType)
                $('#featurettes-panel-2-icon').addClass(self.assetType)
                if (self.mainContentItem.background) {
                    $('#featurettes-background').css({
                        backgroundImage: 'url(' + self.baseUrl + self.mainContentItem.background + ')'
                    })
                }
            })

            this.audio = $('#audio-content-2');
            this.audio[0].currentTime = this.app.current360AudioTime;
            this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audioSrc, 2000);

            return this;
        },

        resume: function() {
            this.audio = $('#audio-content-2');
            //this.audioSrc = "Assets/Audio/JWFK_HUB_loop_02_v2.mp3?NO_MTHEORY_DECODER";
            this.audio[0].currentTime = this.app.current360AudioTime;
            //this.audio[0].src = this.audioSrc;
            this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audioSrc, 2000);

            //this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Featurettes Experience ", true);
        },

        onClipHighlight: function(contentItem) {
            var self = this;

            var currentSelectIndex = this.contentItems.indexOf(contentItem);

            this.subtitle.fadeOut(200, function () {
                this.subtitle.css('background-image', 'url("' + this.baseUrl + contentItem.header_image + '")');
                this.subtitle.fadeIn(200);
            }.bind(this));

            if (!$(this.featurettesPanel[1]).is(':visible')) {
                $(self.featurettesPanel[1]).css('background-image', 'url("' + self.preloadImages[currentSelectIndex].src + '")');
                $(self.featurettesPanel[1]).fadeIn();
                $(self.featurettesPanel[0]).fadeOut();
            } else {
                $(self.featurettesPanel[0]).css('background-image', 'url("' + self.preloadImages[currentSelectIndex].src + '")');
                $(self.featurettesPanel[0]).fadeIn();
                $(self.featurettesPanel[1]).fadeOut();
            }

            if (this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setAction(contentItem.name + " is Highlighted", true);
            }
        },

        preloadImageAssets: function () {
            var images = [];
            for (var i = 0; i < this.contentItems.length; i++) {
                images[i] = new Image();
                images[i].src = this.baseUrl + this.contentItems[i].content_image;
            }
            if (this.mainContentItem.background) {
                i++;
                images[i] = new Image();
                images[i].src = this.baseUrl + this.mainContentItem.background;
            }
            return images;
        },

        onClipSelect: function(contentItem) {
            if (this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setAction(contentItem.name + " is Selected", true);
            }
            this.audio = $('#audio-content-2');
            this.app.current360AudioTime = this.audio[0].currentTime;
            this.OmnitureAnalyticsHelper.stopSession();
            this.app.playContent(contentItem.video);
            this.audio.animate({volume: 0}
                , this.app.getHalfDurationForTransition({ type: 'fade' })
                , 'linear'
                , function(){
                    this.audio[0].pause();
                    /*
                    if (this.app.viewStack[this.app.viewStack.length - 1].hasAudio) {
                        this.fadeInAudioElementWithSrcAndDuration(
                            $('#audio-content')[0]
                            , this.app.viewStack[this.app.viewStack.length - 1].getAudioSource()
                            , 0
                            , true
                        );
                    }*/
            }.bind(this));
        },

        onBackButtonPressed: function() {
            if (!this.fm.blockKeyDown) {
                this.OmnitureAnalyticsHelper.setAction("Exit Featurettes Experience", true);

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);

                this.audio = $('#audio-content-2');
                this.audio[0].pause();
            }
        }
    });
});
