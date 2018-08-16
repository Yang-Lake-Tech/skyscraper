var mouseEnabled = false;
// router.js
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/tools',
    'common/js/utils/BrowserPlatformHelper',
    'platform/models/movie',
    'platform/views/video_content',
    'platform/views/embedded_video_view',
    'platform/views/textPopupContent',
    'platform/views/popup',
    'platform/views/photoGallery',
    'platform/views/panoramaVideo',
    'platform/views/panoramaInteractive',
    'platform/views/third_party/ThirdPartyView',
    'platform/views/single_video_content/SingleVideoContent',
    'platform/views/thetake/tt_main_view',
    'platform/models/galleries',
    'platform/models/categories',
    'common/js/models/TitleMetaDataModel',
    'platform/responsive'
], function($, _, Backbone, Hammer, Tools, BrowserPlatformHelper,
            MovieModel, VideoContentView, embedVideoView, TextPopup, Popup, GalleryView,
            PanoramaVideo, PanoramaInteractive, ThirdPartyView, SingleVideoContentView, StyleView,
            galleries, Categories, TitleMetaDataModel, Responsive)
{
    var app;
    var PlatformRouter = Backbone.Router.extend({
        debug: false,

        viewStack: [],

        initialize: function() {
            app = this;
            this.newViewProgressCounter = 0;
        },

        start: function(options) {
            var self = this;

            this.responsive = new Responsive();
            this.titleMetaData = options.title;

            this.hubInitialPlay = true;

            this.current360AudioTime = 0;
            this.current360AudioTag = 1;
            this.replay360LibraryVideo = true;
            this.replay360LabFrontVideo = true;
            this.replay360ContainmentVideo = true;
            this.floorNavigationIsShowing = false;
            this.audio360Src = "Assets/Audio/JWFK_360_audiobed0" + this.current360AudioTag + ".wav?NO_MTHEORY_DECODER";

            this.canNavigate = true;

            window.addEventListener('message', function(e) {
             var message = e.data;
                if(message == "close") self.popView();
            });

            this.isReady = false;
            // models initializing
            this.titleID = this.titleMetaData.title.guid;
            this.API_URL = 'http://api.theplatform.services/';

            self.isReady = 1;
            $('#main-loading-overlay').hide();

            //this.fm.initFocus();
            document.onkeydown = function(event) {
                if($(event.target).attr('id') == 'pac-input') {
                    return;
                }
                if(self.isReady && self.activeFM)
                self.activeFM.keyDown(event.keyCode);
            };

            document.onkeyup = function(event) {
                if($(event.target).attr('id') == 'pac-input') {
                    return;
                }

                if(self.isReady && self.activeFM)
                self.activeFM.keyUp(event.keyCode);
            };

            document.onkeypress = function(event) {
                if($(event.target).attr('id') == 'pac-input') {
                    return;
                }

                if(self.isReady)
                self.activeFM.keyPress(event.keyCode);
                event.preventDefault();
            };

            this.movieModel = new MovieModel({app: this, feature: this.titleMetaData.title.features[0]});
            // init views
            // TODO: create mainMenu views  from metadata, currently hardcoded


        },

        updateContent: function(category_id) {
            var self = this;
            var selectedCategory = this.allCategories.get(category_id);
            if(!selectedCategory) throw("Category doesn't exist with id: " + category_id);
            // TODO: draw dynamically based on metadata(models and template should be send for each subview)
            if( this[selectedCategory.get("metadata").view_name] ) this[selectedCategory.get("metadata").view_name]();
        },

        pushView: function(view
            , transparent
            , popupMode
            , contentContainer
            , noClose
            , noOverlay
            , transition
            , hideLoadingScreen
            , addToStack
        ) {
            var self = this;
            var $mainModal = $("#main-modal");
            addToStack = (typeof addToStack === 'undefined') ? true : addToStack

            this.toggleKeyPress(true);

            if(this.viewStack.length == 0) {
                this.rootView = this.activeFM; // store the initial launch point
                // TODO: add a suspend method to dashboard
            } else {
                var current = this.viewStack[this.viewStack.length - 1];
                if (!(current instanceof Popup) && current.suspend) {
                    current.suspend();
                } else if (current instanceof Popup && current.view && current.view.suspend) {
                    current.view.suspend();
                }
            }

            // if popup mode on backspace it pops the current view
            this.popupMode = popupMode;

            //if title has background audio
            if($('audio#audio-content').length) {
                if(view.hasAudio) {
                    //console.log('pause audio');
                    //$('audio#audio-content')[0].pause();
                } else {
                    //console.log('replay audio');
                    // this.transitionAudio(view.audioTrack);
                    //$('audio#audio-content')[0].play();
                }
            }

            if (!contentContainer) {
                $mainModal.show();

                if (view.preloader) {
                    this.listenTo(view, "LOADING_SCREEN", function () {
                        self.showProgress.call(this,
                            0,
                            view.awaitsExternalProgress ? "internal" : null,
                            hideLoadingScreen);
                    });
                    this.listenTo(view, "LOAD_COMPLETE", function () {
                        self.showProgress.call(this,
                            100,
                            view.awaitsExternalProgress ? "internal" : null,
                            this.furtherProgressStatus, hideLoadingScreen)
                    });
                    this.listenTo(view.preloader, "PROGRESS", function () {
                        self.showProgress.apply(this, Array.prototype.slice.call(arguments).concat([
                            view.awaitsExternalProgress ? "internal" : null,
                            hideLoadingScreen]))
                    });

                    this.showProgress(
                        0,
                        view.awaitsExternalProgress ? "internal" : null,
                        hideLoadingScreen);
                }
            }

            this.onLoadCompleteTransition = transition;

            if (hideLoadingScreen) {
                setTimeout(function(){
                    self._pushView(view
                        , transparent
                        , popupMode
                        , contentContainer
                        , noClose
                        , noOverlay
                        , addToStack
                    );
                }, this.getHalfDurationForTransition(this.onLoadCompleteTransition));
            } else {
                self._pushView(view
                    , transparent
                    , popupMode
                    , contentContainer
                    , noClose
                    , noOverlay
                    , addToStack
                );
            }

            if (view.loadAssets && _.isFunction(view.loadAssets)){
                view.loadAssets().done();
            }
        },

        transitionAudio: function(audioTrack) {
            var self = this;
            var backgroundAudio = $('audio#audio-content');
            var volumeDelta = -0.2;

            if(!audioTrack) {
                audioTrack = this.titleMetaData.title.background_audio_url;
            }

            audioTrack = this.titleMetaData.title.base_url + audioTrack;

            if(backgroundAudio.attr('src') == audioTrack) {
                return; // no change in track
            }

            if(this.audioTransition) {
                clearInterval(this.audioTransition);
                this.audioTransition = undefined;
            }

            function transition() {
                var currentVolume = backgroundAudio[0].volume;
                currentVolume += volumeDelta;
                if(currentVolume <= 0) {
                    // current audio faded to 0, switch track and start fade in
                    currentVolume = 0;
                    backgroundAudio.attr('src', audioTrack);
                    volumeDelta = 0.2;
                } else if(currentVolume >=1 && volumeDelta > 0) {
                    // new audio faded up to 1, stop transition
                    currentVolume = 1;
                    clearInterval(self.audioTransition);
                    self.audioTransition = undefined;
                }

                backgroundAudio[0].volume = currentVolume;
            }

            volumeDelta = -0.2;
            this.audioTransition = setInterval(transition, 100);
        },

        showProgress: function(progress, type, hideLoadingScreen) {
            var $loadingWrapper = $('#loading-wrapper');

            $loadingWrapper.find('.progress-bar').css('width', parseInt(progress > 100 ? 100 : progress, 10) + "%");

            if (progress === 100) {
                if (!type || this.newViewProgressCounter === 1) {
                    this.newViewProgressCounter = 0;

                    this.startTransition(this.onLoadCompleteTransition);

                    setTimeout(function () {
                        $loadingWrapper.hide();
                    }, this.getHalfDurationForTransition(this.onLoadCompleteTransition));
                } else {
                    this.newViewProgressCounter++;
                }
            } else {
                if (hideLoadingScreen) {
                    $loadingWrapper.hide();
                } else {
                    $loadingWrapper.show();
                }

            }
        },

        _pushView: function(
                view
                , transparent
                , popupMode
                , contentContainer
                , noClose
                , noOverlay
                , addToStack
        ) {
            // if in popupMode create a popup component then add to the page
            if (popupMode) {
                var popup = new Popup({
                    debug: this.debug,
                    noClose: noClose,
                    noAnalytics: true
                });
                this.listenTo(popup,"close",this.popView);
                popup.setView(view);
                popup.render();

                if (contentContainer){
                    if (noOverlay) {
                        popup.setOverlayProperty(true);
                    }
                    contentContainer.html(popup.el);
                } else {
                    popup.setOverlayProperty(false);
                    $("#main-modal").show().find(".content").html(popup.el);
                }
                this.activeFM = popup.fm;
                if (addToStack) {
                    this.viewStack.push(popup);
                }
            } else {
                if (contentContainer) {
                    contentContainer.html(view.el);
                } else {
                    $("#main-modal").show().find(".content").html(view.el);
                }
                if (view.fm) {
                    this.activeFM = view.fm;
                    this.activeFM.initFocus('', true);
                }
                if (addToStack) {
                    this.viewStack.push(view);
                }
            }

            this.toggleKeyPress(true);

            if(transparent) {
                $("#main-modal").addClass('transparent');
            } else {
                $("#main-modal").removeClass('transparent');
                $('#main-content').hide();
                $('#main-menu').hide();
            }

            if(view.startShowing) {
                view.startShowing();
            }
        },

        popView: function (resumeData, retainFocus, transition) {
            this.asyncPopViewCallCount = this.asyncPopViewCallCount ? (this.asyncPopViewCallCount + 1) : 1;

            if (this.getHalfDurationForTransition(transition)) {
                setTimeout(function () {
                    this._popView(resumeData, retainFocus);
                }.bind(this), this.getHalfDurationForTransition(transition));
            } else {
                this._popView(resumeData, retainFocus);
            }

            this.startTransition(transition);
        },

        _popView: function(resumeData, retainFocus) {
            if(this.viewStack.length == 1) { // reached the bottom of the stack, restore root view
                try {
                    var termURL = "./DCB9C840-7EA9-4A16-A02D-C4DB8E4B27C6";
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.onreadystatechange = function() {};
                    xmlHttp.open("GET", termURL, true); // true for asynchronous
                    xmlHttp.send(null);

                    nz.nzappapi.AppShutdown();
                } catch(e) {
                    console.log("Error happened on nz.nzappapi: " + e.message)
                }
                return;

            } else {
                var current = this.viewStack.pop();

                this.asyncPopViewCallCount--;

                var removePopup = true;
                if (current.getOverlayProperty && current.getOverlayProperty()){
                    removePopup = !current.getOverlayProperty();
                }

                if (current) {
                    if (current.stopShowing) {
                        current.stopShowing();
                    }
                    current.remove();
                }
                var previous = this.viewStack[this.viewStack.length - 1];


                if($('audio#audio-content').length) {

                    if(previous.hasAudio) {
                        //console.log('pause audio');
                        $('audio#audio-content')[0].play();
                    }
                }

                this.activeFM = previous.fm;
                previous.delegateEvents(); // mouse interaction
                if(removePopup) {
                    $("#main-modal").show().find(".content").html(previous.el);
                }
                if(previous.resume) {
                    previous.resume.call(previous, resumeData);
                }
                this.activeFM.initFocus();
            }
            if(retainFocus) this.activeFM.initFocus();
        },

        playContent: function(id, bookmark, data, contentContainer, isEmbedded, transition, hideLoadingScreen) {
            //console.log('[router] playContent id:', id)
            //console.log('[router] playContent this.movieModel:', this.movieModel)
            var content = _.findWhere(this.movieModel.get('contents'),{id: id});
            //console.log('[router] playContent content:', content)

            if (!content) {
                return;
            }
            this.playContentItem(content, bookmark, data, contentContainer, isEmbedded, transition, hideLoadingScreen);

            if (!this.nz_initialized) {
                this.nz_initialized = true;
                nz.nzappapi.Initialize(NZ_PROTO_SRC, {});
                try {
                    var actURL = "./3E5369E0-ACD2-4CEB-9A6E-570D6CDC64AD";

                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.onreadystatechange = function() {};
                    xmlHttp.open("GET", actURL, true); // true for asynchronous
                    xmlHttp.send(null);

                    nz.nzappapi.AppVisible();
                } catch(e) {
                    console.log("Error happened on nz.nzappapi: " + e.message)
                }
            }
        },

        playContentItem: function(contentItem, bookmark, contentData, contentContainer, isEmbedded, transition, hideLoadingScreen) {
            var experienceName;
            if (this.viewStack.length) {
                experienceName = this.viewStack[this.viewStack.length-1].experienceName;
            }
            
            switch(contentItem.type.toLowerCase()) {
                case 'video':
                    if (isEmbedded) {
                        var videoView = new embedVideoView({
                            app: this,
                            model: this.movieModel,
                            experienceName: experienceName,
                            videoId: contentItem.id,
                            inTime: contentData ?
                                contentData.video ?
                                    contentData.video.startAt :
                                    null :
                                null,
                            quarter: contentData ?
                                contentData.video ?
                                    contentData.video.quarter :
                                    null :
                                null,
                            half: contentData ?
                                contentData.video ?
                                    contentData.video.half :
                                    null :
                                null,
                            threeQuarters: contentData ?
                                contentData.video ?
                                    contentData.video.threeQuarters :
                                    null :
                                null,
                            noRelatedContent: true,
                            noCloseOnRight: true,
                            container: contentContainer
                        });

                        videoView.render();
                        this.pushView(videoView, 0, 0, contentContainer, null, null, transition || { type: 'fade' }, hideLoadingScreen);
                    } else {
                        var videoView = new VideoContentView({
                            app: this,
                            model: this.movieModel,
                            experienceName: experienceName,
                            videoId: contentItem.id,
                            inTime: contentData ?
                                contentData.video ?
                                    contentData.video.startAt :
                                    null :
                                null,
                            quarter: contentData ?
                                contentData.video ?
                                    contentData.video.quarter :
                                    null :
                                null,
                            half: contentData ?
                                contentData.video ?
                                    contentData.video.half :
                                    null :
                                null,
                            threeQuarters: contentData ?
                                contentData.video ?
                                    contentData.video.threeQuarters :
                                    null :
                                null,
                            noRelatedContent: true,
                            noCloseOnRight: true
                        });

                        videoView.render();
                        this.pushView(videoView, 0, 1, contentContainer, null, null, transition || { type: 'fade' }, hideLoadingScreen);
                    }

                    var videoPlayer = document.getElementById('video-tap-zone');
                    var timeline = document.getElementById('video-timeline');

                    //UM-49, adding play/pause capabilities to the video player; also toggles the timeline
                    //if the timeline is hidden (First shows the timeline, then pauses if the timeline is visible)
                    Hammer(videoPlayer).on('tap', function(e){
                        if (videoView.timelineHidden){
                            videoView.toggleTimeline(true);
                        } else {
                            videoView.onPlayPause();
                        }
                    });

                    //UM-49, adding scrub capabilities to the bar
                    Hammer(timeline).on('tap', function(e){
                        //Calculates the number of seconds through the video, and we then scrub to that position.
                        //The 'hideTimeline' function is passed in, so that we retain the proper
                        //function scope (hideTimeline handles some global flags, which become desync'd otherwise)
                        var percentageOnBar = (e.center.x - timeline.offsetLeft) / timeline.clientWidth;
                        var seconds = Math.floor(videoView.videoDuration * percentageOnBar);
                        videoView.scrubTo(seconds, videoView.hideTimeline, 3);
                    });

                    videoView.play(contentItem.id);

                    break;
                case 'gallery':
                    var data = galleries.findWhere({id: contentItem.id});
                    var gallery = new GalleryView( {
                        baseURL: this.titleMetaData.title.base_url,
                        model: contentItem,
                        currentImage: contentData ? contentData.gallery ? contentData.gallery.currentImage : 0 : 0,
                        noCloseOnRight: true });
                    var gallery = new GalleryView({
                        experienceName: experienceName,
                        baseURL: this.titleMetaData.title.base_url + (this.titleMetaData.title.photoGalleryUrl ?
                            this.titleMetaData.title.photoGalleryUrl :
                            ""),
                        model: contentItem,
                        currentImage: contentData ?
                            (contentData.gallery ?
                                contentData.gallery.currentImage :
                                0) :
                            0,
                        noCloseOnRight: true
                    });

                    gallery.render();
                    this.pushView(gallery, 0, 1, contentContainer, null, null, transition || { type: 'fade' }, hideLoadingScreen);

                    //UM-49: Add swiping functionality in gallery
                    var galleryView = document.getElementById('photoGallery');
                    Hammer(galleryView).on('swipeleft', function(){
                        $('.right').trigger('click');
                    });
                    Hammer(galleryView).on('swiperight', function(){
                        $('.left').trigger('click');
                    });

                    break;
                case '360_video':
                    var panoramaVideo = new PanoramaVideo({
                        app: this,
                        experienceName: experienceName,
                        baseURL: '',
                        metadata: contentItem.metadata,
                        noCloseOnRight: true,
                        skipPoster: contentData ? contentData.skipPoster : false
                    });
                    panoramaVideo.render();
                    this.pushView(panoramaVideo, 0, 1, contentContainer, true, true, transition || { type: 'fade' }, hideLoadingScreen);
                    break;
                case '360_video_interactive':
                    if (BrowserPlatformHelper.isExperienceOniPad() || $.browser.mobile) {
                        this.playContent(contentItem.mobileId);
                    } else {
                        var view;
                        view = new PanoramaInteractive({
                            app: this,
                            experienceName: experienceName,
                            baseURL: '',
                            metadata: contentItem.metadata,
                            noCloseOnRight: true,
                            contentData: contentData
                        });
                        view.render();
                        this.pushView(
                            view
                            , 0
                            , 0
                            , null
                            , true
                            , null
                            , transition || { type: 'fade' }
                            , hideLoadingScreen
                            , contentData ? contentData.addToStack : true
                        );
                    }
                    break;
                case "third_party_link":
                    var thirdParty = new ThirdPartyView({
                        app: this,
                        experienceName: contentItem.asset.name,
                        src: contentItem.metadata.iframe_src,
                        domain: contentItem.metadata.iframe_domain,
                        closeButton: contentItem.metadata.close_button,
                        childLevel: contentItem.metadata.child_level
                    });

                    thirdParty.render();
                    this.pushView(thirdParty, 0, 0, null, null, null, transition || { type: 'fade' }, hideLoadingScreen);
                    break;
                case "single_video_content":
                    var singleVideoContent = new SingleVideoContentView({
                        app: this,
                        experienceName: experienceName,
                        singleVideoContent: contentItem.single_video_content
                    });

                    singleVideoContent.render();
                    this.pushView(singleVideoContent, 0, 0, null, null, null, { type: "fade" }, hideLoadingScreen);
                    break;
                case "style":
                    experience = new StyleView({
                        app: this,
                        experienceName: contentItem.content_type,
                        mediaID: contentItem.style_metadata.mediaID
                    });
                    experience.experienceName = contentItem.content_type;
                    experience.render();

                    this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                    break;

                default:
                    break;
            }
        },

        loadTitleById: function(id) {
            //console.log('loadTitleById');
            //console.log(id);
            var model = new TitleMetaDataModel();
            var self = this;
            model.fetch({
                success: function() {
                    self.loadTitle(model.attributes);
                    //console.log(model.attributes);
                },
                error: function() {
                    console.log('metadata model fetch error');
                },
                complete: function(xhr, textStatus) {
                    //console.log(textStatus);
                }
            });
        },

        findCategoryById: function(guid) {
            return this.allCategories.get(guid);
        },

        loadTitle: function(titleMetaData) {
            //console.log('loadTitle');

            var self = this;

            this.allCategories = new Categories( titleMetaData.categories );

            self.mainMenuItems = new Categories( _.map(titleMetaData.title.title_categories, function( id ) {
                var cat = self.allCategories.get(id);
                if(cat) {
                    cat.children = new Categories( _.filter( _.map( cat.get("children"), function(id) {
                        return self.allCategories.get(id)
                    }), function(itm) { return itm; }) );
                    return cat;
                }
                else throw("category doesnt exist with id:" + id)

            }) );

            self.start( {title: titleMetaData });
            Backbone.history.start();
        },

        fallbackRoute: function (id) {
            this.playContent(id);
        },

        startTransition: function (transition) {
            var $mainModal = $('#main-modal');

            if (transition && transition.type) {
                switch (transition.type) {
                    case 'dip-fade':
                        $mainModal.addClass('linear-dip-fade');
                        $mainModal.on('animationend webkitAnimationEnd', function(){
                            $mainModal.off('animationend webkitAnimationEnd');
                            $mainModal.removeClass('linear-dip-fade');
                            this.toggleKeyPress(false);
                        }.bind(this));
                        break;
                    case 'fade':
                        $mainModal.addClass('linear-fade');
                        $mainModal.on('animationend webkitAnimationEnd', function(){
                            $mainModal.off('animationend webkitAnimationEnd');
                            $mainModal.removeClass('linear-fade');
                            this.toggleKeyPress(false);
                        }.bind(this));
                        break;
                    default:
                        setTimeout(function () {
                            this.toggleKeyPress(false);
                        }.bind(this), 100); // Long delay passed in to ensure that it doesn't interfere with key press block calls
                        break;
                }
            } else {
                setTimeout(function () {
                    this.toggleKeyPress(false);
                }.bind(this), 100); // Long delay passed in to ensure that it doesn't interfere with key press block calls
            }
        },

        toggleKeyPress: function (block) {
            if (this.viewStack.length) {
                _.each(this.viewStack, function(view){
                    if (view.fm) {
                        view.fm.ignoreEnter = block;
                        view.fm.blockKeyDown = block;
                    }
                });
            }
        },

        getHalfDurationForTransition: function (transition) {
            var duration = 0;

            if (transition) {
                switch (transition.type) {
                    case 'fade':
                        duration = 500;
                        break;
                    case 'dip-fade':
                        duration = 600;
                        break;
                    default:
                        break;
                }
            }

            return duration;
        }
    });

    var getApp = function() { return app; };

    return {
        PlatformRouter: PlatformRouter,
        getApp: getApp
    };
});
