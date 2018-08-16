define([
	'jquery',
	'underscore',
	'backbone'
], function($,_,Backbone) {
    var Helper = function() {
        this.initialize.apply(this, arguments);
    }
    _.extend(Helper.prototype, Backbone.Events, {
        initialize: function(token) {
            var self = this;
            this.token = token;
            this.socket = io("http://mobile.theplatform.services:80/",{timeout: 0 });
            this.socket.on('connect', this.connected);                                 
            this.socket.on('disconnect', function (){console.log('disconnected'); self.trigger("STATUS_UPDATE",0); self.trigger("disconnect"); });
            this.socket.on("message", this.messageHandler);
            this.socket.on("controlAdded", this.controlAdded);
            this.socket.emit("init", token);
        },
        connected: function() {
            debugger
            this.trigger("STATUS_UPDATE",1);
            this.trigger("connect");
            
        },
        controlAdded: function() {
            this.trigger("controlAdded");
        },
        messageHandler: function(e) {
            this.trigger("message",e);
        },
        getSocket: function() {
            // TODO: helper should project all the neccessary methods
            return this.socket;
        },
        emit: function() {
            this.token.emit.apply(this, Array.slice(arguments));
        },
        connect: function(token) {
        }
    });
    return Helper;

});