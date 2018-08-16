/**
 * @author Zareh Boghozian <zareh.boghozian@bydeluxe.com>
 *
 * Additional contributions by:
 * Ratnesh Chandna <ratnesh@clearbridgemobile.com>
 */

'use strict';

define([
	'jquery',
    'underscore',
    'backbone'
], function($,_,Backbone) {
    var Preloader = function(options) {
        this.options = options;
        this.deferred = new $.Deferred();
        this.loadedCount = 0;
        this.failedCount = 0;
        _.bindAll(this,"imageLoaded","imageFailed");
        this.deferred.promise( this );
    }

    _.extend(Preloader.prototype, Backbone.Events, {
        load: function() {
            // if(this.state == "LOADING") return this.getPromise();
            this.state = "LOADING";
            var self = this;

            _.map(this.assets,function(asset) {
                if(!asset.done) {
                    var image = new Image();
                    image.onload = self.imageLoaded;
                    image.onerror = self.imageFailed;
                    image.src = asset.path.indexOf('http') == 0 ? asset.path :
                        !self.baseUrl ? asset.path : self.baseUrl + asset.path;
                    asset.done = true;
                }
            });

            // call validate here so if there is no assets resolve the promise immediately
            this.validate();
            return this.getPromise();
        },
        getPromise: function() {
            return this;
        },
        setAssets: function(assets) {
            var assetList = _.map(assets, function(asset){
                return { path: asset };
            });
            this.assets = this.assets ? this.assets.concat(assetList) : assetList;
            this.loadedCount = this.loadedCount ? this.loadedCount : 0;
            this.failedCount = this.failedCount ? this.failedCount : 0;
        },
        imageLoaded: function() {

            this.loadedCount++;


            this.validate();
        },
        imageFailed: function() {
            this.failedCount++;
            // if policy if strict send reject
            if(this.policy == "STRICT") {
                this.deferred.reject();
                //console.log("preloader.js: load failed");
                this.trigger("FAILED");
            }
            else this.validate();
        },
        validate: function() {

            var progress = !this.assets.length ? 100 : 100*(this.loadedCount + (this.policy != "STRICT" ? this.failedCount : 0 ) )/this.assets.length;
            this.trigger("PROGRESS", progress );

            if(this.loadedCount + this.failedCount == this.assets.length) {
                // if policy is strict and there is a loading error dont resolve
                if(this.policy != "STRICT" || !this.failedCount) {
                    this.deferred.resolve();
                    console.log("preloader.js: load complete");
                    this.trigger("COMPLETE");
                    this.state = "COMPLETE";
                }
            }
        }
    });

    return Preloader;

});