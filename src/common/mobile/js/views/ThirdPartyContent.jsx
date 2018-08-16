define([
    'react',
    'reactDOM',
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'mobilelib/views/mobileView'
], function (React, ReactDOM, $, _, Backbone, Hammer, MobileView) {
    return MobileView.extend({
        className: MobileView.prototype.className + ' ' + 'third-party-content-view',

        initialize: function (options) {
            this.pageName = "The Mummy Mobile Hub Third Party Content Page";

            MobileView.prototype.initialize.call(this, options);
        },

        render: function () {
            MobileView.prototype.render.call(this);

            ReactDOM.render(
                <div ref={ (comp) => { this.ThirdPartyContentView = comp; } }>
                    <iframe src=""/>
                    <div className="third-party-content-close"/>
                </div>,
                $('.page-contents', this.el)[0]
            );

            this.$iframe = $(ReactDOM.findDOMNode(this.ThirdPartyContentView)).find('iframe');
            this.$iframeCloseButton = $(ReactDOM.findDOMNode(this.ThirdPartyContentView)).find('.third-party-content-close');

            window.addEventListener("message", function (e) {
                switch (e.data.msg) {
                    case 'loading':
                        if (e.data.params[0] < 100) {
                            this.app.showProgress(e.data.params[0]);
                        } else {
                            this.onThirdPartyAppLoadCompletion();
                        }
                        break;
                    case 'exit_third_party_app':
                        this.close();
                        break;
                    default:
                        break;
                }
            }.bind(this));

            Hammer(this.$iframeCloseButton[0]).on('tap', function () {
                this.close();
            }.bind(this));

            this.deferred.resolve();

            return this;
        },

        resume: function (resumeData) {
            if (resumeData && resumeData.metadata && resumeData.metadata.mobile) {
                this.hasHamburgerMenu = resumeData.metadata.mobile.has_hamburger_menu;
            }

            if (this.hasHamburgerMenu) {
                this.hamburgerMenuSelectedItem = resumeData.metadata.mobile.selected || "";
                this.isTitlePanelOpaque = resumeData.metadata.mobile.isTitlePanelOpaque;
            }

            this.handlesOrientations = resumeData.metadata.mobile.handles_orientations ?
                resumeData.metadata.mobile.handles_orientations.split(',') :
                [ "portrait" ];

            MobileView.prototype.resume.call(this);

            if (resumeData && resumeData.metadata) {
                this.showLoaders(true);

                if (resumeData.metadata.close_button) {
                    this.$iframeCloseButton.show();
                } else {
                    this.$iframeCloseButton.hide();
                }
                this.$iframe.attr('src', resumeData.metadata.iframe_src);
            }
        },

        onThirdPartyAppLoadCompletion: function () {
            // This hack is necessary to ensure non responsive third party views
            // 'appear' responsive
            $('meta[name="viewport"]').attr('content', 'width=1280, user-scalable=no');

            setTimeout(function(){
                this.$iframe.show();
                this.showLoaders(false);
            }.bind(this));
        },

        suspend: function () {
            MobileView.prototype.suspend.call(this);

            this.$iframeCloseButton.hide();
            this.$iframe.hide();

            this.$iframe.attr('src', '');

            // This hack is necessary to ensure non responsive third party views
            // 'appear' responsive
            $('meta[name="viewport"]').attr('content', 'width=device-width, user-scalable=no');
        },

        close: function () {
            this.suspend();

            this.app.popView();
        }
    });
});