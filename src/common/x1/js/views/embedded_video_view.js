"use strict";

define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/embedded_video.html'
], function($, _, Backbone, Hammer, InteractiveComp, template, RelatedView){
    return InteractiveComp.View.extend({
        id: 'video-content-view',

        //UM-49 Used to track the video duration, for use with the scrubber feature
        videoDuration: 0,

        initialize: function(options) {
            InteractiveComp.View.prototype.initialize.call(this, options);
            this.app = options.app;
            this.videoId = options.videoId;
            this.resume = options.resume;
            this.noCloseOnRight = options.noCloseOnRight;

            this.inTime = options.inTime;
            this.contentContainer = options.container;

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
            this.listenTo(this.fm, 'keyUp', this.onKeyUp);

            this.hasAudio = 1;
            this.fm.firstElementIndex = "0,0";
            _.bindAll(this, 'hideTimeline','showTimeline','canPlay');
            this.listenTo(this.fm,"mousemove",this.showTimeline);
            this.noRelatedContent = options.noRelatedContent;

            this.quarterCompleted = options.quarter || false;
            this.halfCompleted = options.half || false;
            this.threeQuartersCompleted = options.threeQuarters || false;
        },

        startAnalytics: function () {
            var videoName = _.findWhere(this.model.get('contents'), { id: this.videoId }).name;
            var videoURL = _.findWhere(this.model.get('contents'), { id: this.videoId }).metadata.video.url;
            this.OmnitureAnalyticsHelper.setPage("Full Screen Video Player" + (videoName ? (": " + videoName) : ""));
            this.OmnitureAnalyticsHelper.setType("video");
            this.OmnitureAnalyticsHelper.setVideoName(videoURL, true);
        },

        preload: true,

        onKeyDown: function(keyCode) {
            switch(keyCode) {
                case 179: // comcast play/pause button
                case 80: this.onPlayPause(); return true; // p
                case 70: this.onFastForward(); return true; // f
                case 82: this.onRewind(); return true; // r
                case 40: this.toggleTimeline(true); break; // down
                case 69: this.onSkipToEnd(); break; // e
                case 37: this.showTimeline(true);this.skip(-10); break;
                case 39: this.showTimeline(true);this.skip(10); break;
                case 13: this.onPlayPause(); break;
            }
        },

        onKeyUp: function(keyCode) {
            switch(keyCode) {
                case 37: this.stopScrubbing(); break;
                case 39: this.stopScrubbing(); break;
            }
        },

        render: function() {
            var self = this;

            $(this.el).html(_.template(template, {
                mediaUrl: this.url
            }));
            this.initFocusManager();
            this.timelineHidden = false;

            this.contentContainer.on('fullscreen', function () {
                console.log('embedded enter fullscreen');
                self.$('video-exit-fullscreen').removeAttr('data-disabled');
                self.app.activeFM = self.fm;
            });

            Hammer($('#video-timeline-thumb', this.el)[0]).on('panstart', function(event){
                self.showTimeline(false);
                self.pause();

                var initialPosition = $('#video-timeline', this.el)[0].offsetLeft - 54;
                self.dragStartPosition = $('#video-timeline-thumb', this.el)[0].getBoundingClientRect().left - initialPosition;
            });
            Hammer($('#video-timeline-thumb', this.el)[0]).on('panleft', function(event){
                var video = $('#video-plane', this.el)[0];
                var currentPosition = ((self.dragStartPosition + event.deltaX)/1920)*video.duration;
                self.updateTimelineThumb(currentPosition, video.duration);
                self.dragEndPosition = currentPosition;
            });
            Hammer($('#video-timeline-thumb', this.el)[0]).on('panright', function(event){
                var video = $('#video-plane', this.el)[0];
                var currentPosition = ((self.dragStartPosition + event.deltaX)/1920)*video.duration;
                self.updateTimelineThumb(currentPosition, video.duration);
                self.dragEndPosition = currentPosition;
            });
            Hammer($('#video-timeline-thumb', this.el)[0]).on('panend', function(event){
                self.playVideo(self.dragEndPosition);
                self.showTimeline(true);
            });

            return this;
        },

        exitFullscreen: function () {
            console.log('exit fullscreen');
            this.contentContainer.removeClass('fullscreen');
            this.$('video-exit-fullscreen').attr('data-disabled', 'true');
            this.contentContainer.trigger('exitFullscreen');
        },

        onPlayPause: function() {
            console.log("Play/Pause " + this.paused);
            var video = $('#video-plane');
            var rate = video[0].playbackRate;

            if (!this.paused) {
                if(rate != 1.0) {
                    video[0].defaultPlaybackRate = 1.0;
                    video[0].playbackRate = 1.0;
                } else {
                    this.pause();
                    this.showTimeline(false);
                    this.OmnitureAnalyticsHelper.setEvents("event25,event27=" + video[0].currentTime, true);
                }
            } else {
                this.hideTimeline();
                this.play();
                this.OmnitureAnalyticsHelper.setEvents("event26", true);
            }
        },

        onFastForward: function() {
            console.log('onFastForward');
            var video = $('#video-plane');
            video[0].playbackRate = 10.0;
        },

        onRewind: function() {
            console.log('onRewind');
            var video = $('#feature-video');
            video[0].playbackRate = -10;
        },

        play: function(id) {
            if(id) {
                var content = this.findContent(id);
                this.resetSource(id, encodeURI(content.assetName), 1, content.metadata.video.in_time || this.inTime, content.metadata.video.out_time);
            } else {
                this.playVideo();
            }
        },

        resetSource: function(id, url, duration, in_time, out_time) {
            var self = this;

            this.clearEventHandlers();

            if(id) {
                var video = this.$('#video-plane');
                this.videoId = id;
                this.url = url;
                this.duration = duration;
                this.in_time = in_time;
                this.out_time = out_time;
                video.attr("src", this.url);
                video[0].currentTime = in_time || 0;
                self.$('#video-timeline-thumb').addClass('no-animate');
                $('#video-timeline-thumb').css({'-webkit-transform': 'translateX(0px)'});
                this.updateTimelineThumb(0, 1); // set the timeline to the beginning
            }

            _.delay(function() {
                self.playVideo();
                self.showTimeline(true);

                self.OmnitureAnalyticsHelper.setEvents("event20", true);
            });
        },

        playVideo: function(time) {
            this.paused = false;
            var video = $('#video-plane')[0];
            var self = this;

            if(time || time === 0) {
                video.currentTime = time;
            }

            video.playbackRate = 1.0;
            video.play();

            // start timer to generate timecode events
            this.timeUpdateHandler = function() { self.onTick(); };
            this.endedHandler = function() { self.onEnded(); };
            video.addEventListener('timeupdate', this.timeUpdateHandler, false);
            video.addEventListener('ended', this.endedHandler, false);
            video.addEventListener("canplay",this.canPlay,false);

            this.fixTick = setInterval(function(){
                self.onTick();
            }, 30);

            this.$('#video-timeline-thumb').removeClass('no-animate');
        },

        canPlay: function() {
            var video = $('#video-plane')[0];
            this.deferred.resolve();
            video.removeEventListener("canplay",this.canPlay,false);
        },

        playUrl: function (url) {
            this.resetSource('0000', url, 1);
        },

        clearEventHandlers: function() {
            var video = this.$('#video-plane')[0];
            clearInterval(this.fixTick);
            if(this.timeUpdateHandler) {
                video.removeEventListener('timeupdate', this.timeUpdateHandler, false);
                this.timeUpdateHandler = undefined;
            }
            if(this.endedHandler) {
                video.removeEventListener('ended', this.endedHandler, false);
                this.endedHandler = undefined;
            }
        },

        pause: function() {
            this.paused = true;
            var video = $('#video-plane')[0];
            if(video){
                video.pause();
            }
            this.clearEventHandlers();
        },

        toggleTimeline: function(autoHide) {
            if(this.timelineHidden) {
                this.showTimeline(autoHide);
            } else {
                this.hideTimeline();
            }
        },

        onTick: function() {
            var video = $('#video-plane')[0];
            this.updateTimelineThumb(video.currentTime, video.duration);
            if(this.out_time && video.currentTime > this.out_time) {
                this.onEnded();
            }

            if (!this.quarterCompleted && video.currentTime >= 0.25*video.duration) {
                this.OmnitureAnalyticsHelper.setEvents("event22,event27=" + video.currentTime, true);
                this.quarterCompleted = true;
            } else if (!this.halfCompleted && video.currentTime >= 0.5*video.duration) {
                this.halfCompleted = true;
                this.OmnitureAnalyticsHelper.setEvents("event23,event27=" + video.currentTime, true);
            } else if (!this.threeQuartersCompleted && video.currentTime >= 0.75*video.duration) {
                this.threeQuartersCompleted = true;
                this.OmnitureAnalyticsHelper.setEvents("event24,event27=" + video.currentTime, true);
            }
        },

        updateTimelineThumb: function(currentTime, duration) {
            if(!duration) {
                return; // avoid issue with undefined, NaN, or 0 duration
            }

            this.videoDuration = duration;

            if(this.in_time && this.out_time) {
                currentTime -= this.in_time;
                duration = this.out_time - this.in_time;
            }
            currentTime = Math.max(0, Math.min(currentTime, duration)); // clamp current time between 0 and duration

            var dx = (currentTime / duration) * 1067;
            $('#video-timeline-thumb').css({'-webkit-transform': 'translateX(' + dx + 'px)'});
            $('#video-completed').css('width', (dx+5)+'px');
            var min = Math.floor(currentTime / 60).toString(10);
            var sec = Math.floor(currentTime % 60).toString(10);

            if(sec < 10)
                sec = "0" + sec;
            $('#video-timecode').text(min + ":" + sec);

        },

        showTimeline: function(autoHide) {
            if(autoHide) {
                clearTimeout(this.hideTimeCode);
                this.hideTimeCode = setTimeout(this.hideTimeline,3000);
            } else {
                clearTimeout(this.hideTimeCode);
            }
            console.log('show timeline');
            this.timelineHidden = false;
            $('#ui-layer').fadeIn();
        },

        hideTimeline: function() {
            console.log('hide timeline');
            this.timelineHidden = true;
            $('#ui-layer').fadeOut();
        },

        onEnded: function() {
            clearInterval(this.fixTick);
            this.stopScrubbing();
            this.pause();
            this.OmnitureAnalyticsHelper.setEvents("event21", true);
            if (this.contentContainer.hasClass("fullscreen")){
                this.exitFullscreen();
            }
            this.contentContainer.html('');
            this.contentContainer.trigger('videoRemoved');
            this.OmnitureAnalyticsHelper.setEvents("event21", true);
        },

        findContent: function(id) {
            var contents = this.model.get('contents');

            for(var i = 0, n = contents.length; i < n; i++) {
                if(contents[i].id == id)
                    return contents[i];
            }

            return undefined;
        },

        onSkipToEnd: function() {
            this.onEnded();
        },

        onBackButtonPressed: function(){
            if(this.contentContainer.hasClass("fullscreen")) {
                this.exitFullscreen();
            }
            InteractiveComp.View.prototype.onBackButtonPressed.call(this);
        },

        onClose: function() {
            clearInterval(this.fixTick);
            this.stopScrubbing();
            this.pause();

            this.OmnitureAnalyticsHelper.setAction("Exit Full Screen Video Player", true);

            if(this.contentContainer.hasClass("fullscreen")) {
                this.exitFullscreen();
            }
        },

        startScrubbing: function(direction) {
            if(this.timer)
                return;

            var self = this;
            this.timer = setInterval(function() {
                self.skip(10 * direction);
            }, 250);
            this.skip(10 * direction);
        },

        stopScrubbing: function() {
            if(this.timer) {
                clearInterval(this.timer);
                this.timer = undefined;
            }
        },

        //UM-49, adding new function to skip right to the tapped point on the scrub bar
        //(Instead of additively scrubbing forward). Also allows hiding of the timeline.
        //
        //@param second - (Required) Point during the video to move to, in seconds
        //
        //@param hideTimelineFunc - (Optional) Function to hide the timeline
        //
        //@param hideTimelineDelay - (Optional) Delay before the timeline is hidden, in seconds
        scrubTo: function(second, hideTimelineFunc, hideTimelineDelay){
            var video = $('#video-plane')[0];
            // clamp time between 0 and duration
            if(!video.duration) {
                video.currentTime = 0;
            } else {
                video.currentTime = Math.min(second, video.duration);
            }
            this.onTick();

            if (hideTimelineFunc){
                setTimeout(hideTimelineFunc, hideTimelineDelay != null
                                                                ? (hideTimelineDelay * 1000)
                                                                : 0);
            }
        },

        skip: function(seconds) {
            var video = $('#video-plane')[0];
            // clamp time between 0 and duration
//            console.log(newTime);
            if(!video.duration) {
                video.currentTime = 0;
            } else {
                video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration);
            }
            this.onTick();
        },

        remove: function() {
            var video = this.$('#video-plane')[0];

            this.clearEventHandlers();
            video.src = '';
            if (this.contentContainer.hasClass("fullscreen")){
                this.exitFullscreen();
            }
            this.contentContainer.html('');
            this.contentContainer.trigger('videoRemoved');
        }
    });
});/**
 * Created by michelleli on 2017-05-19.
 */
