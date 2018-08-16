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
    'text!templates/360/360View.html',
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
            this.listenTo(this.fm,"activeElementChanged",this.locationChanged);
            this.app = options.app;
            this.places = JSON.parse(data);
            this.undisclosedLocation = 2;
            this.currentSelection = 0;
            this.baseUrl = options.app.titleMetaData.title.base_url;
            this.backgroundUrl = "Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/";
            this.transitionVideoUrl = "Assets/Video/Places/Transition/";
            this.detailBackgroundUrl = "Assets/Image/Artwork/Images/1280x720/Places/Location_Detail_Backgrounds/";
            this.backgroundVideoUrl = "Assets/Video/Places/Background/";
            this.video360Url = "Assets/Video/360s/";

            if (options.initialIndex !== undefined) {
                this.initialIndex = _.indexOf(this.places, _.findWhere(this.places, {
                    name: options.initialIndex
                }));
            }
            this.superView = options.superView;
            window.onbeforeunload = this.onReload;

            this.contentStack = [];
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Sub Experience - 360 - Main Location", true);
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
            console.log("onrender");
            $(this.el).html(_.template(template, {}));

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
                self.onEnded();
            };

            this.videoIntroEndedHandler = function() {
                console.log('videoIntroEndedHandler')
                self.video[0].pause();

                //self.app.playContent("360_Kitchen");
                //self.video[1].play();

                //$(self.video[0]).removeClass('showing');

                //$(self.video[1]).addClass('showing');
            };

            this.canPlayHandler = function() {
                self.onCanPlay();
            };

            this.errorHandler = function() {
                self.onError();
            };

            this.video = $('video', this.el);
            this.video[0].src = this.baseUrl + this.video360Url + "JWFK_INTRO_04_ref_WithMusic.mp4?NO_MTHEORY_DECODER";
            this.video[0].addEventListener('error', this.errorHandler);
            this.video[0].addEventListener('stalled', this.errorHandler);
            this.video[0].addEventListener('ended', this.videoIntroEndedHandler, false);
            this.video[0].addEventListener('onended', this.videoIntroEndedHandler, false);

            this.mUpdateTimer = setInterval(
                this.onTimeUpdate.bind(this)
            , 50);

            //this.audio = $('#background-audio', this.el);
            //this.audio[0].src = this.baseUrl + "Assets/Audio/Places/FOTF_Places_Static_audiobed.wav?NO_MTHEORY_DECODER";

            setTimeout(function(){
                if(self.isMobileBrowser) {
                    self.setMobileLayout();
                    self.video[0].pause();
                    $(self.video[0]).removeClass('showing');
                }else {
                    self.video[0].play();
                    $(self.video[0]).addClass('showing');
                    //$('#place-location-saber-athena-img').addClass('selected')
                }
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


        onTimeUpdate: function() {
            var time = this.video[0].currentTime*100;
            if (time > 350) {
                //this.overviewUi.animate({opacity:1})
                clearInterval(this.mUpdateTimer);
            }
        },

        onTimeUpdateContent: function() {
            var time = this.video[0].currentTime*100;
            if (time > 350) {

                this.locationSelected();
                clearInterval(this.mUpdateTimer);
            }
        },

        onTimeUpdateContentOut: function() {
            var time = this.video[0].currentTime*100;
            if (time > 350) {
                this.onZoomOut();
                this.overviewUi.animate({opacity:1})
                clearInterval(this.mUpdateTimer);
            }
        },

        remove: function() {
            console.log('remove');
            this.video[0].removeEventListener('error', this.errorHandler);
            this.video[0].removeEventListener('stalled', this.errorHandler);
            this.video[0].removeEventListener('ended', this.videoIntroEndedHandler);
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
                this.OmnitureAnalyticsHelper.setPage("Location Details Page for " + this.getCurrentPlace().name, true);
            }
        },

        onBackButtonPressed: function() {
            console.log('360 - onBackButtonPressed');

            if (this.transitioning) {
                return;
            }

            if (this.details) {
                if (this.contentStack.length > 1) {
                    this.zoomOutMapView();
                } else {
                    /*
                    if (this.currentSelection == 0) {
                        this.playTransitionOutVideo("PR2_map_06_trans_Saber_Athena_REVERSE.mp4?NO_MTHEORY_DECODER", "PR2_map_02_loop_1.mp4?NO_MTHEORY_DECODER");
                    } else if (this.currentSelection == 1) {
                        this.playTransitionOutVideo("PR2_map_03_trans_Bracer_Phoenix_REVERSE.mp4?NO_MTHEORY_DECODER", "PR2_map_02_loop_1.mp4?NO_MTHEORY_DECODER");
                    } else if (this.currentSelection == 2) {
                        this.playTransitionOutVideo("PR2_map_04_trans_Guardian_Bravo_REVERSE.mp4?NO_MTHEORY_DECODER", "PR2_map_02_loop_1.mp4?NO_MTHEORY_DECODER");
                    } else if (this.currentSelection == 3) {
                        this.playTransitionOutVideo("PR2_map_05_trans_Mega_Kaiju_REVERSE.mp4?NO_MTHEORY_DECODER", "PR2_map_02_loop_1.mp4?NO_MTHEORY_DECODER");
                    } else if (this.currentSelection == 4) {
                        this.playTransitionOutVideo("PR2_map_02_trans_Gipsy_Avenger_REVERSE.mp4?NO_MTHEORY_DECODER", "PR2_map_02_loop_1.mp4?NO_MTHEORY_DECODER");
                    } else if (this.currentSelection == 5) {
                        this.playTransitionOutVideo("PR2_map_07_trans_Scrapper_03_REVERSE.mp4?NO_MTHEORY_DECODER", "PR2_map_02_loop_1.mp4?NO_MTHEORY_DECODER");
                    }
                      */  
                    //this.onZoomOut();
                }
                //this.OmnitureAnalyticsHelper.setAction("Exit Carousel Item: " + this.getCurrentContent().name, true);
                //this.OmnitureAnalyticsHelper.setPage("Main Screen - Carousel", true);
            } else {
                if (this.superView) {
                    console.log('1')
                    InteractiveComp.View.prototype.onBackButtonPressed.call(this);
                } else {
                    var self = this;

                    $('.places-view').animate({opacity: 0}, function() {
                        self.remove();
                        self.app.popView();
                    })
                }
            }
        },

        onBlurToSuperView: function () {
            var self = this;

            if (this.details && this.detailViewType === 'map') {
                _.each($('#google-map-panel-view').find(".backgroundThumb"), function(e, i) {
                    var $e = $(e);
                    if ($e) {
                        //$e.css( 'background-image', 'url("' + self.baseUrl + self.backgroundUrl +
                          //      self.contentStack[self.contentStack.length-1].locations[i].title_nor + '")' );
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

            /*
            if($(el).attr("id") == "place-location-Undisclosed"){
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

            /*
            if(!this.isMobileBrowser) {
                if (this.currentSelection != this.undisclosedLocation) {
                    var video = this.video[2];
                    video.src = this.baseUrl + this.transitionVideoUrl + this.getCurrentPlace().in_transition;
                    this.transitioning = true;
                    video.load();
                    this.video[0].pause();
                    $(this.video[0]).removeClass('showing');
                } else {
                    this.detailUi.addClass('showing');
                    this.overviewUi.removeClass('showing');
                }
            }else
            */
            {
                if(this.currentSelection != this.undisclosedLocation){
                    //this.detailUi.css({backgroundImage:'url("' + this.baseUrl + this.detailBackgroundUrl + this.getCurrentPlace().details_background + '")'});
                }else{
                    //this.detailUi.css({backgroundImage:'url("'+ this.baseUrl + this.detailBackgroundUrl + 'PitchPerfect3_Places_bg.jpg")'});
                }
                this.detailUi.addClass('showing');
                this.overviewUi.removeClass('showing');
            }
            //this.$('#place-name-header').css({backgroundImage:'url("'+this.baseUrl + this.backgroundUrl + this.getCurrentPlace().header +'")'});
            this.details = true;
            this.setDetailsInteraction();
            this.fm.initFocus('2,0', true, true, true);
            this.lastMainViewPosition = "1," + this.currentSelection;
            this.fm.firstElementIndex = "2,0";

            this.OmnitureAnalyticsHelper.setAction("Enter Selected Location: " + this.getCurrentPlace().name, true);
            this.OmnitureAnalyticsHelper.setPage("Location Details Page for " + this.getCurrentPlace().name, true);
        },

        onZoomOut: function() {
            console.log('onZoomOut');

            $('#place-contents-location-panel').html('');

            $("#overview-ui .selected").removeClass("selected");

            /*
            if(!this.isMobileBrowser) {
                if (this.currentSelection != this.undisclosedLocation) {
                    var video = this.video[3];
                    video.src = this.baseUrl + this.transitionVideoUrl + this.getCurrentPlace().out_transition;
                    video.load();
                    //this.audio[0].pause();
                    this.transitioning = true;
                } else {
                    this.video[1].pause();
                    $(this.video[1]).removeClass('showing');
                    this.video[0].play();
                    $(this.video[0]).addClass('showing');
                    this.detailUi.removeClass('showing');
                    this.overviewUi.addClass('showing');
                }
            }else
            */
            {
                this.detailUi.removeClass('showing');
                this.overviewUi.addClass('showing');
            }

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
            console.log('onEnded');

            this.transitioning = false;
            if (!this.browserPlatformHelper.isExperienceOnEmulator()) {
                this.$('i.close').show();
            }

            if (this.details) {
                this.detailUi.addClass('showing');
                //this.video[0].pause();
                //this.audio[0].play();
            } else {
                console.log('show carousel screen');
                this.overviewUi.addClass('showing');
                //this.video[0].play();
                //$(this.video[0]).addClass('showing');
            }

            
        },

        onError: function() {
            // this.onEnded();
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
                    //self.detailUi.css({backgroundImage:'url("' + this.baseUrl + this.detailBackgroundUrl + this.getCurrentPlace().details_background + '")'});
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

            if (code == this.KEY_ENTER) {
                this.$("#overview-ui .active").addClass('selected');
                this.app.playContent("360_Kitchen");
            } else if (code == this.KEY_BACK) {
                this.onBackButtonPressed();
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
            setTimeout(function(){
                this.loadContentListView();
                this.onZoomIn();
            }.bind(this), Tools.isMobile() ? 350 : 0)
        },

        onSelectedMarker: function() {
            this.playTransitionInVideo(0, "JW_Places_transition_03_WithAudio.mp4?NO_MTHEORY_DECODER", "JW_Places_loop_02_05_WithAudio.mp4?NO_MTHEORY_DECODER");
        },

        unFocusElements: function () {
            $('.focused').removeClass('focused');
        },

        playTransitionInVideo: function(selection, videoName1, videoName2) {
            var self = this;

            this.overviewUi.animate({opacity:0})

            this.video = $('video', this.el);
            this.video[0].src = this.baseUrl + this.transitionVideoUrl + videoName1;
            this.video[0].addEventListener('error', this.errorHandler);
            this.video[0].addEventListener('stalled', this.errorHandler);
            this.video[0].addEventListener('ended', this.videoIntroEndedHandler, false);
            this.video[0].addEventListener('onended', this.videoIntroEndedHandler, false);

            this.currentSelection = selection;

            this.mUpdateTimer = setInterval(
                this.onTimeUpdateContent.bind(this)
            , 50);

            //this.video[1].src = this.baseUrl + this.transitionVideoUrl + videoName2;
            //this.video[1].addEventListener('error', this.errorHandler);
            //this.video[1].addEventListener('stalled', this.errorHandler);
            ///$(this.video[1]).removeClass('showing');

            setTimeout(function(){
                if(self.isMobileBrowser) {
                    self.setMobileLayout();
                    self.video[0].pause();
                    $(self.video[0]).removeClass('showing');
                } else {
                    self.video[0].play();
                    //self.video[1].pause();
                    $(self.video[0]).addClass('showing');
                }
            });
        },

        playTransitionOutVideo: function(videoName1, videoName2) {
            var self = this;

            this.detailUi.animate({opacity:0})
            this.detailUi.removeClass('showing');
            this.overviewUi.addClass('showing');

            this.video = $('video', this.el);
            this.video[0].src = this.baseUrl + this.transitionVideoUrl + videoName1;
            this.video[0].addEventListener('error', this.errorHandler);
            this.video[0].addEventListener('stalled', this.errorHandler);
            this.video[0].addEventListener('ended', this.videoIntroEndedHandler, false);
            this.video[0].addEventListener('onended', this.videoIntroEndedHandler, false);

            this.mUpdateTimer = setInterval(
                this.onTimeUpdateContentOut.bind(this)
            , 50);

            //this.video[1].src = this.baseUrl + this.backgroundVideoUrl + videoName2;
            //this.video[1].addEventListener('error', this.errorHandler);
            //this.video[1].addEventListener('stalled', this.errorHandler);
            //$(this.video[1]).removeClass('showing');

            setTimeout(function(){
                if(self.isMobileBrowser) {
                    self.setMobileLayout();
                    self.video[0].pause();
                    $(self.video[0]).removeClass('showing');
                } else {
                    self.video[0].play();
                    //self.video[1].pause();
                    $(self.video[0]).addClass('showing');
                }
            });
        },

        changedContent: function (active, previousActive) {
            console.log('changedContent', active)
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

        contentSelected: function (contentIndex) {
            console.log('contentSelected', contentIndex)
            console.log('contentSelected this.transitioning', this.transitioning)
            if (this.transitioning) {
                return;
            }
            var index = parseInt(contentIndex);
            console.log('this.getCurrentPlace().contents[index]', this.getCurrentPlace().contents[index])
            if(this.getCurrentPlace().contents[index]){
                var currentContent = this.getCurrentPlace().contents[index];
                switch (currentContent.contentType){
                    case "gallery":
                        this.unFocusElements();
                        this.app.playContent(currentContent.assetId);
                        break;
                    case "video":
                        console.log('video')
                        //this.audio[0].pause();
                        //this.video[1].pause();
                        this.unFocusElements();
                        this.app.playContent(currentContent.assetId);
                        console.log('video', currentContent.assetId)
                        console.log('video', this.app)
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
                graphic: self.getCurrentPlace().graphic
            });

            if (mapView) {
                this.pushDetailViewToStack(mapView, this.contentStack);
            }

            this.listenTo(mapView, "ZoomOut_Location", this.zoomOutMapView);
            this.$('#detail-ui #place-contents-location-panel').html(mapView.render().el);
            this.fm.addView(mapView);

            if(this.currentSelection == this.undisclosedLocation && !this.isMobileBrowser ){
                //this.video[1].pause();
                //this.video[1].src = this.baseUrl + this.backgroundVideoUrl + this.getCurrentPlace().google_maps_background_video;
                //this.video[1].play();
            }

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
        KEY_ENTER: 13,
        KEY_BACK: 8
    });
});