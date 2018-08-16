/**
 * Created by michelleli on 2017-07-17.
 */
define([
    'backbone',
    'common/js/utils/OmnitureAnalyticsHelper',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/third_party/ThirdPartyView.html'
], function(Backbone, OmnitureAnalyticsHelper, InteractiveComp, template) {
    return InteractiveComp.View.extend({
        className: 'third-party-view popup-component',

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.app = options.app;
            this.experienceName = options.experienceName ? options.experienceName : "";
            this.childLevel = options.childLevel;
            this.iframeSrc = options.src;
            this.iframeDomain = options.domain;
            this.showCloseButton = options.closeButton;
            this.ack_hub_presence_sent = false;

            this.awaitsExternalProgress = true;
        },

        onAppAssociation: function (debug) {
            if (!this.showCloseButton) {
                this.setEnabled(this.closeButton[0], false);
                this.closeButton.hide();
                this.closeButtonClickableArea ? this.closeButtonClickableArea.hide() : null;
            } else {
                InteractiveComp.View.prototype.onAppAssociation.apply(this, Array.prototype.slice.call(arguments));
            }
        },

        startAnalytics: function() {
            this.OmnitureAnalyticsHelper.startSessionOnPage(this.experienceName);
        },

        render: function() {
            $(this.el).html(_.template(template, { src: this.iframeSrc }));

            this.initFocusManager();

            this.closeButton = $('.close', this.el);
            this.closeButtonClickableArea = $('.close-button-clickable-area', this.el);

            this.$iframe = $('iframe[name="usm-third-party-content-view"]', this.el);

            $('#start-experience').hide();

            setTimeout(this.setupIframeCommunication.bind(this));

            return this;
        },

        setupIframeCommunication: function () {
            this.app.showProgress(0, "internal");

            // The child iframe needs to call postMessage for this listener to get called.
            // Example:
            // window.parent.postMessage({ msg: 'loading', params: [ 50 ] }, 'http://nxg-frontend.uphe.com/');
            window.addEventListener("message", function (e) {
                if (!this.ack_hub_presence_sent) {
                    this.$iframe[0].contentWindow.postMessage("ack_hub_presence", this.iframeDomain);
                    this.ack_hub_presence_sent = true;
                }

                switch (e.data.msg) {
                    case 'loading':
                        this.app.showProgress(e.data.params[0], "external");
                        break;
                    case 'exit_third_party_app':
                        this.exitApp();
                        break;
                    default:
                        break;
                }
            }.bind(this));
        },

        onBackButtonPressed: function () {
            if (!this.fm.blockKeyDown) {
                this.OmnitureAnalyticsHelper.setAction("Exit " + this.experienceName, true);

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);
            }
        },

        exitApp: function() {
            if ((this.app.viewStack.length - (this.app.asyncPopViewCallCount ? this.app.asyncPopViewCallCount : 0)) >
                (this.childLevel - 1)) {
                this.OmnitureAnalyticsHelper.setAction("Exit " + this.experienceName, true);
                this.app.popView(null, null, { type: 'fade' });
            }
        }
    });
});