/**
 * Created by michelleli on 2017-05-24.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'experience/js/views/places/PlaceContentList',
    'experience/js/views/places/GoogleMapView',
    'text!templates/places/PlacesView.html',
    'text!experience/places.json',
    'platform/tools'
], function($
        , _
        , Backbone
        , Hammer
        , InteractiveComp
        , contentList
        , GoogleMapView
        , template
        , data
        , Tools) {
    return InteractiveComp.View.extend({
        className: 'places-view popup-component',

        initialize: function(options) {
            InteractiveComp.View.prototype.initialize.call(this, options);
            this.details = false;
            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
            this.listenTo(this.fm, 'keyUp', this.onKeyUp);
            this.listenTo(this.fm, "activeElementChanged", this.locationChanged);
            this.app = options.app;
            this.places = JSON.parse(data);
            this.undisclosedLocation = 2;
            this.currentSelection = 0;
            this.baseUrl = options.app.titleMetaData.title.base_url;
            this.backgroundUrl = "Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/";
            this.transitionVideoUrl = "Assets/Video/Places/Transition/";
            this.detailBackgroundUrl = "Assets/Image/Artwork/Images/1280x720/Places/Location_Detail_Backgrounds/";
            this.backgroundVideoUrl = "Assets/Video/Places/Background/";
            this.hasAudio = true;

            if (options.initialIndex !== undefined) {
                this.initialIndex = _.indexOf(this.places, _.findWhere(this.places, {
                    name: options.initialIndex
                }));
            }
            this.superView = options.superView;
            window.onbeforeunload = this.onReload;

            this.contentStack = [];

            var assetsToPreload = _.findWhere(options.app.movieModel.get("contents"), { type: "preload" }).metadata.places;
            this.preloadAssets(assetsToPreload);
            this.preloadImages = this.preloadImageAssets(assetsToPreload);
        },

        preloadImageAssets: function (assets) {
            var images = [];
            for (var i = 0; i < assets.length; i++) {
                images[i] = new Image();
                images[i].src = this.baseUrl + assets[i];
            }

            return images;
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.startSessionOnPage("Places");
        },

        setDetailsInteraction: function(){
            this.setEnabled('#overview-ui #place-location-Berlin', !this.details);
            this.setEnabled('#overview-ui #place-location-Havana', !this.details);
            this.setEnabled('#overview-ui #place-location-NewYork', !this.details);
            this.setEnabled('#overview-ui #place-location-Vladovin', !this.details);
            this.setEnabled('#overview-ui #place-location-Undisclosed', !this.details);
            this.setEnabled('#detail-ui #place-contents-location-panel',this.details);
        },

        setMobileLayout: function () {
            //$('#overview-ui').css({backgroundImage:'url("'+ this.baseUrl + this.detailBackgroundUrl + 'PitchPerfect3_Places_bg.jpg")'});
        },

        render: function() {
            var self = this;

            $(this.el).html(_.template(template, {}));

            this.app.canNavigate = false;

            if (this.initialIndex !== undefined) {
                this.fm.firstElementIndex = this.initialIndex.toString() + ",0";
            } else {
                this.fm.firstElementIndex = "1,0";
            }

            this.setDetailsInteraction();
            this.initFocusManager();
            this.contentContainer = $('#content-container-area',this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.videoEndedHandler = function() {
                //self.onEnded();
            };

            this.videoIntroEndedHandler = function() {
                console.log('videoIntroEndedHandler')

                self.app.canNavigate = true;

                self.audio = $('#audio-content');
                self.audioSrc = "Assets/Audio/JurassicWorldFallenKingdom_NextGen_Places_loop_01.mp3?NO_MTHEORY_DECODER";
                self.fadeInAudioElementWithSrcAndDuration(self.audio[0], self.audioSrc, 0, true);

                self.video[0].pause();
                self.video[1].play();

                $(self.video[0]).removeClass('showing');

                $(self.video[1]).addClass('showing');
                self.overviewUi.animate({opacity:1})
            };

            this.videoTransitionTimeUpdateHandler = function() {
                if (self.video[0].currentTime > 0.40 && self.video[0].currentTime < 0.50) {
                    self.detailUi.addClass('showing');
                    self.detailUi.animate({opacity: 1}, 3500);
                }
            },

            this.videoMenuEndedHandler = function() {
                console.log('videoMenuEndedHandler')

                self.video[0].play();
            },

            this.videoTransitionEndedHandler = function() {
                console.log('videoTransitionEndedHandler')

                self.app.canNavigate = true;

                self.video[0].pause();
                self.video[1].play();

                $(self.video[0]).removeClass('showing');
                $(self.video[1]).addClass('showing');

                //self.detailUi.css({backgroundImage:'url("' + self.baseUrl + self.detailBackgroundUrl + self.getCurrentPlace().details_background + '")'});

                //self.overviewUi.animate({opacity: 0});
                //self.overviewUi.removeClass('showing');

                self.OmnitureAnalyticsHelper.stopSession();
                self.OmnitureAnalyticsHelper.startSessionOnPage("Places - " + self.getCurrentPlace().name);

                //self.$('#place-name-header').css({backgroundImage:'url("'+self.baseUrl + self.backgroundUrl + self.getCurrentPlace().header +'")'});
                self.details = true;
                self.setDetailsInteraction();
                self.fm.initFocus('2,0', true, true, true, true, {}, true);
                self.lastMainViewPosition = "1," + self.currentSelection;
                self.fm.firstElementIndex = "2,0";

                $('#overview-ui .focusable').attr('data-disabled', 'true');

                self.OmnitureAnalyticsHelper.setAction("Enter Selected Location: " + self.getCurrentPlace().name, true);
                self.OmnitureAnalyticsHelper.setPage("Location Details Page for " + self.getCurrentPlace().name, true);
            };

            this.canPlayHandler = function() {
                self.onCanPlay();
            };

            this.errorHandler = function() {
                self.onError();
            };

            this.video = $('video', this.el);
            this.video[0].src = this.baseUrl + this.backgroundVideoUrl + "JW_Places_Intro_01_WithAudio.mp4?NO_MTHEORY_DECODER";
            this.video[0].addEventListener('ended', this.videoIntroEndedHandler, false);

            /*this.mUpdateTimer = setInterval(
                this.onTimeUpdate.bind(this)
            , 50);*/

            this.video[1].src = this.baseUrl + this.backgroundVideoUrl + "JW_Places_loop_01_WithAudio.mp4?NO_MTHEORY_DECODER";
            $(this.video[1]).removeClass('showing');

            //this.audio = $('#background-audio', this.el);
            //this.audio[0].src = this.baseUrl + "Assets/Audio/Places/FOTF_Places_Static_audiobed.wav?NO_MTHEORY_DECODER";

            _.delay(function(){


                if(self.isMobileBrowser) {
                    self.setMobileLayout();
                    self.video[0].pause();
                    $(self.video[0]).removeClass('showing');
                }else {
                    self.video[0].play();
                    self.video[1].pause();
                    $(self.video[0]).addClass('showing');
                    //$('#place-location-pacific-ocean').addClass('selected')
                }
                self.overviewUi.animate({opacity:0})
                //self.onEnded();
            });

            this.detailUi = $('#detail-ui', this.el);
            this.detailUi.removeClass('showing');

            this.overviewUi = $('#overview-ui', this.el);
            this.overviewUi.addClass('showing');

            this.preload = $('#preload', this.el);

            if (this.initialIndex !== undefined) {
                this.currentSelection = this.initialIndex;
                this.initialIndex = undefined;
                this.onZoomIn();
            }
        },

        getAudioSource: function () {
            return null;
        },

        onTimeUpdate: function() {
            var time = this.video[0].currentTime*100;
            if (time > 500) {
                //this.overviewUi.animate({opacity:1})
                clearInterval(this.mUpdateTimer);
            }
        },

        remove: function() {
            this.video[0].removeEventListener('error', this.errorHandler);
            this.video[0].removeEventListener('stalled', this.errorHandler);
            this.video[0].removeEventListener('ended', this.videoIntroEndedHandler);

            this.video[1].removeEventListener('error', this.errorHandler);
            this.video[1].removeEventListener('stalled', this.errorHandler);
        },

        resume: function () {
            if(this.details) {
                this.$("#detail-ui .active").addClass('focused');
                if(!this.isMobileBrowser) {
                    if (this.currentSelection != this.undisclosedLocation) {
                        //this.audio[0].play();
                    } else {
                       //this.video[1].play();
                    }
                }


                this.audio = $('#audio-content');
                this.audioSrc = "Assets/Audio/JurassicWorldFallenKingdom_NextGen_Places_loop_01.mp3?NO_MTHEORY_DECODER";
                this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audioSrc, 0, true);
            }
        },

        onBackButtonPressed: function() {
            console.log('Places onBackButtonPressed');

            if (this.transitioning) {
                return;
            }

            this.app.canNavigate = true;

            if (this.details) {
                if (this.contentStack.length > 1) {
                    this.zoomOutMapView();
                } else {
                    this.onZoomOut();
                }
                //this.OmnitureAnalyticsHelper.setAction("Exit Carousel Item: " + this.getCurrentContent().name, true);
                //this.OmnitureAnalyticsHelper.setPage("Main Screen - Carousel", true);
            } else {
                this.OmnitureAnalyticsHelper.stopSession();
                if (this.superView) {
                    InteractiveComp.View.prototype.onBackButtonPressed.call(this);
                } else {
                    this.remove();
                    this.app.popView();
                }
            }
        },

        onBlurToSuperView: function () {
            var self = this;

            if (this.details && this.detailViewType === 'map') {
                _.each($('#google-map-panel-view').find(".backgroundThumb"), function(e, i) {
                    var $e = $(e);
                    if ($e) {
                        $e.css( 'background-image', 'url("' + self.baseUrl + self.backgroundUrl +
                                self.contentStack[self.contentStack.length-1].locations[i].title_nor + '")' );
                    }
                });
            }
        },

        locationChanged: function(index, el) {
            console.log('locationChanged index', index);
            console.log('locationChanged el', el);

            var id = $(el).attr('id')
            if (id) {
                id = id.replace('place-location-', '');
                $('.location-img').removeClass('selected')
                $('#place-location-'+id+'-img').addClass('selected')
            }

            if ($("#overview-ui").find(el).length <= 0 ||  this.isMobileBrowser) {
                return;
            }

            /*if($(el).attr("id") == "place-location-Undisclosed"){
                this.video[0].pause();
                $(this.video[0]).removeClass('showing');
                this.video[1].play();
                $(this.video[1]).addClass('showing');
            }else{
                this.video[1].pause();
                $(this.video[1]).removeClass('showing');
                this.video[0].play();
                $(this.video[0]).addClass('showing');
            }*/

            this.OmnitureAnalyticsHelper.setAction("Selected Location Changed to: " + $(el).attr("id"), true);
        },

        onZoomIn: function() {
            console.log('onZoomIn');
            if (this.transitioning) {
                return;
            }

            var self = this;

            this.video = $('video', this.el);
            this.video[0].src = this.baseUrl + this.backgroundVideoUrl + "JW_Places_transition_03_WithAudio.mp4?NO_MTHEORY_DECODER";
            this.video[0].removeEventListener('timeupdate', this.videoTransitionTimeUpdateHandler, false);
            this.video[0].removeEventListener('ended', this.videoIntroEndedHandler, false);
            this.video[0].addEventListener('ended', this.videoTransitionEndedHandler, false);
            this.video[0].addEventListener('timeupdate', this.videoTransitionTimeUpdateHandler, false);

            this.video[0].play();
            $(this.video[1]).removeClass('showing');
            $(this.video[0]).addClass('showing');
            this.video[1].pause();

            this.video[1].src = this.baseUrl + this.backgroundVideoUrl + "JW_Places_loop_02_05_WithAudio.mp4?NO_MTHEORY_DECODER";

            this.overviewUi.removeClass('showing');

            this.detailUi.animate({opacity: 0});
            this.overviewUi.animate({opacity: 0});
        },

        onZoomOut: function() {
            console.log('onZoomOut');

            $('#place-contents-location-panel').html('');
            $('#overview-ui .focusable').removeAttr("data-disabled");

            $("#overview-ui .selected").removeClass("selected");

            this.video = $('video', this.el);



            this.video[1].pause();
            $(this.video[1]).removeClass('showing');
            this.video[0].src = this.baseUrl + this.backgroundVideoUrl + "JW_Places_loop_01_WithAudio.mp4?NO_MTHEORY_DECODER";
            $(this.video[0]).addClass('showing');
            this.video[0].play();

            this.video[0].removeEventListener('ended', this.videoTransitionEndedHandler, false);
            this.video[0].removeEventListener('timeupdate', this.videoTransitionTimeUpdateHandler, false);
            this.video[0].addEventListener('ended', this.videoMenuEndedHandler, false);

            this.detailUi.removeClass('showing');
            this.overviewUi.addClass('showing');

            this.overviewUi.animate({opacity: 1});
            this.detailUi.animate({opacity: 0});

            this.OmnitureAnalyticsHelper.startSessionOnPage("Places");

            this.details = false;
            this.setDetailsInteraction();
            this.fm.initFocus(this.lastMainViewPosition,true,true,true,true);
            this.fm.firstElementIndex = this.lastMainViewPosition;
            this.$('i.close').removeClass('details');

            this.detailViewType = null;

            this.popDetailViewFromStack(this.contentStack);
            this.OmnitureAnalyticsHelper.setPage("Exit Location Details Page for " + this.getCurrentPlace().name, true);
            this.OmnitureAnalyticsHelper.setPage("Sub Experience - Places - Main Location", true);
        },

        emulator: function() {
            return navigator.userAgent.match(/CrOS/i) || navigator.userAgent.match(/M-Theory-Chromium/i);
        },

        onEnded: function() {
            console.log('e onEnded');

            this.transitioning = false;
            if (!this.browserPlatformHelper.isExperienceOnEmulator()) {
                this.$('i.close').show();
            }

            if (this.details) {
                this.detailUi.addClass('showing');
                this.video[0].pause();
                this.audio[0].play();
            } else {
                console.log('show carousel screen');
                this.overviewUi.addClass('showing');
                this.video[0].play();
                $(this.video[0]).addClass('showing');
            }
        },

        onError: function() {
            this.onEnded();
        },

        onCanPlay: function() {
            var self = this;
            console.log('onCanPlay');
            if (!this.details) {
                if(!navigator.platform.match(/iPhone/i)) {
                }
                self.detailUi.removeClass('showing');
            } else {
                if(!navigator.platform.match(/iPhone/i)) {
                }
                self.overviewUi.removeClass('showing');

                if(this.currentSelection != this.undisclosedLocation){
                    self.detailUi.css({backgroundImage:'url("' + this.baseUrl + this.detailBackgroundUrl + this.getCurrentPlace().details_background + '")'});
                }

                if (!this.browserPlatformHelper.isExperienceOnEmulator()) {
                    this.$('i.close').hide();
                }
            }

            if(navigator.platform.match(/iPhone/i)) {
                self.onEnded();
            }

        },

        onKeyDown: function(code) {
            var self = this;
            if (this.details || this.transitioning) {
                return;
            }

            if (this.app.canNavigate == true) {
                if (code == this.KEY_ENTER) {
                    this.$("#overview-ui .active").addClass('selected');
                }
            }
        },

        loadContentListView: function (view) {
            var self = this;

            var detailContent;
            if (view) {
                detailContent = view;
            } else {
                detailContent = new contentList({
                    contents: self.getCurrentPlace().contents,
                    baseUrl: self.baseUrl
                });
                this.pushDetailViewToStack(detailContent, this.contentStack);

                this.listenTo(detailContent, "CHANGED_CONTENT", this.changedContent);
                this.listenTo(detailContent, "SELECTED_CONTENT", this.contentSelected);
                this.listenTo(detailContent, "ZoomOut_CONTENT", this.onBackButtonPressed);
            }

            this.$('#detail-ui #place-contents-location-panel').html(view ? detailContent.el : detailContent.render().el);

            this.fm.addView(detailContent);

            this.detailViewType = 'content';
        },

        locationSelected: function () {
            if (this.app.canNavigate == true) {
                setTimeout(function(){
                    this.app.canNavigate = false;
                    this.loadContentListView();
                    this.onZoomIn();
                }.bind(this), Tools.isMobile() ? 500 : 0)
            }
        },

        onSelectedPacificOcean: function () {
            this.currentSelection = 1;
            this.locationSelected();
        },

        onSelectedSanFrancisco: function () {
            this.currentSelection = 0;
            this.locationSelected();
        },

        onSelectedNorthenCalifornia: function () {
            this.currentSelection = 2;
            this.locationSelected();
        },

        onSelectedSierraNevada: function () {
            this.currentSelection = 3;
            this.locationSelected();
        },

        onSelectedIslaNublar: function () {
            this.currentSelection = 4;
            this.locationSelected();
        },

        onSelectedWashingtonDc: function () {
            this.currentSelection = 5;
            this.locationSelected();
        },

        unFocusElements: function () {
            $('.focused').removeClass('focused');
        },

        changedContent: function (active, previousActive) {
            //console.log('changedContent', active)
            var index;//, iconImg;
            if (previousActive && !previousActive.el) {
                index = $(previousActive).data('role');
                //iconImg = this.getCurrentPlace().contents[index].type_icon_nor;
                //if (iconImg) {
                //    $(previousActive).find('.play-icon').css('background-image', 'url("' + this.backgroundUrl + iconImg + '")');
                //}
            }
            if (active && !active.el) {
                index = $(active).data('role');
                //iconImg = this.getCurrentPlace().contents[index].type_icon_sel;
                //if (iconImg) {
                //    $(active).find('.play-icon').css('background-image', 'url("' + this.backgroundUrl +  iconImg + '")');
                //}
            }
        },

        contentSelected: function (currentContent) {
            //console.log('contentSelected', contentIndex)
            //console.log('contentSelected this.transitioning', this.transitioning)
            if (this.transitioning) {
                return;
            }
            //var index = parseInt(contentIndex);
            //console.log('this.getCurrentPlace().contents[index]', this.getCurrentPlace().contents[index])
            if (currentContent){
                //var currentContent = this.getCurrentPlace().contents[index];
                switch (currentContent.contentType){
                    case "gallery":
                        this.unFocusElements();
                        this.app.playContent(currentContent.assetId);
                        break;
                    case "video":
                    case "videoGallery":
                        console.log('video')
                        //this.audio[0].pause();
                        this.video[1].pause();
                        this.unFocusElements();
                        this.app.playContent(currentContent.assetId);
                        console.log('video', currentContent.assetId)
                        console.log('video', this.app)

                        this.audio = $('#audio-content');
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

                        break;
                    case "google_map":
                        this.unFocusElements();
                        this.googleMapSelected();
                        break;
                    default:
                        break;
                }
            }
        },

        zoomOutMapView: function () {
            this.popDetailViewFromStack(this.contentStack);

            this.loadContentListView(this.contentStack[this.contentStack.length - 1]);

            if(this.currentSelection == this.undisclosedLocation && !this.isMobileBrowser){
                //this.video[1].pause();
                //this.video[1].src = this.baseUrl + this.backgroundVideoUrl + this.getCurrentPlace().content_background_video;
                //this.video[1].play();
            }

            this.fm.initFocus("2,0",true,true,true);
            this.OmnitureAnalyticsHelper.setAction("Exit Location Google Map for: " + this.getCurrentPlace().name, true);
            this.OmnitureAnalyticsHelper.setPage("Location Details Page for " + this.getCurrentPlace().name, true);
        },

        googleMapSelected: function () {
            var self = this;

            var mapView = new GoogleMapView({
                locations: self.getCurrentPlace().locations,
                baseUrl: self.baseUrl,
                graphic: self.getCurrentPlace().graphic,
                currentPlace: self.getCurrentPlace()
            });

            if (mapView) {
                this.pushDetailViewToStack(mapView, this.contentStack);
            }

            this.listenTo(mapView, "ZoomOut_Location", this.zoomOutMapView);
            this.$('#detail-ui #place-contents-location-panel').html(mapView.render().el);
            this.fm.addView(mapView);

            /*if(this.currentSelection == this.undisclosedLocation && !this.isMobileBrowser ){
                this.video[1].pause();
                this.video[1].src = this.baseUrl + this.backgroundVideoUrl + this.getCurrentPlace().google_maps_background_video;
                this.video[1].play();
            }*/

            this.fm.initFocus("2,0",true,true,true);

            this.detailViewType = 'map';
            this.OmnitureAnalyticsHelper.setAction("Enter Selected Location Google Map for: " + this.getCurrentPlace().name, true);
            this.OmnitureAnalyticsHelper.setPage("Location Google Map Page for " + this.getCurrentPlace().name, true);
        },

        pushDetailViewToStack: function (view, stack) {
            stack.push(view);
        },

        popDetailViewFromStack: function (stack) {
            stack.pop();
            if(stack.length) {
                stack[stack.length - 1].delegateEvents();
            } else {
                this.initFocusManager();
                this.fm.firstElementIndex = this.lastMainViewPosition;
                this.fm.initFocus(this.lastMainViewPosition, true, true, true, true);
            }
        },

        getCurrentPlace: function() {
            return this.places[this.currentSelection];
        },

        KEY_RIGHT: 39,
        KEY_LEFT: 37,
        KEY_ENTER: 13
    });
});