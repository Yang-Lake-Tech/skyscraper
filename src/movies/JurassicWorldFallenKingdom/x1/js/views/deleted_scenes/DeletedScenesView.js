define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'platform/views/contentList',
    'text!templates/deleted_scenes/DeletedScenesView.html',
    'text!experience/deleted_scenes.json'
], function($, _, Backbone, Hammer, InteractiveComp, ContentList, template, deletedScenesData) {
    return InteractiveComp.View.extend({
        className: 'deleted_scenes-view popup-component',

        events: {
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.superView = options.superView;
            this.experienceType = options.experienceType;

            this.contentItems =  JSON.parse(deletedScenesData);

            this.baseUrl = options.app.titleMetaData.title.base_url;

            this.deleted_ScenesClips = new ContentList({ contentList: this.contentItems, displayCount: 5, elementHeight:118, parent: this });

            this.listenTo(this.deleted_ScenesClips, "CONTENT_HIGHLIGHTED", this.onClipHighlight);
            this.listenTo(this.deleted_ScenesClips, "CONTENT_SELECTED", this.onClipSelect);

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);

            this.preloadImages = this.preloadImageAssets();
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Deleted Scenes Experience");
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        render: function() {
            var self = this;

            $(this.el).html(_.template(template, {}));

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.deleted_ScenesPanel = $('.deleted_scenes-panel', this.el);
            this.subtitle = $('#deleted_scenes-subtitle', this.el);

            this.contentItemsElement = $('#content-items', this.el);
            this.contentContainer = $('#content-container-area',this.el);

            this.fm.firstElementIndex = "1,0";
            this.initFocusManager();

            var clips = this.deleted_ScenesClips.render();
            this.$("#content-items").html(clips.el);
            this.fm.addView(this.deleted_ScenesClips);

            _.each(this.deleted_ScenesPanel, function (element) {
                Hammer(element).on('tap', function () {
                    this.onClipSelect(clips.getCurrentContent());
                }.bind(this));
            }.bind(this));

            this.onClipHighlight(this.deleted_ScenesClips.getCurrentContent());

            $('#start-experience').hide();

            return this;
        },

        resume: function() {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Deleted Scenes Experience ", true);
        },

        onClipHighlight: function(contentItem) {
            var self = this;

            var currentSelectIndex = this.contentItems.indexOf(contentItem);

            this.subtitle.fadeOut(200, function () {
                this.subtitle.css('background-image', 'url("' + this.baseUrl + contentItem.header_image + '")');
                this.subtitle.fadeIn(200);
            }.bind(this));

            if (!$(this.deleted_ScenesPanel[1]).is(':visible')) {
                $(self.deleted_ScenesPanel[1]).css('background-image', 'url("' + self.preloadImages[currentSelectIndex].src + '")');
                $(self.deleted_ScenesPanel[1]).fadeIn();
                $(self.deleted_ScenesPanel[0]).fadeOut();

            } else {
                $(self.deleted_ScenesPanel[0]).css('background-image', 'url("' + self.preloadImages[currentSelectIndex].src + '")');
                $(self.deleted_ScenesPanel[0]).fadeIn();
                $(self.deleted_ScenesPanel[1]).fadeOut();
            }

            if(this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setAction(contentItem.name + " is Highlighted", true);
            }
        },

        preloadImageAssets: function () {
            var images = [];
            for (var i = 0; i < this.contentItems.length; i++) {
                images[i] = new Image();
                images[i].src = this.baseUrl + this.contentItems[i].content_image;
            }
            return images;
        },

        onClipSelect: function(contentItem) {
            if (this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setAction(contentItem.name + " is Selected", true);
            }
            this.app.playContent(contentItem.video);

        },

        onBackButtonPressed: function() {
            if (!this.fm.blockKeyDown) {
                this.OmnitureAnalyticsHelper.setAction("Exit Pitch Perfect 3 Deleted Scenes Experience", true);

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);
            }
        }
    });
});
