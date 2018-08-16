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
    'text!templates/dinoExplorer/DinoExplorerView.html',
    'text!experience/dinoexplorer.json',
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
            this.detailBackgroundUrl = "Assets/Image/Artwork/Images/1280x720/Places/Location_Detail_Backgrounds/";
            this.transitionVideoUrl = "Assets/Video/DinoExplorer/Transition/";
            this.backgroundVideoUrl = "Assets/Video/DinoExplorer/";
            this.audioUrl = "Assets/Audio/";
            this.isAudioPlaying = false;
            this.canNavigate = false;

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
            this.OmnitureAnalyticsHelper.setPage("Sub Experience - Places - Main Location", true);
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

            this.canPlayHandler = function() {
                self.onCanPlay();
            };

            this.errorHandler = function() {
                self.onError();
            };

            this.videoTransitionContentEndedHandler = function() {
                console.log('videoTransitionContentEndedHandler')

                var placeData = self.getPlaceData(self.currentSelection, "video_content");

                if (placeData !== null && placeData !== undefined) {
                    self.playVideo(placeData, this.VIDEO_TYPE_CONTENT);

                    self.$('.focusable.close.mobileView').show();
                }

                setTimeout(() => {
                    this.canNavigate = true;
                }, 500);
            };

            this.videoTransitionPushInEndedHandler = function() {
                console.log('videoTransitionPushInEndedHandler')

                setTimeout(() => {
                    this.canNavigate = true;
                }, 500);

                var placeData = self.getPlaceData(self.currentSelection, "video_push_in_content");
                var contentListType = self.getPlaceData(self.currentSelection, "content_list_type");

                if (placeData !== null && placeData !== undefined) {
                    self.playVideo(placeData, this.VIDEO_TYPE_CONTENT_PUSH_IN);
                }

                self.locationSelected(contentListType);
            };

            this.playTransitionVideo("Dino_Intro_1_1.mp4", this.VIDEO_TYPE_CONTENT, true, false);

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
            /*
            var time = this.video[0].currentTime*100;
            if (time > 350) {
                this.overviewUi.animate({opacity:1})
                clearInterval(this.mUpdateTimer);
            }
            */
        },

        onTimeUpdateContent: function() {
            /*
            var time = this.video[0].currentTime*100;
            if (time > 350) {

                this.locationSelected();
                clearInterval(this.mUpdateTimer);
            }
            */
        },

        onTimeUpdateContentOut: function() {
            /*
            var time = this.video[0].currentTime*100;
            if (time > 350) {
                this.onZoomOut();
                this.overviewUi.animate({opacity:1})
                clearInterval(this.mUpdateTimer);
            }
            */
        },

        removeEventListeners: function() {
            this.video[0].removeEventListener('ended', this.videoTransitionContentEndedHandler);
            this.video[0].removeEventListener('ended', this.videoTransitionPushInEndedHandler);
            this.video[1].removeEventListener('ended', this.videoTransitionContentEndedHandler);
            this.video[1].removeEventListener('ended', this.videoTransitionPushInEndedHandler);
        },

        resume: function () {
            if(this.details) {
                this.$("#detail-ui .active").addClass('focused');
                this.video[1].play();
                this.OmnitureAnalyticsHelper.setPage("Location Details Page for " + this.getCurrentPlace().name, true);
            }
        },

        onBackButtonPressed: function() {
            console.log('DinoExplorer onBackButtonPressed');

            if (this.transitioning) {
                return;
            }

            this.audio = $('#background-audio', this.el);
            this.audio[0].pause();
            this.isAudioPlaying = false;

            if (this.details) {
                if (this.contentStack.length > 1) {
                    //this.zoomOutMapView();
                } else {
                    console.log('Push out : ' + this.currentSelection);

                    this.detailUi.removeClass('showing');
                    this.overviewUi.addClass('showing');

                    var placeData = this.getPlaceData(this.currentSelection, "video_content");
                    this.playTransitionVideo(placeData, this.VIDEO_TYPE_CONTENT, false);

                    this.onZoomOut();

                    this.$('.focusable.close.mobileView').show();
                }
            } else {
                if (this.superView) {
                    InteractiveComp.View.prototype.onBackButtonPressed.call(this);
                } else {
                    this.removeEventListeners();
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
                        //$e.css( 'background-image', 'url("' + self.baseUrl + self.backgroundUrl +
                          //      self.contentStack[self.contentStack.length-1].locations[i].title_nor + '")' );
                    }
                });
            }
        },

        locationChanged: function(index, el) {
        },

        onZoomIn: function() {
            console.log('onZoomIn');
            if (this.transitioning) {
                return;
            }

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

            this.canNavigate = true;

            $('#place-contents-location-panel').html('');

            $("#overview-ui .selected").removeClass("selected");

            {
                this.detailUi.removeClass('showing');
                this.overviewUi.addClass('showing');
            }

            this.video[0].play();
            this.video[0].addEventListener('ended', this.videoTransitionContentEndedHandler, false);

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
            } else {
                console.log('show carousel screen');
                this.overviewUi.addClass('showing');
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
            if (this.canNavigate) {
                if (code == this.KEY_BACK) {
                    this.onBackButtonPressed();
                } else {
                    if (this.details || this.transitioning) {
                        return;
                    }

                    var nextIndex = this.currentSelection;
                    var placeData = null;
                    var transition = this.VIDEO_TYPE_CONTENT;
                    var loop = false

                    if (code == this.KEY_RIGHT) {

                        nextIndex += 1;

                        if (this.currentSelection == 14) {
                            nextIndex = 0;
                        }

                        console.log('Sliding to right from : ' + this.currentSelection + ' to : ' + nextIndex);

                        placeData = this.getPlaceData(this.currentSelection, "video_transition_right");
                    } else if (code == this.KEY_LEFT) {

                        if (this.currentSelection == 0) {
                            nextIndex = 14;
                        } else {
                            nextIndex -= 1;
                        }

                        console.log('Sliding to left from : ' + this.currentSelection + ' to : ' + nextIndex);

                        placeData = this.getPlaceData(this.currentSelection, "video_transition_left");
                    } else if (code == this.KEY_ENTER) {
                        this.$('.focusable.close.mobileView').hide();
                        console.log('Push in : ' + this.currentSelection);

                        placeData = this.getPlaceData(this.currentSelection, "video_transition_push_in");
                        transition = this.VIDEO_TYPE_CONTENT_PUSH_IN;
                    } else if (code == this.KEY_BACK) {
                        console.log('key back')
                    }

                    this.currentSelection = nextIndex;

                    if (placeData !== null && placeData !== undefined) {
                        this.playTransitionVideo(placeData, transition, true, loop);
                    }
                }
            }
        },

        loadContentListView: function (view, contentListType) {
            var self = this;

            var detailContent;
            if (view) {
                detailContent = view;
            } else {
                detailContent = new contentList({
                    contents: self.getCurrentPlace().contents,
                    baseUrl: self.baseUrl,
                    listType: self.getCurrentPlace().content_list_type
                });
                this.pushDetailViewToStack(detailContent, this.contentStack);

                this.listenTo(detailContent, "CHANGED_CONTENT", this.changedContent);
                this.listenTo(detailContent, "SELECTED_CONTENT", this.contentSelected);
                this.listenTo(detailContent, "ZoomOut_CONTENT", this.onBackButtonPressed);
                this.listenTo(detailContent, "Audio_CONTENT", this.audioSelected);
            }

            this.$('#detail-ui #place-contents-location-panel').html(view ? detailContent.el : detailContent.render().el);

            this.fm.addView(detailContent);

            this.detailViewType = 'content';
        },

        audioSelected: function() {
            if(this.getCurrentPlace().audio){
                console.log('audio selected : ' + this.getCurrentPlace().audio);
                this.audio = $('#background-audio', this.el);
                this.audio[0].src = this.audioUrl + "/DinoExplorer/" + this.getCurrentPlace().audio + "?NO_MTHEORY_DECODER";
                this.audio[0].play();
            }
        },

        locationSelected: function (contentListType) {
            setTimeout(function(){
                this.loadContentListView(null, contentListType);
                this.onZoomIn();
            }.bind(this), Tools.isMobile() ? 350 : 0)
        },

        unFocusElements: function () {
            $('.focused').removeClass('focused');
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



        contentSelected: function (content) {
            var contentIndex = $(content).data('role')
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
                    case "video-big":
                        console.log('video')
                        //this.audio[0].pause();
                        this.video[1].pause();
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
        },

        googleMapSelected: function () {
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

        /*---------------------------------------------------------------------------------*/

        KEY_RIGHT: 39,
        KEY_LEFT: 37,
        KEY_ENTER: 13,
        KEY_BACK: 8,
        VIDEO_TYPE_CONTENT: "VIDEO_TYPE_CONTENT",
        VIDEO_TYPE_CONTENT_PUSH_IN: "VIDEO_TYPE_CONTENT_PUSH_IN",

        getPlaceData: function(index, data) {
            var currentPlaceData = this.places[index][data];

            return currentPlaceData;
        },

        playTransitionVideo: function(video, transition, completionBlock, loop) {
            console.log('[playTransitionVideo] video: ' + video)
            console.log('[playTransitionVideo] transition: ' + transition)
            var self = this;

            this.canNavigate = false;

            this.video = $('video', this.el);

            var playingVideoIndex = (this.video[0].classList.contains('showing')) ? 0 : 1;
            var idleVideoIndex = (this.video[0].classList.contains('showing')) ? 1 : 0;

            // Remove previous event listeners
            this.removeEventListeners();

            // Update video 0 source

            if (!completionBlock) {
                this.video[idleVideoIndex].src = this.baseUrl + this.backgroundVideoUrl + video + "?NO_MTHEORY_DECODER";
            } else {
                this.video[idleVideoIndex].src = this.baseUrl + this.transitionVideoUrl + video + "?NO_MTHEORY_DECODER";

                if (transition == this.VIDEO_TYPE_CONTENT) {
                    this.video[idleVideoIndex].addEventListener('ended',
                        this.videoTransitionContentEndedHandler, false);
                } else {
                    this.video[idleVideoIndex].addEventListener('ended',
                        this.videoTransitionPushInEndedHandler, false);
                }
            }

            this.video[idleVideoIndex].loop = (typeof loop === 'undefined')
                ? (transition === this.VIDEO_TYPE_CONTENT)
                : loop;

            this.video[idleVideoIndex].oncanplay = function() {
                var self = this;

                // Play video
                self.video[idleVideoIndex].play();

                // Update classes
                $(self.video[idleVideoIndex]).addClass('showing');

                // Pause video 1
                setTimeout(function() {
                    $(self.video[playingVideoIndex]).removeClass('showing');
                    self.video[playingVideoIndex].pause();
                }, 100);
            }.bind(this);
        },

        playVideo: function(video, transition) {
            var self = this;

            this.video = $('video', this.el);

            // Remove previous event listeners
            this.removeEventListeners();


            var playingVideoIndex = (this.video[0].classList.contains('showing')) ? 0 : 1;
            var idleVideoIndex = (this.video[0].classList.contains('showing')) ? 1 : 0;

            // Update video 1 source
            this.video[idleVideoIndex].src = this.baseUrl + this.backgroundVideoUrl + video + "?NO_MTHEORY_DECODER";

            if (transition == this.VIDEO_TYPE_CONTENT) {
                this.video[idleVideoIndex].addEventListener('ended',
                    this.videoTransitionContentEndedHandler, false);
            } else {
                this.video[idleVideoIndex].addEventListener('ended',
                    this.videoTransitionPushInEndedHandler, false);
            }

            this.video[idleVideoIndex].oncanplay = function() {
                var self = this;

                // Play video
                self.video[idleVideoIndex].play();

                $(self.video[idleVideoIndex]).addClass('showing');

                // Pause video 0
                setTimeout(function() {
                    $(self.video[playingVideoIndex]).removeClass('showing');
                    self.video[playingVideoIndex].pause();
                }, 100);

                setTimeout(() => {
                    self.canNavigate = true;
                }, 500);
            }.bind(this);
        },

        playAudio: function(audio) {
            var audioData = this.getPlaceData(this.currentSelection, "audio");
            this.audio = $('#background-audio', this.el);
            this.audio[0].src = this.audioUrl + audioData;

            if (!this.isAudioPlaying) {
                this.audio[0].play();
            } else {
                this.audio[0].pause();
            }

            this.isAudioPlaying = !this.isAudioPlaying
        }
    });
});