define([
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/single_video_content/SingleVideoContent.html'
], function(InteractiveComp, template) {
    return InteractiveComp.View.extend({
        className: 'single-video-content-view popup-component',

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.app = options.app;
            this.experienceName = options.experienceName ? options.experienceName : "";
            this.singleVideoContent = options.singleVideoContent;
            this.showPoster = options.showPoster;
        },

        render: function() {
            $(this.el).html(_.template(template, { src: this.iframeSrc }));

            this.initFocusManager();

            this.closeButton = $('.close', this.el);
            this.closeButtonClickableArea = $('.close-button-clickable-area', this.el);

            this.videoEndPoster = $('#video-end-poster', this.el);

            setTimeout(function(){
                this.app.playContent(this.singleVideoContent);

                if (this.showPoster) {
                    this.videoEndPoster.show();
                }
            }.bind(this));

            return this;
        },

        resume: function () {
            if (!this.showPoster) {
                this.exitApp();
            }
        },

        exitApp: function() {
            if (this.app.viewStack.length > 1) {
                this.app.popView(null, null, { type: 'fade' });
            }
        },

        onBackButtonPressed: function() {
            if (!this.fm.blockKeyDown) {
                if (this.showPoster) {
                    this.OmnitureAnalyticsHelper.setAction("Exit The Mummy: " + this.experienceName + " Experience", true);
                }

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);
            }
        }
    });
});