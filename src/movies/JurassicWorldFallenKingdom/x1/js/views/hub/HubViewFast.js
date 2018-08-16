define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'views/cargarage/GarageView',
    'views/timeline/TimelineView',
    'views/stuntsvfx/StuntsVFXView',
    'views/places/PlacesView',
    'views/thetake/tt_main_view',
    'text!templates/hub/HubView.html',
    'text!hub.json'
], function ($, _, Backbone, Hammer, InteractiveComp, GarageView, TimelineView, StuntsVFXView, PlacesView, StyleView, template, data) {
    return InteractiveComp.View.extend({
        className: 'hub-view popup-component',

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.isRootView = true;

            /* Sample Events to listen to (usually correspond to events triggering from the view's focus manager) */

            // Any key press (useful for TV remote navigation keys - same as left, right, up and down arrow keys on the keyboard)
            this.listenTo(this.fm, 'keyDown', this.onKeyDown);

            // Event handler for when an active element on the logical grid has changed
            // Usually, an active element is also the focused element
            this.listenTo(this.fm, 'activeElementChanged', this.onActiveElementChange);

            // Experience Assets as a JSON object
            this.contentItems = JSON.parse(data);

            this.currentSelection = 0;

            this.transitioning = false;

            this.baseUrl = options.app.titleMetaData.title.base_url;

            this.styleMetadata = options.style_metadata;

            this.timelineBookmark = options.timeline_bookmark;

            window.onbeforeunload = this.onReload;
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.onExperienceLoad();
            this.OmnitureAnalyticsHelper.setPage("Main Menu - The Fate of the Furious Franchise Hub", true);
        },

        render: function () {
            var self = this;

            $(this.el).html(_.template(template, {}));

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            setTimeout(function(){
                if(self.browserPlatformHelper.isExperienceOnEmulator() || self.app && self.app.debug) {
                    self.setEnabled(self.closeButton[0], false);
                    self.closeButton.hide();
                    self.closeButtonClickableArea.hide();
                } else {
                    self.setEnabled(self.closeButton[0], true);
                    self.closeButton.show();
                    self.closeButtonClickableArea.show();
                }
            });

            this.backgroundImage = $('#background-image', this.el);

            this.hubNav = $('#hub-nav', this.el);
            this.navLinkLeft = $('#nav-link-left', this.el);
            this.navLink1 = $('#nav-link-1', this.el);
            this.navLink2 = $('#nav-link-2', this.el);
            this.navLink3 = $('#nav-link-3', this.el);
            this.navLink4 = $('#nav-link-4', this.el);
            this.navLink5 = $('#nav-link-5', this.el);
            this.navLink6 = $('#nav-link-6', this.el);
            this.navLinkRight = $('#nav-link-right', this.el);
            this.contentText = $('#content-text', this.el);
            this.navGradient = $('#location-nav-grad', this.el);
            this.audio = $('#background-audio', this.el);
            this.audio[0].src = this.baseUrl + "Assets/Audio/FOTF_NextGen_audiobed.mp3?NO_MTHEORY_DECODER";
            this.audio[0].volume = 0;
            this.audio.animate({volume:1}, 1000);

            // The first element on the logical grid that should be focused
            this.fm.firstElementIndex = "2,0";

            // This will initialise the logical grid view
            this.initFocusManager();

            this.hubNav.bind('animationend webkitAnimationEnd', function() {
                $(this).addClass('blink');
            });

            setTimeout(function(){
                if (self.timelineBookmark) {
                    self.onNavSelect(null, self.timelineBookmark);
                    self.timelineBookmark = null;
                }
            });

            return this;
        },

        onNavSelect: function(element, timelineBookmark) {
            var self = this;

            this.audio.animate({volume: 0}, 1000, 'linear', function(){
                self.audio[0].pause();
            });

            if(this.getIndexOffset(0) === this.loadedViewIndex) {
                return;
            }

            this.closeButton.removeClass('timeline-close');

            var previousSubView = this.subview;

            if (timelineBookmark) {
                this.currentSelection = this.contentItems.findIndex(function(contentItem){
                    return contentItem.name === 'Timeline'
                });
                this.subview = new TimelineView({
                    app        : this.app,
                    superView  : this,
                    bookmark: timelineBookmark
                });
                this.updateContentText();
                this.hubNav.css('background-image', 'url("' + this.baseUrl + this.contentItems[this.getIndexOffset(0)].sel_image + '")');
            } else {
                switch(this.getCurrentContent().name) {
                    case 'Timeline':
                        this.subview = new TimelineView({
                            app        : this.app,
                            superView  : this
                        });
                        break;
                    case 'Cars':
                        this.subview = new GarageView({
                            app        : this.app,
                            superView  : this
                        });
                        break;
                    case 'Effects':
                        this.subview = new StuntsVFXView({
                            app: this.app,
                            superView  : this,
                            experienceType: 'Effects'
                        });
                        break;
                    case 'Extras':
                        this.subview = new StuntsVFXView({
                            app: this.app,
                            superView  : this,
                            experienceType: 'Extras'
                        });
                        break;
                    case 'Places':
                        this.subview = new PlacesView({
                            app: this.app,
                            superView  : this
                        });
                        break;
                    case 'Style':
                        this.subview = new StyleView({
                            superView  : this,
                            mediaID: this.styleMetadata.mediaID
                        });
                        break;
                    default:
                        break;
                }
            }

            if (this.subview) {
                this.updateThumbs();

                this.subview.render();

                this.fm.ignoreEnter = true;

                var $selectorToFadeOut = $('#sub-view', this.el).html() ? $('#sub-view', this.el) : $('#hub-background', this.el);

                var initFn = function () {
                    self.loadedViewIndex = self.currentSelection;
                    self.fm.initFocus($('#sub-view', self.el).attr('data-position'), true, true, true, true);
                    self.fm.ignoreEnter = false;
                };

                var viewLoadFn = function () {
                    $('#sub-view', self.el).fadeIn(function () {
                        self.subview.viewLoaded ? self.subview.viewLoaded(initFn) : initFn();
                    });
                };

                var fadeOutAndSetNewView = function () {
                    self.contentText.fadeOut(700);
                    if (self.getCurrentContent().name === 'Style') {
                        self.navGradient.fadeOut();
                    }
                    $selectorToFadeOut.fadeOut(function () {
                        $('#sub-view', self.el).html(self.subview.el);
                        self.fm.addView(self.subview);
                        $('#sub-view', self.el).attr('data-disabled', '');
                        self.subview.loadAssets().done(function() {
                            self.subview.onViewLoad ? self.subview.onViewLoad(viewLoadFn) : viewLoadFn();
                        });
                    });
                };

                $selectorToFadeOut.selector === '#sub-view' && previousSubView.unloadView && _.isFunction(previousSubView.unloadView) ?
                    previousSubView.unloadView(fadeOutAndSetNewView) :
                    fadeOutAndSetNewView();

                this.hubNav.removeClass('focused');
                this.hubNav.removeClass('blink');
            }
        },

        removeSubView: function() {
            var self = this;
            var $subView = $('#sub-view', this.el);
            var $hubBackground = $('#hub-background', this.el);

            $subView.fadeOut(function () {
                $subView.html('');
                self.fm.removeViewAt($subView[0]);
                self.closeButton.removeClass('timeline-close');
                $('#sub-view', self.el).attr('data-disabled', 'true');
                self.navGradient.fadeIn();
                $hubBackground.fadeIn(function () {
                    self.fm.initFocus($('#hub-nav', self.el).attr('data-position'), true, true, true, true);
                    self.subview = null;
                    self.loadedViewIndex = '';
                });
            });

            this.audio[0].play();
            this.audio.animate({volume: 1}, 1000);
        },

        onKeyDown: function(code) {
            var self = this;

            if (!$('#hub-nav').hasClass('focused')) {
                return;
            }

            if (this.transitioning) {
                return;
            }

            if(this.subview && !this.subview.$el.attr('data-disabled') && (code == this.KEY_UP)) {
                this.hubNav.removeClass('focused');
                this.hubNav.removeClass('blink');

                this.currentSelection = this.loadedViewIndex || (this.loadedViewIndex === 0 ? 0 : this.currentSelection);
                this.updateThumbs();
                this.updateContentText();

                this.hubNav.css('background-image', 'url("' + this.baseUrl + this.contentItems[this.getIndexOffset(0)].sel_image + '")');

                this.subview.onReFocus ? this.subview.onReFocus() : null;
            }

            if (code != this.KEY_RIGHT && code != this.KEY_LEFT) {
                return;
            }

            this.transitioning = true;
            this.fm.ignoreEnter = true;
            this.hubNav.hide();
            this.hubNav.removeClass('focused');
            this.hubNav.removeClass('blink');
            this.updateThumbs();

            if (code == this.KEY_LEFT) {
                this.OmnitureAnalyticsHelper.setAction("Navigated Left on the Main Hub Menu", true);
                this.navigateLeft(self);
            } else if (code == this.KEY_RIGHT) {
                this.OmnitureAnalyticsHelper.setAction("Navigated Right on the Main Hub Menu", true);
                this.navigateRight(self);
            }

            $('.nav-link').bind('webkitTransitionEnd transitionend', function(){
                self.hubNav.css('background-image', 'url("'+ self.baseUrl  + self.contentItems[self.getIndexOffset(0)].sel_image + '")');
                self.hubNav.show();
                self.hubNav.addClass('focused');

                self.navLink1.removeClass('fadeOut');
                self.navLink6.removeClass('fadeOut');

                self.transitioning = false;
                self.fm.ignoreEnter = false;

                if(self.getCurrentContent().content_text) {
                    self.contentText.fadeIn(800);
                }
            });

            this.updateContentText();
        },

        navigateLeft: function() {
            var self = this;

            this.currentSelection = this.getIndexOffset(-1);

            var navLinks = [self.navLinkLeft, self.navLink1, self.navLink2, self.navLink3, self.navLink4, self.navLink5, self.navLink6];

            setTimeout(function(){
                _.each(navLinks, function($navLink){
                    $navLink.addClass('animatable');
                    $navLink === self.navLinkLeft ?
                        $navLink.fadeIn() : null;
                    $navLink === self.navLink6 ?
                        $navLink.addClass('fadeOut').css('transform', 'translateX(360px)') :
                        $navLink.css('transform', 'translateX(182px)');
                });
            });
        },

        navigateRight: function() {
            var self = this;

            this.currentSelection = this.getIndexOffset(1);

            var navLinks = [self.navLink1, self.navLink2, self.navLink3, self.navLink4, self.navLink5, self.navLink6, self.navLinkRight];

            setTimeout(function(){
                _.each(navLinks, function($navLink){
                    $navLink.addClass('animatable');
                    $navLink === self.navLink1 ?
                        $navLink.addClass('fadeOut').css('transform', 'translateX(-360px)') :
                        $navLink === self.navLinkRight ?
                            $navLink.fadeIn().css('transform', 'translateX(-182px)') :
                            $navLink.css('transform', 'translateX(-182px)');
                });
            });
        },

        updateThumbs: function () {
            var self = this;

            var thumbs = [self.navLinkLeft, self.navLink1, self.navLink2, self.navLink3, self.navLink4, self.navLink5, self.navLink6, self.navLinkRight];

            var i = 0, index, img;
            _.each(thumbs, function($thumb){
                index = $thumb === self.navLinkLeft ? 5 :
                        $thumb === self.navLinkRight ? 0 :
                        i++;

                img = self.baseUrl + self.contentItems[self.getIndexOffset(index)].nor_image;

                $thumb === self.navLinkLeft || $thumb === self.navLinkRight ?
                    $thumb.hide() :
                $thumb === self.navLink1 || $thumb === self.navLink6 ?
                    $thumb.show() : null;

                $thumb.removeClass('animatable');
                $thumb.css('transform', 'translateX(0px)');
                $thumb.css('background-image', 'url("' + img + '")');
            });
        },

        updateContentText: function () {
            this.contentText.hide();

            if (this.getCurrentContent().content_text) {
                this.contentText.css('background-image', 'url("'+ this.baseUrl + this.getCurrentContent().content_text + '")');
                this.getCurrentContent().y === 'top' ?
                    this.contentText.css('top', '594px') :
                    this.contentText.css('top', '615px');
            } else {
                this.contentText.css('background-image', 'none');
            }
        },

        onBackButtonPressed: function () {
            if ((this.loadedViewIndex || this.loadedViewIndex === 0) && this.subview && this.subview.onBackButtonPressed) {
                this.subview.onBackButtonPressed();
            } else {
                InteractiveComp.View.prototype.onBackButtonPressed.call(this);
            }
        },

        // Resets video src on browser refresh (browser stalls otherwise in some cases)
        onReload: function () {
            $('video').each(function () {
                this.src = '';
            });
        },

        resume: function () {
            if ((this.loadedViewIndex || this.loadedViewIndex === 0) && this.subview && this.subview.resume) {
                this.subview.resume();
            }else {
                this.audio[0].play();
                this.audio.animate({volume: 1}, 1000);
                this.OmnitureAnalyticsHelper.setPage("Main Menu - The Fate of the Furious Franchise Hub", true);
            }
        },

        onActiveElementChange: function (trigger, element, hitEnter, previousActive) {
            if (this.subview && previousActive && previousActive.className &&
                previousActive.className.includes(this.subview.className) &&
                element.id === 'hub-nav') {
                    if (this.subview.onBlurToSuperView && _.isFunction(this.subview.onBlurToSuperView)) {
                        this.subview.onBlurToSuperView();
                    }
            }

            if (element.id === 'hub-nav' && previousActive && previousActive.id !== 'hub-nav') {
                this.contentText.fadeIn(700);
            }
        },

        /* Helper Methods */

        // Gets the content item, which is a certain offset from the currently selected
        // content item (useful for experiences like the carousel)
        getIndexOffset: function (offset) {
            // Ignore the case when the current selection is not defined / applicable for content selection
            if (offset < 0 && (-1*offset) <= this.contentItems.length) {
                if ((-1*offset) > this.contentItems.length) {
                    offset = -1*((-1*offset) % this.contentItems.length);
                }
                return (this.currentSelection + this.contentItems.length + offset) % this.contentItems.length;
            } else if (offset >= 0) {
                if (this.currentSelection || this.currentSelection === 0) {
                    return (this.currentSelection + offset) % this.contentItems.length;
                }
            }
        },

        // Gets the currently selected content item
        getCurrentContent: function () {
            // Ignore the case when the current selection is not defined / applicable for content selection
            if (this.currentSelection || this.currentSelection === 0) {
                return this.contentItems[this.currentSelection];
            }
        }
    });
});