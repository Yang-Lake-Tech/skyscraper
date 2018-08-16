/**
 * Created by michelleli on 2017-07-10.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/contentList.html'
], function($, _, Backbone, Hammer, InteractiveComp, template) {
    return InteractiveComp.View.extend({
        className: 'feature-content-list',

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this);

            this.parent = options.parent;

            var baseUrl = this.parent ? (this.parent.baseUrl ? this.parent.baseUrl : "") : "";
            var thumbnailUrl = options.thumbnailUrl ? options.thumbnailUrl : "";
            this.url = baseUrl + thumbnailUrl;

            this.contentItems = options.contentList;
            this.displayCount = options.displayCount;
            this.elementHeight = options.elementHeight;
            this.verticalOffset = options.verticalOffset ? options.verticalOffset : 0;
            this.contentMargin = options.contentMargin ? options.contentMargin : 0;

            this.currentSelection = 0;

            this.transitioning = 0;
            this.lastNavigationDirection = 0;

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
        },

        render: function() {
            $(this.el).html(_.template(template)({
                displayCount: this.displayCount,
                contentItems: this.contentItems
            }));

            this.contentListWrapper = $('.content-list', this.el);
            this.previousContent = $('#previous-content', this.el);
            this.nextContent = $('#next-content', this.el);
            this.contentList = $('.featuredContent', this.el);
            this.focusedContent = $('#focusedContent', this.el);
            this.fm.firstElementIndex = "100,0";
            this.initFocusManager();
            this.updateThumbs();

            setTimeout(function () {
                this.onContentHighlight();
            }.bind(this))

            this.setupTouchGestures();

            /*
            this.contentListWrapper.css({
                height: (10 + 129 * Math.min(4, this.contentItems.length)) + 'px'
            })
            */

            return this;
        },

        onKeyDown: function(code) {
            console.log('OnKeyDown', code)
            if (code != this.KEY_UP && code != this.KEY_DOWN) {
                this.parent.onKeyDown && _.isFunction(this.parent.onKeyDown) ? this.parent.onKeyDown(code) : null;
                return;
            }

            this.fm.blockKeyDown = true;
            this.parent && this.parent.fm ? this.parent.fm.blockKeyDown = true : null;

            if (code == this.KEY_UP) {
                this.handleNavigation(1, 1);
            } else if (code == this.KEY_DOWN) {
                this.handleNavigation(-1, 1);
            }
        },

        setupTouchGestures: function () {
            _.each($('.thumb', this.el), function(element) {
                Hammer(element).on('tap', function(event){
                    if (!this.isTransitioning()) {
                        var offset = event.target.id.split('-')[0];
                        switch (offset) {
                            case 'previous':
                                offset = -1;
                                break;
                            case 'next':
                                offset = this.contentList.length;
                                break;
                            default:
                                offset = Number(event.target.id.split('-')[2]);
                                break;
                        }

                        var navigationOffset = (-1 * offset) - this.lastNavigationDirection + 1;
                        this.handleNavigation(Math.sign(navigationOffset), Math.abs(navigationOffset), true);
                    }
                }.bind(this));

                this.setupSwipeGestureForElement(element);
            }.bind(this));

            this.setupSwipeGestureForElement(this.focusedContent[0]);
        },

        setupSwipeGestureForElement: function (element) {
            Hammer(element).on('swipe', function(event){
                event.direction === Hammer.DIRECTION_UP ? this.handleNavigation(-1, 1) : null;
                event.direction === Hammer.DIRECTION_DOWN ? this.handleNavigation(1, 1) : null;
            }.bind(this)).get('swipe').set({ direction: Hammer.DIRECTION_ALL });
        },

        handleNavigation: function(direction, iterations, selectOnCompletion) {
            this.updateThumbs();

            var fn = direction > 0 ? this.navigateUp : direction < 0 ? this.navigateDown : null;
            if (fn) {
                fn.call(this, iterations, selectOnCompletion);
            }
        },

        navigateDown: function (iterations, selectOnCompletion) {
            var self = this;

            var ci = 0;
            for (var c = 0; c < iterations; c++) {
                $(self.contentList[1]).css('background-image', 'url('
                    + self.url
                    + self.contentItems[self.getIndexOffset(0)].thumbnail_nor
                    + ')' );
                $(self.contentList[2]).css('background-image', 'url('
                    + self.url
                    + self.contentItems[self.getIndexOffset(1)].thumbnail_sel
                    + ')' );

                this.transitioning++;

                _.delay(function() {
                    self.nextContent.on('transitionend webkitTransitionEnd', function () {
                        self.nextContent.off('transitionend webkitTransitionEnd');

                        if (ci < iterations) {
                            self.updateThumbs();
                        }

                        self.transitioning--;
                        if (self.transitioning === 0) {
                            if (iterations > 1) {
                                $(self.contentList[1]).css('background-image', 'url(' + self.url + self.contentItems[self.getIndexOffset(-1)].thumbnail_nor + ')' );
                                $(self.contentList[2]).css('background-image', 'url(' + self.url + self.contentItems[self.getIndexOffset(0)].thumbnail_sel + ')' );
                            }

                            if (selectOnCompletion) {
                                self.onContentSelect();
                            }

                            self.fm.blockKeyDown = false;
                            self.parent && self.parent.fm ? self.parent.fm.blockKeyDown = false : null;
                        }
                    });

                    self.previousContent.addClass('animatable');
                    self.nextContent.addClass('animatable');
                    self.contentList.addClass('animatable');


                    self.previousContent.css('transform', 'translate(0px, '
                        + (self.elementHeight * self.displayCount)
                        + 'px) scale(0.0)');

                    for(var i = 0; i < self.displayCount; i++) {
                        $(self.contentList[i]).css(
                            'transform',
                            'translate(0px, '
                                + (
                                     self.verticalOffset
                                    + self.elementHeight * (i - 1)
                                    + self.contentMargin * (i - 2)
                                )
                                + 'px) scale(' + ((i == (self.displayCount)) ? 0 : 1) + '.0)'
                        );
                    }

                    self.nextContent.css('transform', 'translate(0px, '
                        + (
                                self.verticalOffset
                            + (self.elementHeight * (self.displayCount - 1))
                            + (self.contentMargin * (self.displayCount - 2))
                        ) + 'px) scale(1.0)');

                    self.currentSelection = self.getIndexOffset(1);
                    self.onContentHighlight();

                    ci++;
                }, 15 + (c * 600) );
            }

            this.lastNavigationDirection = -1;
        },

        navigateUp: function (iterations, selectOnCompletion) {
            var self = this;

            var ci = 0;
            for (var c = 0; c < iterations; c++) {
                $(self.contentList[0]).css('background-image', 'url('
                    + self.url
                    + self.contentItems[self.getIndexOffset(-1)].thumbnail_sel
                    + ')' );
                $(self.contentList[1]).css('background-image', 'url('
                    + self.url
                    + self.contentItems[self.getIndexOffset(0)].thumbnail_nor
                    + ')' );


                this.transitioning++;

                _.delay(function() {
                    self.nextContent.on('transitionend webkitTransitionEnd', function () {
                        self.nextContent.off('transitionend webkitTransitionEnd');

                        if (ci < iterations) {
                            self.updateThumbs();
                        }

                        self.transitioning--;
                        if (self.transitioning === 0) {
                            if (iterations > 1) {
                                $(self.contentList[0]).css('background-image', 'url(' + self.url + self.contentItems[self.getIndexOffset(0)].thumbnail_sel + ')' );
                                $(self.contentList[1]).css('background-image', 'url(' + self.url + self.contentItems[self.getIndexOffset(1)].thumbnail_nor + ')' );
                            }

                            if (selectOnCompletion) {
                                self.onContentSelect();
                            }

                            self.fm.blockKeyDown = false;
                            self.parent && self.parent.fm ? self.parent.fm.blockKeyDown = false : null;
                        }
                    });

                    self.previousContent.addClass('animatable');
                    self.nextContent.addClass('animatable');
                    self.contentList.addClass('animatable');

                    self.previousContent.css('transform', 'translate(0px, '
                        + self.verticalOffset
                        + 'px) scale(1.0)');

                    for(var i = 0; i < self.displayCount; i++) {
                        $(self.contentList[i]).css(
                            'transform',
                            'translate(0px, '
                                + (
                                    self.verticalOffset
                                    + (self.elementHeight * (i + 1))
                                    + (self.contentMargin * (i + 1))
                                ) + 'px) scale(' + ((i == (self.displayCount-1)) ? 0 : 1) + '.0)'
                        );
                    }

                    self.nextContent.css('transform', 'translate(0px, '
                        + (
                            self.verticalOffset
                            + (self.elementHeight * -1)
                            + (self.contentMargin * -1)
                        ) + 'px) scale(0.0)');

                    self.currentSelection = self.getIndexOffset(-1);
                    self.onContentHighlight();

                    ci++;
                }, 15 + (c * 600) );
            }

            this.lastNavigationDirection = 1;
        },

        updateThumbs: function () {
            this.previousContent.removeClass('animatable');
            this.nextContent.removeClass('animatable');
            this.contentList.removeClass('animatable');

            this.previousContent.css({
                'transform': 'translate(0px, ' + self.verticalOffset + 'px) scale(0.0)',
                'background-image': 'url(' + this.url + this.contentItems[this.getIndexOffset(-2)].thumbnail_nor + ')'
            });

            for(var i = 0; i < this.displayCount; i++) {
                var image = (i === 1)
                    ? this.url + this.contentItems[this.getIndexOffset(i-1)].thumbnail_sel
                    : this.url + this.contentItems[this.getIndexOffset(i-1)].thumbnail_nor;

                $(this.contentList[i])
                    .children()
                    .removeClass()
                    .addClass('icon-thumb-' + this.contentItems[this.getIndexOffset(i-1)].contentType);

                $(this.contentList[i]).css({
                    'transform': 'translate(0px, '
                        + (this.verticalOffset
                            + (this.elementHeight * i)
                            + (this.contentMargin * i) )
                        + 'px) scale(1.0)',
                    'background-image': 'url(' + image + ')'
                });
            }
            var thumbImg = this.url + this.contentItems[this.getIndexOffset(this.displayCount -1)].thumbnail_nor
            if (this.displayCount === 2) {
                thumbImg = this.url + this.contentItems[this.getIndexOffset(this.displayCount -1)].thumbnail_sel
            }
            this.nextContent.css({
                'transform': 'translate(0px, '
                    + (
                            this.verticalOffset
                        + (this.elementHeight * this.displayCount)
                        + (this.contentMargin * this.displayCount)
                    )
                    + 'px) scale(0.0)',
                'background-image': 'url(' + thumbImg + ')'
            });

            var contentTypeNext = this.contentItems[this.getIndexOffset(this.displayCount -1)].contentType
            this.nextContent
                    .children()
                    .removeClass()
                    .addClass('icon-thumb-' + contentTypeNext);

        },

        onBackButtonPressed: function () {
            this.parent && this.parent.onBackButtonPressed && _.isFunction(this.parent.onBackButtonPressed) ?
                this.parent.onBackButtonPressed() : null;
        },

        onContentHighlight: function(){
            this.trigger("CONTENT_HIGHLIGHTED", this.getCurrentContent());
        },

        onContentSelect: function(){
            this.trigger("CONTENT_SELECTED", this.getCurrentContent());
        },

        isTransitioning: function () {
            return this.transitioning > 0;
        },

        // Gets the currently selected content item
        getCurrentContent: function () {
            // Ignore the case when the current selection is not defined / applicable for content selection
            if (this.currentSelection || this.currentSelection === 0) {
                return this.contentItems[this.currentSelection];
            }
        },

        getIndexOffset: function(offset) {
            return (this.currentSelection + offset + this.contentItems.length) % this.contentItems.length;
        },

        KEY_RIGHT: 39,
        KEY_LEFT: 37,
        KEY_UP: 38,
        KEY_DOWN: 40
    });
});