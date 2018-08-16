// views/popup.js
define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/popup.html'
], function ($, _, Backbone, InteractiveComp, tmp) {

    var PopupView = InteractiveComp.View.extend({
        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);
            _.bindAll(this, "render");
            this.fm.firstElementIndex = "1,0";
            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
            this.listenTo(this.fm, 'keyUp', this.onKeyUp);
            this.isOverlay = false;
            this.noClose = options.noClose;
            this.debug = options.debug;
        },
        onAppAssociation: function (debug) {
            if (this.browserPlatformHelper.isExperienceOnEmulator() || (this.app && this.app.debug) || debug || this.noClose) {
                if (this.closeButton) {
                    this.setEnabled(this.closeButton[0], false);
                    this.closeButton.hide();
                }
                this.closeButtonClickableArea ? this.closeButtonClickableArea.hide() : null;
            } else {
                if (this.closeButton) {
                    this.setEnabled(this.closeButton[0], true);
                    this.closeButton.show();
                }
                this.closeButtonClickableArea ? this.closeButtonClickableArea.show() : null;
            }
        },
        arrowKeyCodes: [37, 38, 39, 40, 13, 8],
        events: {
            "click .close": "onBackButtonPressed",
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },
        onKeyDown: function (keyCode) {
            // if pressed key is not a navigation key pass it to nested view
            if (this.view && this.view.fm && (_.indexOf(this.arrowKeyCodes, keyCode) == -1 || !this.view.fm.getElementAt("0,0"))) this.view.fm.keyDown(keyCode);
        },
        onKeyUp: function (keyCode) {
            // if pressed key is not a navigation key pass it to nested view
            if (this.view && this.view.fm && (_.indexOf(this.arrowKeyCodes, keyCode) == -1 || !this.view.fm.getElementAt("0,0"))) this.view.fm.keyUp(keyCode);
        },
        setView: function (view) {
            if (this.view) {
                this.view.remove();
                this.stopListening(view, 'ACTIVATE_CLOSE', this.activateClose);
            }
            this.listenTo(view, "close", this.onBackButtonPressed);
            this.view = view;
            this.hasAudio = view.hasAudio;
            this.listenTo(view, 'ACTIVATE_CLOSE', this.activateClose);
        },
        setOverlayProperty: function(overlayPopup){
            this.isOverlay = overlayPopup;
            if(this.isOverlay){
                this.$('#popup-content').addClass('popup-overlay');
            }
        },
        getOverlayProperty: function () {
            return this.isOverlay;
        },
        onBackButtonPressed: function (data) {
            if (!this.closed) {
                var returnData;
                if (data && data.type === 'click') {
                    if (this.view && this.view.onClose) returnData = this.view.onClose();
                    data.stopPropagation();
                } else {
                    returnData = data;
                }
                this.trigger("close", returnData, null, { type: 'fade' });
                this.closed = true;
            } else {
                this.closed = false;
            }
        },

        remove: function () {
            if (this.view) this.view.remove();
            InteractiveComp.View.prototype.remove.call(this);
        },

        resume: function () {
            if (this.view && this.view.resume) this.view.resume();
        },
        activateClose: function () {
            this.view.fm.blur();
            this.fm.initFocus("0,0", 1, 1);
        },
        render: function () {
            var self = this;

            if (!this.view) throw("No view element for popup to render");
            $(this.el).html(_.template(tmp));

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.initFocusManager();

            this.$("#popup-content").html(this.view.el);

            if(this.isOverlay){
                this.$('#popup-content').addClass('popup-overlay');
            }

            if (this.view.noCloseOnRight) {
                this.$("#popup-content").attr("data-right-position", "");
            } else {
                this.$("#popup-content").attr("data-right-position", "0,0");
            }

            this.fm.addView(this.view);

            // if view doesnt have focusable element or skipAutoFocus is set to true, set the focus on close
            if (!this.view.fm.getElementAt("0,0") || this.view.skipAutoFocus) {
                this.fm.initFocus("0,0", 1);
            } else {
                this.fm.initFocus(null, 1);
            }
            return this;
        }
    });
    return PopupView;
});