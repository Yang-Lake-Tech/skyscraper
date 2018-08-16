// views/interactiveComp.js
define([
    'jquery',
    'mobileDetector',
    'underscore',
    'backbone',
    'hammer',
    'platform/tools',
    'common/js/NativeBridge',
    'common/js/utils/preloader',
    'common/js/utils/BrowserPlatformHelper',
    'common/js/utils/OmnitureAnalyticsHelper'
], function ($, mobileDetector, _, Backbone, Hammer, Tools, NativeBridge, Preloader, BrowserPlatformHelper, OmnitureAnalyticsHelper) {
    var InteractiveComp = Backbone.View.extend({
        last: function () {

        },

        numpad: function () {

        },

        initFocusManager: function () {
            var self = this;
            this.fm.reset();
            this.fm.addElements(this.el);
        },

        initialize: function (options) {
            var self = this;

            this.startExperience = $('#start-experience');

            this.preloader = new Preloader();
            this.listenTo(this.preloader, "COMPLETE", function () {
                this.loadComplete()
            }.bind(this));

            this.fm = new Tools.FocusManager();

            this.listenTo(this.fm, 'backPressed', this.onBackButtonPressed);

            _.bindAll(this, "initFocusManager", "render", "applyAction");

            require(["platform/router"], function (router) {
                self.app = router.getApp();
                if (self.onAppAssociation && _.isFunction(self.onAppAssociation)) {
                    self.onAppAssociation(self.app.debug);
                }
                if (options && !options.noAnalytics) {
                    self.OmnitureAnalyticsHelper = new OmnitureAnalyticsHelper(self.app, options && options.experienceName ? options.experienceName : null);
                    if(_.isFunction(self.startAnalytics)) self.startAnalytics();
                }
                self.updateMobileView();
            });

            // every view is a promise, call reseolve after its rendered
            this.deferred = $.Deferred();
            this.deferred.promise(this);

            // if preload flag is not set, resolve the promise
            if (!this.preload) this.deferred.resolve();

            if (options && options.experienceName) {
                this.experienceName = options.experienceName;
            }
        },

        onAppAssociation: function (debug) {
            if (this.browserPlatformHelper.isExperienceOnEmulator() || (this.app && this.app.debug) || debug) {
                if (this.closeButton) {
                    this.setEnabled(this.closeButton[0], false);
                    this.closeButton.hide();
                }
                this.closeButtonClickableArea ? this.closeButtonClickableArea.hide() : null;
                this.$el.removeClass('isTouchDevice').removeClass('isMobile')
            } else {
                if (this.closeButton) {
                    this.setEnabled(this.closeButton[0], true);
                    this.closeButton.show();
                }
                this.closeButtonClickableArea ? this.closeButtonClickableArea.show() : null;
            }
        },

        preloadAssets: function(assetPaths) {
            this.preloader.setAssets(assetPaths);
            this.preloader.load();
        },

        loadComplete: function () {

        },

        loadAssets: function () {
            var self = this;

            this.done(function () {
                var assetsList = [];
                if (self.$("img").length) {
                    self.$("img").each(function () {
                        assetsList.push($(this).attr("src"));
                    });
                }

                if (self.$el.hasClass("preload")) assetsList.push(self.$el.css("background-image").replace('url(', '').replace(')', '').replace(/"/g, '').replace(/'/g, ''));

                self.$(".preload").each(function () {
                    if ($(this).css("background-image") !== 'none') assetsList.push($(this).css("background-image").replace('url(', '').replace(')', '').replace(/"/g, ''));
                });

                self.preloader.setAssets(assetsList);
                self.preloader.load();
            });

            return this.preloader.getPromise();
        },

        onStartExperienceWithIntroVideo: function(video, src) {
            this.startExperience.hide();

            video.src = src;

            var promise = video.play();
            if (promise && promise instanceof Promise) { // Chromium on MTheory currently doesn't support video promises
                promise.then(function() {
                    $(video).animate({volume:1}, 1000);
                }.bind(this)).catch(function (error) {
                    console.log("video play video error " + error);
                    this.deferred.resolve();
                    this.startExperience.show();
                    Hammer(this.startExperience[0]).on('tap', function(){
                        video.play();
                        $(video).animate({volume:1}, 1000);
                        this.startExperience.hide();
                        if (this.onAppAssociation && _.isFunction(this.onAppAssociation)) {
                            this.onAppAssociation();
                        }
                    }.bind(this));
                }.bind(this));
            } else {
                $(video).animate({volume:1}, 1000);
            }
        },

        delegateEvents: function () {
            var self = this;
            // mouse interaction
            this.events = _.extend(this.events || {},
                {
                    "click *[data-position]": function (e, hitEnter) {
                        var target = $(e.currentTarget);
                        if (!target.attr('data-disabled')) {
                            self.fm.initFocus(target.attr("data-position"), 1, 1, 1, 1, {}, hitEnter ? true : false);
                            self.applyAction(self.fm.active, hitEnter);
                            e.stopPropagation();
                        }
                    },
                    "mouseenter *[data-position]": function (e) {
                        if (!mouseEnabled && e) return;
                        var target = $(e.currentTarget);
                        self.fm.initFocus(target.attr("data-position"), 1, 1, 1, 0);
                        self.applyHoverAction(self.fm.active);
                        e.stopPropagation()
                    },
                    "mouseleave *[data-position]": function (e) {
                        if (!mouseEnabled) return;
                        self.fm.blur();
                    }
                });

            if (this.fm) {
                _.map(this.fm.getViews(), function (view) {
                    if (view.delegateEvents) view.delegateEvents.apply(view);
                });
            }

            Backbone.View.prototype.delegateEvents.apply(this, arguments);
        },

        switchTo: function (viewId) {
            var el = this.$('*[data-view=' + viewId + ']');
            if (el.length) {
                this.fm.initFocus(el.attr('data-position'), 1, 1, 1);
            }
        },

        applyAction: function (active, hitEnter) {
            if (this.pairing) {
                $('body').trigger('START_PAIR');
                this.pairing = 0;
            }

            if ($(active).attr('data-action') && this[$(active).attr('data-action')]) {
                this[$(active).attr('data-action')](active, hitEnter);
            }
            else if ($(active).attr('data-route')) {
                require(["platform/router"], function (router) {
                    var route = $(active).attr('data-route');
                    router.getApp().navigate(route, {trigger: true});
                })
            }
        },

        applyHoverAction: function (active) {
            var self = this;

            if ($(active).attr('data-hover-action') && this[$(active).attr('data-hover-action')]) {
                this[$(active).attr('data-hover-action')](active);
            }
        },

        onViewLoad: function(callback) {
            if (callback && _.isFunction(callback)) {
                callback();
            }
        },

        viewLoaded: function (callback) {
            if (callback && _.isFunction(callback)) {
                callback();
            }
        },

        unloadView: function (callback) {
            if (callback && _.isFunction(callback)) {
                callback();
            }
        },

        onClose: function () {
            console.log('onClose');

            this.OmnitureAnalyticsHelper.setAction("Exit Application", true);

            if (this.browserPlatformHelper.isExperienceOnEmulator() || (this.app && this.app.debug)) {
                // This following call is necessary to close the experience on the Comcast Set Top Box
                this.app.popView();
            } else {
                // This following call is necessary to close the experience on webkit based devices with the NextGen app
                NativeBridge.AppShutdown();
            }
        },

        shutDownHandler: function (transition) {
            if (this.superView) {
                if (this.superView.removeSubView && _.isFunction(this.superView.removeSubView)) {
                    this.superView.removeSubView();
                }
            } else {
                if (this.app.viewStack.length === 1) {
                    if (this.onClose && _.isFunction(this.onClose)) {
                        this.onClose();
                    }
                } else if (this.app.viewStack.length > 1) {
                    this.app.popView(null, null, transition);
                }
            }
        },

        onBackButtonPressed: function (transition) {
            var self = this;

            if (this.fm.blockKeyDown || this.fm.ignoreEnter) {
                return;
            }

            console.log('onBackButtonPressed');

            if (this.unloadView && _.isFunction(this.unloadView)) {
                this.unloadView(function(){
                    self.shutDownHandler(transition);
                });
            } else {
                self.shutDownHandler(transition);
            }
        },

        /* Helper Objects and Methods */

        setEnabled: function(selector, enabled) {
            if (enabled) {
                $(selector, this.el).removeAttr('data-disabled');
            } else {
                $(selector, this.el).attr('data-disabled', 'true');
            }
        },

        updateMobileView: function () {
            var self = this;
            if (!this.browserPlatformHelper.isExperienceOnEmulator() && !(this.app && this.app.debug)) {
                setTimeout(function () {
                    $('.focusable', self.el).addClass('mobileView');
                });
            }
        },

        fadeInAudioElementWithSrcAndDuration: function (audioEl, src, duration, start) {
            audioEl.volume = 0;
            if (start) {
                audioEl.src = this.baseUrl + src;
            }
            audioEl.play();
            $(audioEl).animate({volume: 1}, duration);
        },

        fadeOutAudioElementWithSrcAndDuration: function (audioEl, duration) {
            $(audioEl).animate({volume: 0}, duration, function() {
                audioEl.pause();
            });
        },

        // Random integer helper method
        randomIntFromInterval: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },

        browserPlatformHelper: BrowserPlatformHelper,
        isMobileBrowser: $.browser.mobile,
        isTouchDevice: BrowserPlatformHelper.isExperienceOniPad() || $.browser.mobile,

        getClassFor: function(viewName) {
            if(BrowserPlatformHelper.isExperienceOnEmulator()) {
                return viewName;
            }
            else if(this.isMobileBrowser) {
                return viewName + " isTouchDevice isMobile";
            }
            else {
                return viewName + " isTouchDevice";
            }
        },

        // ASCII Key Codes for the keyboard (also used by
        // keys on most TV remotes)
        KEY_RIGHT: 39,
        KEY_LEFT: 37,
        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_ENTER: 13, // Ok button on the remote
        KEY_BACK: 8 // Last button on the remote
    });

    return {
        View: InteractiveComp
    }
});