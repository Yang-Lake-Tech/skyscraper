define([
    'react',
    'reactDOM',
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'common/js/utils/preloader',
    'common/js/utils/OmnitureAnalyticsHelper',
    'orientationHelper',
    'mobilelib/components/HamburgerMenu/HamburgerMenu',
    'text!experience/hub.json',
    'common/js/utils/CONSTANTS',
    'common/mobile/js/components/HamburgerMenu/HAMBURGER_MENU_STATE_CONSTANTS'
], function (React, ReactDOM, $, _, Backbone, Hammer, Preloader, OmnitureAnalyticsHelper, OrientationHelper, HamburgerMenu, MenuItems, CONSTANT, HAMBURGER_MENU_STATE) {

    const eventBus = _({}).extend(Backbone.Events);

    return Backbone.View.extend({
        className: 'page-view',

        initialize: function (options) {
            this.app = options.app;
            this.assetType = options.assetType;
            this.experienceName = options.experienceName;

            if (options && !options.noAnalytics) {
                this.OmnitureAnalyticsHelper = new OmnitureAnalyticsHelper(
                    { titleMetaData: this.app.movieMetadata },
                    options && options.experienceName ? options.experienceName : null
                );
            }

            this.preloader = new Preloader();

            this.playsIntroVideo = options.playsIntroVideo;
            this.startExperience = $('#start-experience');
            if (this.playsIntroVideo) {
                this.startExperience.show();
            }

            this.loadingBackground = $('#loading-background');
            this.loadingBackground.show();

            this.hasHamburgerMenu = options.metadata.mobile.has_hamburger_menu;
            if (this.hasHamburgerMenu) {
                this.hamburgerMenuTitle = options.metadata.mobile.title;
                this.hamburgerMenuItems = JSON.parse(MenuItems);
                this.hamburgerMenuSelectedItem = options.metadata.mobile.selected || "";
                this.isTitlePanelOpaque = options.metadata.mobile.isTitlePanelOpaque;
            }

            this.handlesOrientations =
                options.metadata.mobile.handles_orientations ?
                    options.metadata.mobile.handles_orientations.split(',') :
                    [ "portrait" ];

            this.deferred = $.Deferred();
            this.deferred.promise(this);
            this.done(this.viewDidLoad.bind(this));
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage(this.pageName);
            this.OmnitureAnalyticsHelper.setExperience(this.experienceName);
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        render: function () {
            this.$el.append("<div class=\"page-body\"></div>");

            if (this.hasHamburgerMenu) {
                ReactDOM.render(
                    <HamburgerMenu
                        router={this.app}
                        menuItems={this.hamburgerMenuItems}
                        ref={(comp) => {
                            this.HamburgerMenu = comp;
                        }}
                    />,
                    this.$el.find('.page-body')[0]
                );
            }

            this.$el.find('.page-body').append("<div class=\"page-contents\"></div>");

            let reRender = false;
            if (this.hamburgerMenuTitle) {
                this.HamburgerMenu.setTitle(this.hamburgerMenuTitle);
                reRender = true;
            }
            if (this.hamburgerMenuSelectedItem) {
                this.HamburgerMenu.setSelectedItem(this.hamburgerMenuSelectedItem);
                reRender = true;
            }
            if (this.isTitlePanelOpaque) {
                this.HamburgerMenu.setTitlePanelTransparency(HAMBURGER_MENU_STATE.TITLE_PANEL_STATE.OPAQUE);
                reRender = true;
            }

            reRender ? this.HamburgerMenu.setState() : null;
        },

        showLoaders: function (show) {
            if (show) {
                if (!this.playsIntroVideo) {
                    this.startExperience.show();
                }
                this.loadingBackground.show();
            } else {
                if (!this.playsIntroVideo) {
                    this.startExperience.hide();
                }
                this.loadingBackground.hide();
            }
        },

        viewDidLoad: function () {
            this.showLoaders(false);
        },

        setBackgroundUrl(url_16x9, url_3x2) {
            let aspectRatio = OrientationHelper.determineAspectRatio(window.screen.width, window.screen.height);

            if (aspectRatio === CONSTANT.ASPECT_RATIO._16x9) {
                this.backgroundUrl = url_16x9;
            } else if (aspectRatio === CONSTANT.ASPECT_RATIO._3x2) {
                this.backgroundUrl = url_3x2;
            }
        },

        handleOrientationChange: function () {
            let supportedOrientation = this.handlesOrientations.find(function(orientation){
                return OrientationHelper.getScreenOrientation() === orientation
            }.bind(this));
            if (!supportedOrientation) {
                if (this.hasHamburgerMenu) {
                    if ($('.hamburger-menu', this.el).is(':visible')) {
                        $('.hamburger-menu', this.el).hide();
                    }
                }

                $('#change-device-orientation').show();
            } else {
                if (this.hasHamburgerMenu) {
                    if (!$('.hamburger-menu', this.el).is(':visible')) {
                        $('.hamburger-menu', this.el).show();
                    }
                }
                $('#change-device-orientation').hide();
            }
        },

        resume: function () {
            this.handleOrientationChange();

            OrientationHelper.setHandler(this.handleOrientationChange.bind(this));

            if (this.hasHamburgerMenu) {
                this.HamburgerMenu.setSelectedItem(this.hamburgerMenuSelectedItem);
                this.HamburgerMenu.setState();
            }
        },

        suspend: function() {
            if (this.hasHamburgerMenu) {
                if (this.HamburgerMenu.state.menuState === HAMBURGER_MENU_STATE.MENU_STATE.EXPANDED) {
                    this.HamburgerMenu.close();
                }
            }
        },

        /* Helper Methods */
        getTargetByMobileViewName: function(mobileViewName) {
            return _.findWhere(this.app.movieMetadata.content, { mobile_view_name: mobileViewName });
        },

        getTargetByName: function(name) {
            return _.findWhere(this.app.movieMetadata.content, { name: name });
        }
    });
});