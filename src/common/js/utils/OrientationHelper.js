// OrientationHelper.js
define([
    'underscore',
    'common/js/utils/CONSTANTS'
], function(_, CONSTANT) {
    return {
        init: function () {
            window.addEventListener("orientationchange", function() {
                if (_.isFunction(this.handler)) {
                    this.handler();
                }
                window.scrollTo(0,0);
            }.bind(this));
        },

        setHandler: function (fn) {
            if (_.isFunction(fn)) {
                this.handler = fn;
            }
        },

        /* Helper Methods */
        getScreenOrientation: function () {
            if (window.screen.orientation) {
                return window.screen.orientation.type.includes("portrait") ? "portrait" :
                    (window.screen.orientation.type.includes("landscape") ? "landscape" :
                        window.screen.orientation.type);
            } else if (window.orientation || window.orientation === 0) {
                return window.orientation === 0 ? "portrait" :
                    (((window.orientation === 90) || (window.orientation === -90)) ? "landscape" : "portrait");
            }
        },

        determineAspectRatio: function (width, height) {
            const DECIDING_CONSTANT = (CONSTANT.ASPECT_RATIO._16x9 + CONSTANT.ASPECT_RATIO._3x2) /2;

            if (height/width > DECIDING_CONSTANT) {
                return CONSTANT.ASPECT_RATIO._16x9;
            } else if (height/width <= DECIDING_CONSTANT) {
                return CONSTANT.ASPECT_RATIO._3x2;
            }
        }
    }
});