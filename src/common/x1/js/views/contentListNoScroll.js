/**
 * Created by michelleli on 2017-07-10.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/contentListNoScroll.html'
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

            this.currentSelection = 0;

            this.transitioning = 0;
            this.lastNavigationDirection = 0;

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
        },

        render: function() {
            $(this.el).html(_.template(template)({displayCount: this.displayCount}) );

            this.contentListWrapper = $('.content-list', this.el);
            //this.previousContent = $('#previous-content', this.el);
            //this.nextContent = $('#next-content', this.el);
            this.contentList = $('.featuredContent', this.el);
            this.focusedContent = $('#focusedContent', this.el);
            this.fm.firstElementIndex = "100,0";
            this.initFocusManager();
            this.updateThumbs(true);

            this.onContentHighlight();

            this.setupTouchGestures();

            return this;
        },

        onKeyDown: function(code) {
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
            //this.updateThumbs(false);

            var fn = direction > 0 ? this.navigateUp : direction < 0 ? this.navigateDown : null;

            if (fn) {
                fn.call(this, iterations, selectOnCompletion);
            }
        },

        navigateDown: function (iterations, selectOnCompletion) {
            var self = this;

            //console.log('navigateDown - iterations: '+iterations+' selectOnCompletion: '+selectOnCompletion)
            //console.log('self.contentList',self.contentList)
            //console.log('self.currentSelection',self.currentSelection)

            if (self.currentSelection === (self.contentList.length - 1)) {
                self.parent && self.parent.fm ? self.parent.fm.blockKeyDown = false : null;
                self.fm.blockKeyDown = false;
                return;
            }

            self.fm.blockKeyDown = false;
            self.parent && self.parent.fm ? self.parent.fm.blockKeyDown = false : null;

            self.currentSelection++
            self.updateThumbs();
            self.onContentHighlight();
            this.lastNavigationDirection = -1;
        },

        navigateUp: function (iterations, selectOnCompletion) {
            var self = this;
            //console.log('self.currentSelection',self.currentSelection)

            if (self.currentSelection === 0) {
                self.parent && self.parent.fm ? self.parent.fm.blockKeyDown = false : null;
                self.fm.blockKeyDown = false;
                return;
            }


            self.currentSelection--
            self.updateThumbs();
            self.fm.blockKeyDown = false;
            self.parent && self.parent.fm ? self.parent.fm.blockKeyDown = false : null;
            self.onContentHighlight();
            this.lastNavigationDirection = 1;
        },

        updateThumbs: function (changePos) {
            //this.previousContent.removeClass('animatable');
            //this.nextContent.removeClass('animatable');
            this.contentList.removeClass('animatable');
            //console.log('updateThumbs',this.contentList)

            /*
            this.previousContent.css({
                'transform': 'translate(0px, 0px) scale(0.0)',
                'background-image': 'url(' + this.url + this.contentItems[this.getIndexOffset(-2)].thumbnail_nor + ')'
            });
            */

            var topPos = 0
            for(var i = 0; i < this.displayCount; i++) {

                var image = (i === this.currentSelection)
                    ? this.url + this.contentItems[i].thumbnail_sel
                    : this.url + this.contentItems[i].thumbnail_nor;

                if (changePos) {
                    $(this.contentList[i]).css({
                        'transform': 'translate(0px, '
                            + (topPos + (i*this.elementHeight)) + 'px) scale(1.0)',
                        'background-image': 'url(' + image + ')'
                    });
                } else {
                    $(this.contentList[i]).css({
                        'background-image': 'url(' + image + ')'
                    });
                }
            }
            /*
            this.nextContent.css({
                'transform': 'translate(0px, ' + this.elementHeight * this.displayCount + 'px) scale(0.0)',
                'background-image': 'url(' + this.url + this.contentItems[this.getIndexOffset(this.displayCount -1)].thumbnail_nor + ')'
            });
            */
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