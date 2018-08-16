/**
 * Created by fleguillarm on 2018-03-16.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!templates/360_Map/360Map.html',
    'text!experience/360Map.json',
    'platform/tools'
], function($
        , _
        , Backbone
        , Hammer
        , InteractiveComp
        , template
        , data
        , Tools) {
    return InteractiveComp.View.extend({
        className: '360-map-view popup-component',

        initialize: function(options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
            this.listenTo(this.fm, 'keyUp', this.onKeyUp);
            this.listenTo(this.fm, "activeElementChanged", this.locationChanged);

            this.app = options.app;
            this.data = JSON.parse(data)
            this.places = this.data.Map;
            this.currentPlace = '360_Kitchen'
            this.hasAudio = true;

            this.undisclosedLocation = 2;
            this.currentSelection = 0;
            this.baseUrl = options.app.titleMetaData.title.base_url;
            this.backgroundUrl = "Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/";
            this.transitionVideoUrl = "Assets/Video/Places/Transition/";
            this.detailBackgroundUrl = "Assets/Image/Artwork/Images/1280x720/Places/Location_Detail_Backgrounds/";
            this.backgroundVideoUrl = "Assets/Video/Places/Background/";

            if (options.initialIndex !== undefined) {
                this.initialIndex = _.indexOf(this.places, _.findWhere(this.places, {
                    name: options.initialIndex
                }));
            }
            this.superView = options.superView;
            window.onbeforeunload = this.onReload;

            var assetsToPreload = _.findWhere(
                options.app.movieModel.get("contents"), { type: "preload" }
            ).metadata.Map360;
            this.preloadAssets(assetsToPreload);

            this.contentStack = [];
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.startSessionOnPage("360");
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

            /*$(this.el).html(_.template(template, {
                places: self.places
            }));*/

            this.preload = $('.preload', this.el);

            if (this.app.current360GUID !== undefined) {
                var target = _.findWhere(this.places, {
                    name: this.app.current360GUID
                })
                if (target) {
                    this.fm.firstElementIndex =
                        target.Coords[0].toString()
                        + ","
                        + target.Coords[1].toString();
                } else {
                    this.fm.firstElementIndex = "0,0";
                }
            } else {
                this.fm.firstElementIndex = "0,0";
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
                self.video[1].play();

                $(self.video[0]).removeClass('showing');

                $(self.video[1]).addClass('showing');
            };

            setTimeout(function(){
                self.app.playContent('360_Kitchen');
                if(self.isMobileBrowser) {
                    self.setMobileLayout();
                } else {
                }
            });
        },

        getAudioSource: function () {
            return "Assets/Audio/test.mp3?NO_MTHEORY_DECODER";
        },

        remove: function() {
        },

        resume: function () {
            this.audio = $('#audio-content');
            this.audioSrc = this.getAudioSource()
            this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audioSrc, 0, true);


            if (this.app.current360GUID !== undefined) {
                var target = _.findWhere(this.places, {
                    content: this.app.current360GUID
                })
                if (target) {
                    this.fm.initFocus(
                            target.Coords[0].toString()
                            + ","
                            + target.Coords[1].toString(),
                        1,1,1);
                }
            }

        },

        onBackButtonPressed: function() {
            if (this.transitioning) {
                return;
            }

           if (this.superView) {
                this.OmnitureAnalyticsHelper.stopSession();
                InteractiveComp.View.prototype.onBackButtonPressed.call(this);
            } else {
                this.OmnitureAnalyticsHelper.stopSession();
                this.remove();
                this.app.popView();
            }
        },

        onBlurToSuperView: function () {
        },

        locationChanged: function(index, el) {
            //console.log('locationChanged index', index);
            //console.log('locationChanged el', el);

            var id = $(el).attr('id')
            if (id) {
                id = id.replace('map-360-place-', '');
                this.currentPlace = id
                //console.log('locationChanged this.currentPlace', this.currentPlace);
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
                    this.detailUi.css({backgroundImage:'url("' + this.baseUrl + this.detailBackgroundUrl + this.getCurrentPlace().details_background + '")'});
                }else{
                    this.detailUi.css({backgroundImage:'url("'+ this.baseUrl + this.detailBackgroundUrl + 'PitchPerfect3_Places_bg.jpg")'});
                }
                this.detailUi.addClass('showing');
                this.overviewUi.removeClass('showing');
            }
            this.$('#place-name-header').css({backgroundImage:'url("'+this.baseUrl + this.backgroundUrl + this.getCurrentPlace().header +'")'});
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

        map360PlaceSelected: function () {
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

            this.app.playContent(this.currentPlace);
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