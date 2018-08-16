require.config({
    paths: {
        jquery: 'common/js/jquery-1.12.4.min',
        underscore: 'common/js/underscore-min',
        backbone: 'common/js/backbone-min',
        hammer: 'common/js/hammer.min',
        three: 'common/x1/js/libs/three.min',
        mobileDetector: 'common/js/utils/mobileDetector',
        nextGenSCode: 'common/js/NextGenSCode',
        text: 'common/js/text',
        platform: 'common/x1/js',
        platformLib: 'common/x1/js/main-dev',
        platformTemplate: 'common/x1',
        templates: 'movies/JurassicWorldFallenKingdom/x1/templates',
        experience: 'movies/JurassicWorldFallenKingdom/x1',
        staticPath: './',
        tween: 'common/js/tween'
    }
});

require([
    'jquery',
    'underscore',
    'platform/Platform',
    'experience/js/experience-main'
], function($, _, Platform, main) {
    var defaultRoutes = {
        ':id': 'playContent',
        ':id/': 'playContent',
        ':id/*path': 'fallbackRoute'
    };

    var TitleRouter = Platform.Router.extend({
        playContentItem: function (contentItem, bookmark) {
            if (_.isFunction(main)) {
                main.apply(this, Array.prototype.slice.call(arguments));
            } else {
                main.experienceLoader.apply(this, Array.prototype.slice.call(arguments));
            }

            //If on comcast Cromium OS - disable x button
            if (navigator.userAgent.match(/CrOS/i) || navigator.userAgent.match(/M-Theory-Chromium/i)) {
                $('.close').attr("data-disabled", true).hide();
            }
        }
    });

    var router = new TitleRouter({
        routes: _.extend(main.routes || {}, defaultRoutes)
    });

    router.loadTitleById('FA206793-AB0A-4B1D-8761-D618331F07EB'); // This is an arbitrary GUID (no need to change this)
});