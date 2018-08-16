"use strict";

define(['react', 'reactDOM', 'jquery', 'underscore', 'backbone', 'hammer', 'orientationHelper', 'mobilelib/views/mobileView', 'common/mobile/js/components/VideoPlayer/VideoPlayer'], function (React, ReactDOM, $, _, Backbone, Hammer, OrientationHelper, MobileView, VideoPlayer) {
    return MobileView.extend({
        className: MobileView.prototype.className + ' ' + 'video-view',

        //UM-49 Used to track the video duration, for use with the scrubber feature
        videoDuration: 0,

        initialize: function initialize(options) {
            MobileView.prototype.initialize.call(this, options);

            this.handlesOrientationChange = false;

            this.quarterCompleted = false;
            this.halfCompleted = false;
            this.threeQuartersCompleted = false;
        },

        startAnalytics: function startAnalytics() {
            this.OmnitureAnalyticsHelper.setPage("Full Screen Video Player" + (this.videoName ? ": " + this.videoName : ""));
            this.OmnitureAnalyticsHelper.setType("video");
            this.OmnitureAnalyticsHelper.setVideoName(this.videoUrl);
        },

        preload: true,

        render: function render() {
            var _this = this;

            var self = this;

            MobileView.prototype.render.call(this);

            ReactDOM.render(React.createElement(VideoPlayer, {
                src: this.videoUrl,
                ref: function ref(comp) {
                    _this.VideoPlayer = comp;
                } }), $('.page-contents', this.el)[0]);

            this.videoElement = $(ReactDOM.findDOMNode(this.VideoPlayer)).find('#video-plane')[0];
            this.videoCloseButtonHitBox = $(ReactDOM.findDOMNode(this.VideoPlayer)).find('#close-video-player-hit-box')[0];
            this.videoCloseButton = $(ReactDOM.findDOMNode(this.VideoPlayer)).find('#close-video-player')[0];
            this.videoTimeline = $(ReactDOM.findDOMNode(this.VideoPlayer)).find('#video-timeline')[0];
            this.videoTapZone = $(ReactDOM.findDOMNode(this.VideoPlayer)).find('#video-tap-zone')[0];
            this.videoTimelineThumb = $(ReactDOM.findDOMNode(this.VideoPlayer)).find('#video-timeline-thumb')[0];

            $(this.videoElement).attr('webkit-playsinline', 'true');
            $(this.videoElement).attr('playsinline', 'true');

            this.timelineHidden = false;

            if (this.hasHamburgerMenu && OrientationHelper.getScreenOrientation() === "portrait") {
                $(this.videoCloseButtonHitBox).css('right', '1%');
                $(this.videoCloseButtonHitBox).css('transform', 'translateY(calc(-0.025 * 100vh))');
                $(this.videoCloseButton).css('transform', 'translateY(calc(-0.05 * 100vh))');
            }

            this.setupTouchGestures();

            return this;
        },

        setupTouchGestures: function setupTouchGestures() {
            //UM-49, adding play/pause capabilities to the video player; also toggles the timeline
            //if the timeline is hidden (First shows the timeline, then pauses if the timeline is visible)
            Hammer(this.videoTapZone).on('tap', function (e) {
                if (this.timelineHidden) {
                    this.toggleTimeline(true);
                } else {
                    this.onPlayPause();
                }
            }.bind(this));

            //UM-49, adding scrub capabilities to the bar
            Hammer(this.videoTimeline).on('tap', function (event) {
                // Calculates the number of seconds through the video, and we then scrub to that position.
                // The 'hideTimeline' function is passed in, so that we retain the proper
                // function scope (hideTimeline handles some global flags, which become desync'd otherwise)
                var percentageOnBar = (event.center.x - this.videoTimeline.offsetLeft) / this.videoTimeline.clientWidth;
                var seconds = Math.floor(this.videoDuration * percentageOnBar);
                this.scrubTo(seconds, this.hideTimeline.bind(this), 3);
            }.bind(this));

            Hammer(this.videoTimelineThumb).on('panstart', function () {
                this.showTimeline(false);
                if (!this.paused) {
                    this.pause();
                    this.playAfterDrag = true;
                }
                var initialPosition = this.videoTimeline.offsetLeft - this.videoTimelineThumb.clientWidth / 2;
                this.dragStartPosition = this.videoTimelineThumb.getBoundingClientRect().left - initialPosition;
            }.bind(this));
            Hammer(this.videoTimelineThumb).on('panleft panright', function (event) {
                var currentPosition = (this.dragStartPosition + event.deltaX) / this.videoTimeline.clientWidth * this.videoElement.duration;
                this.updateTimelineThumb(currentPosition, this.videoElement.duration);
                this.dragEndPosition = currentPosition;
            }.bind(this));
            Hammer(this.videoTimelineThumb).on('panend', function () {
                if (this.playAfterDrag) {
                    this.playVideo(this.dragEndPosition);
                }
                this.showTimeline(true);
            }.bind(this));

            Hammer(this.videoCloseButtonHitBox).on('tap', function () {
                this.close();
            }.bind(this));
        },

        resetSource: function resetSource(url, in_time, out_time) {
            var self = this;

            this.suspend();

            this.videoUrl = url;
            this.in_time = in_time;
            this.out_time = out_time;

            var video = this.$('#video-plane', this.el);
            $(video).attr("src", this.videoUrl);
            self.$('#video-timeline-thumb').addClass('no-animate');
            $('#video-timeline-thumb').css({ '-webkit-transform': 'translateX(0px)' });
            this.updateTimelineThumb(0, 1); // set the timeline to the beginning

            _.delay(function () {
                self.playVideo(in_time);

                self.showTimeline(true);

                self.OmnitureAnalyticsHelper.setEvents("event20", true);
            });
        },

        playVideo: function playVideo(time) {
            var self = this;

            this.paused = false;

            var video = $('#video-plane', this.el)[0];

            if (video) {
                video.playbackRate = 1.0;
            }

            var promise = video.play();
            if (promise && promise instanceof Promise) {
                // Chromium on MTheory currently doesn't support video promises
                promise.then(function () {
                    if (time || time === 0) {
                        video.currentTime = time;
                    }
                }).catch(function (error) {
                    self.deferred.resolve();

                    $('#video-play-icon').addClass("showing");
                    $('#video-plane').click(function () {
                        video.play();
                    });
                });
            } else {
                if (time || time === 0) {
                    video.currentTime = time;
                }
            }

            // start timer to generate timecode events
            this.timeUpdateHandler = function () {
                self.onTick();
            };
            this.endedHandler = function () {
                self.onEnded();
            };
            video.addEventListener('timeupdate', this.timeUpdateHandler, false);
            video.addEventListener('ended', this.endedHandler, false);
            video.addEventListener("canplay", this.canPlay.bind(this), false);

            this.fixTick = setInterval(function () {
                self.onTick();
            }, 30);

            this.$('#video-timeline-thumb').removeClass('no-animate');
        },

        canPlay: function canPlay() {
            var video = $('#video-plane', this.el)[0];

            this.deferred.resolve();

            if (video) {
                video.removeEventListener("canplay", this.canPlay, false);
            }
        },

        onPlayPause: function onPlayPause() {
            var video = $('#video-plane', this.el)[0];

            if (video) {
                var rate = video.playbackRate;

                if (!this.paused) {
                    if (video && rate !== 1.0) {
                        video.defaultPlaybackRate = 1.0;
                        video.playbackRate = 1.0;
                    } else {
                        this.pause();
                        this.showTimeline(false);
                        this.OmnitureAnalyticsHelper.setEvents("event25,event27=" + video.currentTime, true);
                    }
                } else {
                    this.hideTimeline();
                    this.playVideo();
                    this.OmnitureAnalyticsHelper.setEvents("event26", true);
                }
            }
        },

        pause: function pause() {
            this.paused = true;

            var video = $('#video-plane', this.el)[0];
            if (video) {
                video.pause();
            }

            this.clearEventHandlers();
        },

        onFastForward: function onFastForward() {
            var video = $('#video-plane', this.el)[0];

            if (video) {
                video.playbackRate = 10.0;
            }
        },

        onRewind: function onRewind() {
            var video = $('#video-plane', this.el)[0];

            if (video) {
                video.playbackRate = -10;
            }
        },

        onTick: function onTick() {
            var video = $('#video-plane', this.el)[0];

            if (video) {
                if (!video.paused) {
                    $('#video-play-icon').removeClass("showing");
                }

                this.updateTimelineThumb(video.currentTime, video.duration);

                if (this.out_time && video.currentTime > this.out_time) {
                    this.onEnded();
                }

                if (!this.quarterCompleted && video.currentTime >= 0.25 * video.duration) {
                    this.OmnitureAnalyticsHelper.setEvents("event22,event27=" + video.currentTime, true);
                    this.quarterCompleted = true;
                } else if (!this.halfCompleted && video.currentTime >= 0.5 * video.duration) {
                    this.halfCompleted = true;
                    this.OmnitureAnalyticsHelper.setEvents("event23,event27=" + video.currentTime, true);
                } else if (!this.threeQuartersCompleted && video.currentTime >= 0.75 * video.duration) {
                    this.threeQuartersCompleted = true;
                    this.OmnitureAnalyticsHelper.setEvents("event24,event27=" + video.currentTime, true);
                }
            }
        },

        updateTimelineThumb: function updateTimelineThumb(currentTime, duration) {
            if (!duration) {
                return; // avoid issue with undefined, NaN, or 0 duration
            }

            this.videoDuration = duration;

            if (this.in_time || this.out_time) {
                currentTime -= this.in_time || 0;
                duration = (this.out_time || this.videoDuration) - this.in_time;
            }
            currentTime = Math.max(0, Math.min(currentTime, duration)); // clamp current time between 0 and duration

            var dx = currentTime / duration * this.videoTimeline.clientWidth;
            $('#video-timeline-thumb').css({ '-webkit-transform': 'translateX(' + dx + 'px)' });
            $('#video-completed').css('width', dx + 'px');

            var min = Math.floor(currentTime / 60).toString(10);
            var sec = Math.floor(currentTime % 60).toString(10);
            if (sec < 10) {
                sec = "0" + sec;
            }
            $('#video-timecode').text(min + ":" + sec);
        },

        toggleTimeline: function toggleTimeline(autoHide) {
            if (this.timelineHidden) {
                this.showTimeline(autoHide);
            } else {
                this.hideTimeline();
            }
        },

        showTimeline: function showTimeline(autoHide) {
            if (autoHide) {
                clearTimeout(this.hideTimeCode);
                this.hideTimeCode = setTimeout(this.hideTimeline.bind(this), 3000);
            } else {
                clearTimeout(this.hideTimeCode);
            }

            this.timelineHidden = false;

            $('#ui-layer').fadeIn();
            $('#video-resize-element').fadeIn();
            $(this.videoCloseButton).fadeIn();
        },

        hideTimeline: function hideTimeline() {
            this.timelineHidden = true;

            $('#ui-layer').fadeOut();

            $('#video-resize-element').fadeOut();

            $(this.videoCloseButton).fadeOut();
        },

        onEnded: function onEnded() {
            this.stopScrubbing();

            this.pause();

            this.app.popView();

            this.OmnitureAnalyticsHelper.setEvents("event21", true);
        },

        onSkipToEnd: function onSkipToEnd() {
            this.onEnded();
        },

        startScrubbing: function startScrubbing(direction) {
            var self = this;

            if (this.timer) {
                return;
            }

            this.timer = setInterval(function () {
                self.skip(10 * direction);
            }, 250);

            this.skip(10 * direction);
        },

        stopScrubbing: function stopScrubbing() {
            if (this.timer) {
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
        scrubTo: function scrubTo(second, hideTimelineFunc, hideTimelineDelay) {
            var video = $('#video-plane', this.el)[0];

            // clamp time between 0 and duration
            if (video) {
                if (!video.duration) {
                    video.currentTime = 0;
                } else {
                    video.currentTime = Math.min(second, video.duration);
                }
            }

            this.onTick();

            if (hideTimelineFunc) {
                setTimeout(hideTimelineFunc, hideTimelineDelay != null ? hideTimelineDelay * 1000 : 0);
            }
        },

        skip: function skip(seconds) {
            var video = $('#video-plane', this.el)[0];

            if (video) {
                // clamp time between 0 and duration
                if (!video.duration) {
                    video.currentTime = 0;
                } else {
                    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration);
                }
            }

            this.onTick();
        },

        handleOrientationChange: function handleOrientationChange() {
            MobileView.prototype.handleOrientationChange.call(this);

            if (OrientationHelper.getScreenOrientation() === "landscape") {
                $(this.videoCloseButtonHitBox).css('right', '2.75%');
                $(this.videoCloseButtonHitBox).css('transform', 'translateY(0)');
                $(this.videoCloseButton).css('transform', 'translateY(0)');

                if (this.hasHamburgerMenu) {
                    if ($('.hamburger-menu', this.el).is(':visible')) {
                        $('.hamburger-menu', this.el).hide();
                    }
                }
            } else {
                $(this.videoCloseButtonHitBox).css('right', '1%');
                $(this.videoCloseButtonHitBox).css('transform', 'translateY(calc(-0.025 * 100vh))');
                $(this.videoCloseButton).css('transform', 'translateY(calc(-0.05 * 100vh))');
            }
        },

        clearEventHandlers: function clearEventHandlers() {
            var video = this.$('#video-plane', this.el)[0];

            clearInterval(this.fixTick);

            if (video && this.timeUpdateHandler) {
                video.removeEventListener('timeupdate', this.timeUpdateHandler, false);
                this.timeUpdateHandler = undefined;
            }

            if (video && this.endedHandler) {
                video.removeEventListener('ended', this.endedHandler, false);
                this.endedHandler = undefined;
            }
        },

        resume: function resume(data) {
            MobileView.prototype.resume.call(this);

            if (data) {
                this.videoName = data.name;

                if (this.hasHamburgerMenu) {
                    this.HamburgerMenu.setTitle(this.videoName);
                }

                if (data.metadata && data.metadata.video) {
                    this.videoUrl = data.metadata.video.url;
                    this.in_time = data.metadata.video.in_time;
                    this.out_time = data.metadata.video.out_time;
                }

                this.resetSource(this.videoUrl, this.in_time, this.out_time);
            }
        },

        suspend: function suspend() {
            MobileView.prototype.suspend.call(this);

            this.stopScrubbing();

            this.pause();

            var video = this.$('#video-plane', this.el)[0];
            if (video) {
                video.src = '';
            }

            // Needs logic before exit analytics call is made
            // this.OmnitureAnalyticsHelper.setAction("Exit Full Screen Video Player", true);

            MobileView.prototype.suspend.call(this);
        },

        close: function close() {
            this.suspend();

            this.app.popView();
        }
    });
});
