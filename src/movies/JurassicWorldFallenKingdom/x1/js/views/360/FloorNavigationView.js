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
            console.log(options)
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.superView = options.superView;
            this.experienceType = options.experienceType;
            this.experienceName = options.experienceName;
            this.assetType = options.assetType
            this.mainContentItem = options.contentItem
            this.hasAudio = true;
            this.contentItems =  JSON.parse(floorNavigationData)
            this.baseUrl = "./";
            this.preloadImages = this.preloadImageAssets();
            this.currentFloorSelection = 0;
            this.currentGUID = options.currentGUID;
            this.firstLoad = true;
            this.app = options.app;

            this.featurettesClips = new ContentListNoScroll({
                contentList: this.contentItems,
                displayCount: 5,
                elementHeight: 73,
                parent: this
            });

            this.listenTo(this.featurettesClips, "CONTENT_HIGHLIGHTED", this.onClipHighlight);
            this.listenTo(this.featurettesClips, "CONTENT_SELECTED", this.onClipSelect);

            //this.listenTo(this.fm, 'keyDown', this.onKeyDown);
            this.initFocusManager();
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.startSessionOnPage(this.experienceName);
        },

        render: function() {
            var self = this

            $(this.el).html(_.template(floorNavigationTemplate, {}));

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);
            this.initFocusManager();

            $('#start-experience').hide();

            var clips = this.featurettesClips.render();
            this.$("#content-items").html(clips.el);
            this.fm.addView(this.featurettesClips);

            _.delay(function(){
                $('.content-list')
                    .addClass("content-list-floor-navigation")
                    .removeClass("content-list");
            })

            this.app.floorNavigationIsShowing = false;

            if (this.currentGUID == "JWFK_360_Rooms_LibraryCenter_bg") {
                clips.handleNavigation(-1, 1);
            } else if (this.currentGUID == "JWFK_360_Rooms_LibraryToGangway_bg") {
                clips.handleNavigation(-1, 2);
            } else if (this.currentGUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg") {
                clips.handleNavigation(1, 1);
            }

            return this;
        },

        getAudioSource: function () {
            return null;
        },

        resume: function() {
            //this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Featurettes Experience ", true);
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

        onClipHighlight: function(contentItem) {
            this.currentFloorSelection = this.contentItems.indexOf(contentItem);

            if (this.firstLoad == true) {
                this.firstLoad = false;

                clearTimeout(this.mapFadeTimout)

                if (this.currentGUID == "JWFK_360_Rooms_LibraryCenter_bg") {
                    this.mapFadeTimout = setTimeout(() => {
                        this.fadeElement($('#JWFK_360_floorPlan_map_library'));
                    }, 100);
                } else if (this.currentGUID == "JWFK_360_Rooms_LibraryToGangway_bg") {
                    this.mapFadeTimout = setTimeout(() => {
                        this.fadeElement($('#JWFK_360_floorPlan_map_subLab'));
                    }, 100);
                } else if (this.currentGUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg") {
                    this.mapFadeTimout = setTimeout(() => {
                        this.fadeElement($('#JWFK_360_floorPlan_map_containment'));
                    }, 100);
                }  else if (this.currentGUID == "JWFK_360_Rooms_LibraryToGangway_bg") {
                    this.mapFadeTimout = setTimeout(() => {
                        this.fadeElement($('#JWFK_360_floorPlan_map_gangway'));
                    }, 100);
                } else {
                    this.mapFadeTimout = setTimeout(() => {
                        this.fadeElement($('#JWFK_360_floorPlan_map_reception'));
                    }, 100);
                }
            } else {
                this.removeSelectedStates();

                if (this.currentFloorSelection == 0) {
                    this.fadeElement($('#JWFK_360_floorPlan_map_reception'));
                } else if (this.currentFloorSelection == 1) {
                    this.fadeElement($('#JWFK_360_floorPlan_map_library'));
                } else if (this.currentFloorSelection == 2) {
                    this.fadeElement($('#JWFK_360_floorPlan_map_gangway'));
                } else if (this.currentFloorSelection == 3) {
                    this.fadeElement($('#JWFK_360_floorPlan_map_subLab'));
                } else if (this.currentFloorSelection == 4) {
                    this.fadeElement($('#JWFK_360_floorPlan_map_containment'));
                }
            }
        },


        onClipSelect: function(contentItem) {
            this.loadContent(contentItem.associateContent);
        },

        fadeElement: function(element) {
            element.fadeOut(200, function () {
                element.addClass('selected');
                element.fadeIn();
            })
        },

        onBackButtonPressed: function(fromButtonClose) {
            console.log('onBackButtonPressed - floorNavigation');

            this.app.floorNavigationIsShowing = true;
            this.loadContent(this.currentGUID, fromButtonClose);
        },

        loadContent: function(content, fromButtonClose) {
            if (this.app.viewStack.length > 2) {
                this.app.viewStack.length = 1
            }

            this.app.playContent(
                content,
                null,
                {
                    skipPoster: true
                }
            )

            this.trigger("LOAD_COMPLETE");

            document.removeEventListener( 'keyup', this.onKeyUpBinded);
            document.removeEventListener( 'keydown', this.onKeyDownBinded);

            if (fromButtonClose) {
                this.app.floorNavigationIsShowing = false;
            }
        },

        removeSelectedStates: function() {
            $('#JWFK_360_floorPlan_map_reception').stop(true, true).removeClass('selected');
            $('#JWFK_360_floorPlan_map_library').stop(true, true).removeClass('selected');
            $('#JWFK_360_floorPlan_map_subLab').stop(true, true).removeClass('selected');
            $('#JWFK_360_floorPlan_map_gangway').stop(true, true).removeClass('selected');
            $('#JWFK_360_floorPlan_map_containment').stop(true, true).removeClass('selected');
        },

        onSelectedFloorClose: function() {
            this.onBackButtonPressed(true);
        }
    });
});
