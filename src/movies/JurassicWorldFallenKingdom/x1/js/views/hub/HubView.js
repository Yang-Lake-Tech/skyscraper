define([
  'jquery',
  'underscore',
  'backbone',
  'hammer',
  'platform/tools',
  'platform/views/interactiveComp',
  'text!templates/hub/HubView.html',
  'text!experience/hub.json'
], function($, _, Backbone, Hammer, Tools, InteractiveComp, template, data) {
  return InteractiveComp.View.extend({
    className: 'hub-view popup-component',

    events: {
      'click .close-button-clickable-area': 'onBackButtonPressed'
    },

    initialize: function(options) {
      InteractiveComp.View.prototype.initialize.call(this, options);

      this.experienceName = options.experienceName;
      this.hubVideoUrl = 'Assets/Video/Hub/';
      this.currentHubSelection = 0;

      this.isRootView = true;

      /* Sample Events to listen to (usually correspond to events triggering from the view's focus manager) */

      // Any key press (useful for TV remote navigation keys - same as left, right, up and down arrow keys on the keyboard)
      this.listenTo(this.fm, 'keyDown', this.onKeyDown);

      // Experience Assets as a JSON object
      // (remove Style if experience is on a touch device)
      this.contentItems = JSON.parse(data);

      this.currentSelection = 0;

      this.transitioning = false;

      this.baseUrl = './'; //options.app.titleMetaData.title.base_url;

      this.lastNavigationDirection = 0;

      window.onbeforeunload = this.onReload;

      var assetsToPreload = [];

      _.each(this.contentItems, function(item) {
        assetsToPreload.push(item.nor_image);
        assetsToPreload.push(item.sel_image);
      });

      this.preloadAssets(assetsToPreload);
      this.preloadImages = this.preloadImageAssets(assetsToPreload);
    },

    startAnalytics: function() {
      this.OmnitureAnalyticsHelper.startSessionOnPage('Hub Main Page');
    },

    render: function() {
      $(this.el).html(_.template(template, {}));

      this.preload = $('.preload', this.el);

      this.closeButton = $('div.close', this.el);
      this.closeButtonClickableArea = $(
        'div.close-button-clickable-area',
        this.el
      );

      this.hubNav = $('#hub-nav', this.el);

      this.navLinkLeft = $('#nav-link-left', this.el);
      this.navLink1 = $('#nav-link-1', this.el);
      this.navLink2 = $('#nav-link-2', this.el);
      this.navLink3 = $('#nav-link-3', this.el);
      this.navLink4 = $('#nav-link-4', this.el);
      this.navLink5 = $('#nav-link-5', this.el);
      this.navLinkRight = $('#nav-link-right', this.el);

      this.thumbs = [
        this.navLinkLeft,
        this.navLink1,
        this.navLink2,
        this.navLink3,
        this.navLink4,
        this.navLink5,
        this.navLinkRight
      ];

      this.audio = $('#audio-content');
      this.audioSrc = 'Assets/Audio/JWFK_HUB_loop_02_v2.mp3?NO_MTHEORY_DECODER';
      this.fadeInAudioElementWithSrcAndDuration(
        this.audio[0],
        this.audioSrc,
        0,
        true
      );

      // The first element on the logical grid that should be focused
      this.fm.firstElementIndex = '1,0';

      this.updateThumbs();

      // This will initialise the logical grid view
      this.initFocusManager();

      this.setupTouchGestures();

      $('#start-experience').hide();

      //this.listenTo(this.app, "EXIT_EXPERIENCE", this.exitExperience);

      this.video = $('video', this.el);

      this.videoTimeUpdate = function(e) {
        // if (this.currentHubSelection == 1) {
        //   if (
        //     (this.video[0].currentTime >= 10.2 &&
        //       this.video[0].currentTime <= 13.2) ||
        //     (this.video[0].currentTime >= 99.13 &&
        //       this.video[0].currentTime <= 100.13)
        //   ) {
        //     this.video[0].currentTime = 2.2;
        //   }
        // } else if (this.currentHubSelection == 2) {
        //   if (
        //     (this.video[0].currentTime >= 21.16 &&
        //       this.video[0].currentTime <= 24.16) ||
        //     (this.video[0].currentTime >= 88.17 &&
        //       this.video[0].currentTime <= 89.17)
        //   ) {
        //     this.video[0].currentTime = 13.16;
        //   }
        // } else if (this.currentHubSelection == 3) {
        //   if (
        //     (this.video[0].currentTime >= 32.08 &&
        //       this.video[0].currentTime <= 35.08) ||
        //     (this.video[0].currentTime >= 77.21 &&
        //       this.video[0].currentTime <= 78.21)
        //   ) {
        //     this.video[0].currentTime = 24.12;
        //   }
        // } else if (this.currentHubSelection == 4) {
        //   if (
        //     (this.video[0].currentTime >= 43.04 &&
        //       this.video[0].currentTime <= 46.04) ||
        //     (this.video[0].currentTime >= 67.01 &&
        //       this.video[0].currentTime <= 68.01)
        //   ) {
        //     this.video[0].currentTime = 35.08;
        //   }
        // } else if (this.currentHubSelection == 0) {
        //   if (
        //     (this.video[0].currentTime >= 53.04 &&
        //       this.video[0].currentTime <= 56.04) ||
        //     (this.video[0].currentTime >= 108.35 &&
        //       this.video[0].currentTime <= 109.35)
        //   ) {
        //     this.video[0].currentTime = 46.04;
        //   }
        // }
      }.bind(this);

      this.videoCanPlay = function() {
        if (this.app.hubInitialPlay == true) {
          this.app.hubInitialPlay = false;

          setTimeout(() => {
            //this.onKeyDown(this.KEY_RIGHT);
            //this.video[0].currentTime = 44.58;
            this.video[0].play();
          }, 1000);
        } else {
          return;
        }
      }.bind(this);

      this.video[0].src =
        this.contentItems[0].menu_video +
        // this.baseUrl +
        // this.hubVideoUrl +
        // 'JWFK_NG_ALL_ACCESS_HUB.mp4' +
        '?NO_MTHEORY_DECODER';
      this.video[0].addEventListener('timeupdate', this.videoTimeUpdate);
      this.video[0].addEventListener('canplaythrough', this.videoTimeUpdate);
      this.video[0].addEventListener('canplay', this.videoCanPlay);
      //   this.video[0].loop = true;

      //   setTimeout(
      //     function() {
      //       this.onKeyDown(this.KEY_DOWN);
      //     }.bind(this),
      //     1000
      //   );
      this.video[1].src =
        this.contentItems[1].menu_video + '?NO_MTHEORY_DECODER';
      this.video[1].addEventListener('timeupdate', this.videoTimeUpdate);
      this.video[1].addEventListener('canplaythrough', this.videoTimeUpdate);
      this.video[1].addEventListener('canplay', this.videoCanPlay);

      return this;
    },

    preloadImageAssets: function(assets) {
      var images = [];
      for (var i = 0; i < assets.length; i++) {
        images[i] = new Image();
        images[i].src = this.baseUrl + assets[i];
      }

      return images;
    },

    loadComplete: function() {},

    exitExperience: function() {
      //this.video[0].currentTime = 0;
      //this.video[0].play();
    },

    setupTouchGestures: function() {
      var self = this;

      // Selecting the highlighted sub-experience
      Hammer($('#hub-nav-touch-area', this.el)[0]).on(
        'tap',
        function() {
          if (!this.isTransitioning()) {
            this.onNavSelect();
          }
        }.bind(this)
      );

      // Swiping on the bottom panel
      this.setupSwipeGestureForElement($('#hub-touch-panel', this.el)[0]);

      // Selecting a sub-experience directly from the bottom panel
      _.each(
        $('.nav-link', this.el),
        function(element) {
          Hammer(element).on(
            'tap',
            function(event) {
              var offset = event.target.id.split('-')[2];

              self.currentSelection = offset - 1;
              self.onNavSelect();
              /*
                    if (!this.isTransitioning()) {
                        var offset = event.target.id.split('-')[2];
                        switch (offset) {
                            case 'left':
                                offset = 0;
                                break;
                            case 'right':
                                offset = $('.nav-link', this.el).length - 1;
                                break;
                            default:
                                offset = Number(offset);
                                break;
                        }

                        this.handleNavigation(offset - this.lastNavigationDirection - 1, true);
                    }
                    */
            }.bind(this)
          );

          this.setupSwipeGestureForElement(element);
        }.bind(this)
      );
    },

    setupSwipeGestureForElement: function(element) {
      Hammer(element).on(
        'swipeleft',
        function() {
          if (!this.isTransitioning()) {
            this.handleNavigation(1);
          }
        }.bind(this)
      );
      Hammer(element).on(
        'swiperight',
        function() {
          if (!this.isTransitioning()) {
            this.handleNavigation(-1);
          }
        }.bind(this)
      );
    },

    onNavSelect: function() {
      if (this.getCurrentContent().content) {
        this.app.toggleKeyPress(true);
        this.OmnitureAnalyticsHelper.setAction(
          'Sub experience ' + this.getCurrentContent().name + ' is Selected',
          true
        );
        this.OmnitureAnalyticsHelper.stopSession();

        this.app.current360AudioTime = this.audio[0].currentTime;

        this.app.playContent(this.getCurrentContent().content);

        //if (!this.getCurrentContent().keepAudio) {
        this.audio.animate(
          { volume: 0 },
          this.app.getHalfDurationForTransition({ type: 'fade' }),
          'linear',
          function() {
            this.audio[0].pause();
            if (this.app.viewStack[this.app.viewStack.length - 1].hasAudio) {
              this.fadeInAudioElementWithSrcAndDuration(
                $('#audio-content')[0],
                this.app.viewStack[
                  this.app.viewStack.length - 1
                ].getAudioSource(),
                0,
                true
              );
            }
          }.bind(this)
        );

        this.video = $('video', this.el);
        this.video[0].pause();
        //}
      }
    },

    onKeyDown: function(code) {
      if (!$('#hub-nav').hasClass('focused')) {
        return;
      }

      if (this.isTransitioning()) {
        return;
      }

      if (code !== this.KEY_UP && code !== this.KEY_DOWN) {
        return;
      }

      this.handleNavigation(code === this.KEY_DOWN ? 1 : -1);
    },

    handleNavigation: function(offset, select) {
      $('#hub-nav-selection').animate({ opacity: 0 }, 300, function() {
        $('#hub-nav-selection').animate({ opacity: 1 });
      });
      if (offset < 0) {
        this.updateVideoTimer('UP');
      } else if (offset > 0) {
        this.updateVideoTimer('DOWN');
      }
      this.updateThumbs();

      this.navigate(offset, select);
      this.lastNavigationDirection = Math.sign(offset);

      if (offset < 0) {
        this.OmnitureAnalyticsHelper.setAction(
          'Navigated Left on the Main Hub Menu',
          true
        );
        if (this.currentHubSelection == 0) {
          this.currentHubSelection = 4;
        } else {
          this.currentHubSelection -= 1;
        }
      } else if (offset > 0) {
        this.OmnitureAnalyticsHelper.setAction(
          'Navigated Right on the Main Hub Menu',
          true
        );
        if (this.currentHubSelection == 4) {
          this.currentHubSelection = 0;
        } else {
          this.currentHubSelection += 1;
        }
      }
    },

    playAndPreload(url, playbackRate) {
      var playVideo = $('video:hidden', this.el);
      var preloadVideo = $('video:visible', this.el);
      playVideo[0].src = url;
      playVideo[0].removeEventListener('loadeddata', this.handleVideoPlay);
      var self = this;
      this.handleVideoPlay = function(e) {
        // Video is loaded and can be played
        if (playbackRate < 0) {
          clearInterval(self.intervalRewind);
          playVideo[0].currentTime = playVideo[0].duration;
          self.intervalRewind = setInterval(function() {
            playVideo[0].currentTime -= 0.016;
            if (playVideo[0].currentTime <= 0) {
              clearInterval(self.intervalRewind);
              playVideo[0].pause();
            }
          }, 16);
        } else {
          playVideo.show()[0].play();
          preloadVideo.hide()[0].pause();
        }
      };

      playVideo[0].addEventListener('loadeddata', this.handleVideoPlay, false);
      playVideo[0].load();
    },

    updateVideoTimer: function(navigationDirection) {
      var delta = navigationDirection === 'UP' ? -1 : 1;
      var nextIndex = this.currentHubSelection + delta;
      if (nextIndex >= this.contentItems.length) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = this.contentItems.length - 1;
      }

      //   console.log(this.currentHubSelection, navigationDirection, nextIndex);

      content = this.contentItems[nextIndex];
      this.playAndPreload(content.menu_video, delta);
      //   this.video = $('video', this.el).hide();
      //   this.video[0].pause();
      //   this.video[0].src = content.menu_video;
      //   this.video[0].play();
      //   console.log(content);
      //   if (this.currentHubSelection == 0) {
      //     this.video[0].currentTime = navigationDirection == 'RIGHT' ? 0 : 64.05;
      //   } else if (this.currentHubSelection == 1) {
      //     this.video[0].currentTime =
      //       navigationDirection == 'RIGHT' ? 10.7 : 107.63;
      //   } else if (this.currentHubSelection == 2) {
      //     this.video[0].currentTime =
      //       navigationDirection == 'RIGHT' ? 21.66 : 96.67;
      //   } else if (this.currentHubSelection == 3) {
      //     this.video[0].currentTime =
      //       navigationDirection == 'RIGHT' ? 32.42 : 85.71;
      //   } else {
      //     this.video[0].currentTime =
      //       navigationDirection == 'RIGHT' ? 43.58 : 75.01;
      //   }
    },

    navigate: function(offset, select) {
      var self = this;

      const iterations = Math.abs(offset);
      const direction = Math.sign(offset);

      var currentIteration = 0;

      if (iterations === 0) {
        this.onNavSelect();
        return;
      }

      self.transitioning = true;

      var targetPosition = self.getIndexOffset(direction);
      //self.linkToMove = undefined

      for (var iteration = 0; iteration < iterations; iteration++) {
        var index = -1,
          content,
          scale,
          targetPos;
        var contentLeftMargin = -200;

        if (direction === 1) {
          self.navLinkRight.addClass('not-animatable');
          self.navLinkRight.css({
            transform: 'translate(1200px, 545px) scale(1)'
          });
        } else {
          self.navLinkLeft.addClass('not-animatable');
          self.navLinkLeft.css({
            transform: 'translate(-100px, 545px) scale(1)'
          });
        }

        _.delay(function() {
          self.navLinkRight.removeClass('not-animatable');
          self.navLinkRight.addClass('animatable');
          self.navLinkLeft.removeClass('not-animatable');
          self.navLinkLeft.addClass('animatable');

          _.each(self.thumbs, function($thumb) {
            content = self.contentItems[self.getIndexOffset(index)];

            $thumb.addClass('animatable');

            if (index === 0 && direction === 1) {
              targetPos = -100;
              scale = 0;

              /*self.linkToMove = {
                                direction: direction,
                                el: $thumb,
                                x: content.positions[targetPosition],
                                y: content.y
                            }*/
              self.navLinkRight.css({
                backgroundImage:
                  'url(' + self.baseUrl + content.nor_image + ')',
                transform:
                  'translate(' +
                  content.positions[5] +
                  'px, ' +
                  content.y +
                  'px) scale(1)'
              });
            } else if (index === 4 && direction === -1) {
              targetPos = 1200;
              scale = 0;
              /*
                            self.linkToMove = {
                                direction: direction,
                                el: $thumb,
                                x: content.positions[targetPosition],
                                y: content.y
                            }*/
              self.navLinkLeft.css({
                backgroundImage:
                  'url(' + self.baseUrl + content.nor_image + ')',
                transform:
                  'translate(' +
                  content.positions[5] +
                  'px, ' +
                  content.y +
                  'px) scale(1)'
              });
            } /*else if (index === 1 && direction === 1) {
                            console.log(content)
                            $thumb.removeClass('animatable');
                        } */ else {
              targetPos =
                self.contentItems[self.getIndexOffset(index)].positions[
                  targetPosition
                ];
              scale = 1;
            }

            if (
              (index !== -1 && direction === 1) ||
              (index !== 5 && direction === -1)
            ) {
              //console.log('Will translate', index)
              $thumb.css(
                'transform',
                'translate(' + targetPos + 'px, ' + content.y + 'px) scale(1)'
              );

              if (scale === 0) {
                $thumb.fadeOut(245);
              } else {
                $thumb.fadeIn(245);
              }
            }

            ++index;
          });

          self.currentSelection = self.getIndexOffset(direction);

          setTimeout(function() {
            if (currentIteration === iterations) {
              if (select) {
                self.onNavSelect();
              }
              self.transitioning = false;

              _.each(self.thumbs, function($thumb) {
                $thumb.removeClass('animatable');
                $thumb.removeClass('not-animatable');
              });

              _.delay(function() {
                self.navLinkRight.css({
                  transform: 'translate(1200px, 545px) scale(1)'
                });
                self.navLinkLeft.css({
                  transform: 'translate(-100px, 545px) scale(1)'
                });

                self.updateThumbs();
              });
            }
          }, 300);

          currentIteration++;
          (index = -1),
            (content = null),
            (scale = null),
            (contentLeftMargin = -200);
        }, 15 + iteration * 500);
      }
    },

    updateThumbs: function() {
      var self = this;

      var index = -1,
        img,
        content,
        scale;
      //var contentLeftMargin = 0;

      _.each(this.thumbs, function($thumb) {
        //$thumb.removeClass('animatable');
        content = self.contentItems[self.getIndexOffset(index)];

        /*
                if(index == 0){
                    contentLeftMargin = self.contentItems[self.getIndexOffset(0)].margin_Left_first;
                }else if(index == 1){
                    contentLeftMargin = self.contentItems[self.getIndexOffset(0)].margin_Left_second;
                }
                */

        scale = index < 0 ? 0.0 : index < self.contentItems.length ? 1.0 : 0.0;
        //console.log('content', content.name)
        //console.log('scale', scale)
        //console.log('index', index)
        if (Tools.isMobile()) {
          img = content.nor_image;
        } else {
          img = index > 0 ? content.nor_image : content.sel_image;
        }
        //img = content.nor_image;

        //console.log('index: ' + index + ' name: ' + content.name)
        //console.log('direction: ', direction)
        //console.log('$thumb: ', $thumb)

        //console.log('img', img)
        var targetPos = content.positions[self.currentSelection];
        $thumb.css({
          position: 'absolute',
          transform:
            'translate(' +
            content.x +
            'px, ' +
            targetPos +
            'px) scale(' +
            scale +
            ')',
          opacity: scale,
          'background-image': 'url(' + self.baseUrl + img + ')',
          'background-repeat': 'no-repeat',
          'background-position': 'center center',
          width: content.width + 'px',
          height: content.height + 'px'
        });
        if (scale === 1.0) {
          $thumb.show();
        }
        /*
                if (index > 0) {
                    contentLeftMargin += content.width;
                }
                */
        ++index;
      });
    },

    onBackButtonPressed: function() {
      if (!this.fm.blockKeyDown) {
        InteractiveComp.View.prototype.onBackButtonPressed.call(this);

        if (this.app.viewStack.length > 1) {
          this.app.toggleKeyPress(true);
        }
      }
    },

    // Resets video src on browser refresh (browser stalls otherwise in some cases)
    onReload: function() {
      $('video').each(function() {
        this.src = '';
      });
    },

    resume: function() {
      this.fadeInAudioElementWithSrcAndDuration(
        this.audio[0],
        this.audioSrc,
        2000,
        true
      );

      this.video = $('video', this.el);
      this.video[0].play();

      if (this.experienceName) {
        this.OmnitureAnalyticsHelper.setExperience(this.experienceName);
      }
    },

    isTransitioning: function() {
      return this.transitioning;
    },

    getIndexOffset: function(offset) {
      return (
        (this.currentSelection + offset + this.contentItems.length) %
        this.contentItems.length
      );
    },

    // Gets the currently selected content item
    getCurrentContent: function() {
      // Ignore the case when the current selection is not defined / applicable for content selection
      if (this.currentSelection || this.currentSelection === 0) {
        return this.contentItems[this.currentSelection];
      }
    }
  });
});
