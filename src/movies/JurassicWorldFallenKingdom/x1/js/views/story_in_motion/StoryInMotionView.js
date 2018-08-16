define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'platform/views/contentList',
    'text!templates/story_in_motion/StoryInMotionView.html',
    'text!experience/story_in_motion.json'
], function($, _, Backbone, Hammer, InteractiveComp, ContentList, template, storyInMotionData) {
    return InteractiveComp.View.extend({
        className: 'story_in_motion-view popup-component',

        events: {
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.superView = options.superView;
            this.experienceType = options.experienceType;

            this.contentItems =  JSON.parse(storyInMotionData);

            this.baseUrl = options.app.titleMetaData.title.base_url;

            this.story_In_MotionClips = new ContentList({ contentList: this.contentItems, displayCount: 3, elementHeight:118, parent: this });

            this.listenTo(this.story_In_MotionClips, "CONTENT_HIGHLIGHTED", this.onClipHighlight);
            this.listenTo(this.story_In_MotionClips, "CONTENT_SELECTED", this.onClipSelect);

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);

            this.preloadImages = this.preloadImageAssets();
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Story In Motion Experience");
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        render: function() {
            var self = this;

            $(this.el).html(_.template(template, {}));

            this.preload = $('#preload', this.el);

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.story_In_MotionPanel = $('.story_in_motion-panel', this.el);
            this.subtitle = $('#story_in_motion-subtitle', this.el);

            this.contentItemsElement = $('#content-items', this.el);
            this.contentContainer = $('#content-container-area',this.el);

            this.fm.firstElementIndex = "1,0";
            this.initFocusManager();

            var clips = this.story_In_MotionClips.render();
            this.$("#content-items").html(clips.el);
            this.fm.addView(this.story_In_MotionClips);

            _.each(this.story_In_MotionPanel, function (element) {
                Hammer(element).on('tap', function () {
                    this.onClipSelect(clips.getCurrentContent());
                }.bind(this));
            }.bind(this));

            this.onClipHighlight(this.story_In_MotionClips.getCurrentContent());

            $('#start-experience').hide();

            return this;
        },

        resume: function() {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Story In Motion Experience ", true);
        },

        onClipHighlight: function(contentItem) {
            var self = this;

            var currentSelectIndex = this.contentItems.indexOf(contentItem);

            this.subtitle.fadeOut(200, function () {
                this.subtitle.css('background-image', 'url("' + this.baseUrl + contentItem.header_image + '")');
                this.subtitle.fadeIn(200);
            }.bind(this));

            if (!$(this.story_In_MotionPanel[1]).is(':visible')) {
                $(self.story_In_MotionPanel[1]).css('background-image', 'url("' + self.preloadImages[currentSelectIndex].src + '")');
                $(self.story_In_MotionPanel[1]).fadeIn();
                $(self.story_In_MotionPanel[0]).fadeOut();
            } else {
                $(self.story_In_MotionPanel[0]).css('background-image', 'url("' + self.preloadImages[currentSelectIndex].src + '")');
                $(self.story_In_MotionPanel[0]).fadeIn();
                $(self.story_In_MotionPanel[1]).fadeOut();
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
                this.OmnitureAnalyticsHelper.setAction("Exit Pitch Perfect 3 Story In Motion Experience", true);

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);
            }
        }
    });
});
