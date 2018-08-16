// Platform 1.0.0
define([
    'jquery',
    'underscore',
    'backbone',
    'platform/router',
    'platform/views/interactiveComp',
    'platform/views/textPopupContent'
], function($, _, Backbone, Router, InteractiveComponent, TextPopup){
    return {
        Router: Router.PlatformRouter,
        getApp: Router.getApp,
        InteractiveComp: InteractiveComponent,
        $: $,
        _: _,
        Backbone: Backbone,
        TextPopup: TextPopup
    }
});