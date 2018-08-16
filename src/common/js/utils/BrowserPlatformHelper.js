// BrowserPlatformHelper.js
define([], function(){
    return {
        // Determines if the experience is being viewed from the ComCast's set top box (Chromium browser)
        isExperienceOnEmulator: function () {
            return navigator.userAgent.match(/CrOS/i) || navigator.userAgent.match(/M-Theory-Chromium/i)
        },

        // Determines if the experience is being viewed on an iPhone
        isExperienceOniPhone: function() {
            return navigator.platform.match(/iPhone/i);
        },

        // Determines if the experience is being viewed on an iPod
        isExperienceOniPod: function() {
            return navigator.platform.match(/iPod/i);
        },

        // Determines if the experience is being viewed on an iPad
        isExperienceOniPad: function() {
            return navigator.platform.match(/iPad/i);
        },

        // Determines if the experience is being viewed on an Android, Linux or Chrome OS device
        isExperienceOnAndroidOrLinuxOrChromeOS: function() {
            return navigator.platform.match(/Linux/i) ||
                navigator.platform.match(/Android/i) ||
                navigator.platform === null;
        },

        // Determines if the experience is being viewed on a Blackberry
        isExperienceOnBlackberry: function() {
            return navigator.platform.match(/Blackberry/i);
        },

        // Determines if the experience is being viewed on a Mac or PC browser
        isExperienceOnAMacOrPCBrowser: function() {
            return navigator.platform.match(/MacIntel/i) ||
                navigator.platform.match(/Macintosh/i) ||
                navigator.platform.match(/MacPPC/i) ||
                navigator.platform.match(/Win32/i) ||
                navigator.platform.match(/Windows/i);
        },

        isExperienceOnMozillaOS: function() {
            return navigator.platform === '';
        }
    };
});