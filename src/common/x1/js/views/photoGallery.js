define([
	'jquery',
	'underscore',
	'backbone',
	'platform/views/interactiveComp',
	'text!platformTemplate/templates/photoGallery.html'
], function($, _, Backbone, InteractiveComp, tmp){
	
	var PhotoGallery = InteractiveComp.View.extend({
		className: "photoGallery",
		id:'photoGallery',
		initialize: function( data ) {
			InteractiveComp.View.prototype.initialize.call(this, data);
			this.fm.firstElementIndex = "0,1";
			this.curIndex = (data.currentImage !== undefined) ? (data.currentImage + 1) : 1;
			this.isLastImage = data.isLastImage;
			this.images = this.model.metadata.images;
			this.subDirectory = data.model.subDirectory ? data.model.subDirectory : "";
			this.baseURL = data.baseURL + this.subDirectory;
            this.noCloseOnRight = data.noCloseOnRight;
            this.styleName = data.model.styleName;

            this.listenTo(this.fm, 'keyDown', this.onKeyDown);
            this.listenTo(this.fm, 'keyUp', this.onKeyUp);
        },
        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Full Screen Photo Gallery: " + this.model.name, true);
        },
		events: {
			'click .right':'nextSlide',
			'click .left':'prevSlide'
		},
		onKeyDown: function (code) {
			if (code != this.KEY_LEFT && code != this.KEY_RIGHT) {
				return;
			}

			switch (code) {
				case this.KEY_LEFT:
                    if (this.curIndex > 0) {
                        $(".left").addClass('focused');
                        this.prevSlide();
                    }
                    break;
				case this.KEY_RIGHT:
                    if (this.curIndex < (this.images.length - 1)) {
                        $(".right").addClass('focused');
                        this.nextSlide();
                    }
                    break;
				default:
					break;
			}
		},
		onKeyUp: function () {
            $(".left").removeClass('focused');
            $(".right").removeClass('focused');
		},
        nextSlide: function() {
            this.OmnitureAnalyticsHelper.setAction("Right Arrow Clicked");
            this.play(1);
		},
		prevSlide: function() {
            this.OmnitureAnalyticsHelper.setAction("Left Arrow Clicked");
            this.play(-1);
		},
		play: function(offset) {
			var self = this;
			if(this.animating) return;
			if( !this.images ) self.curIndex = 0;
			else self.curIndex = (self.curIndex + offset) % (self.images.length);

			if(self.curIndex==self.images.length-1) {
				// make the back button to dissappear 
				// move focus to next
				self.$(".right").hide().attr("data-disabled",1);
				this.fm.initFocus("0,0",1,1,1);
				this.fm.firstElementIndex = "0,0";

			} else {
				// first focusable is always next arrow unmless its not there
				this.fm.firstElementIndex = "0,1";
				self.$(".right").show().removeAttr("data-disabled");
			}
 
			if(self.curIndex==0) {
				// make the back button to dissappear 
				// move focus to next
				self.$(".left").hide().attr("data-disabled",1);
				this.fm.initFocus("0,1",1,1,1);
			} else {
				self.$(".left").show().removeAttr("data-disabled");
				this.fm.initFocus("0,0",1,1,1);
			}

			var img = new Image();
			src = self.baseURL + self.images[self.curIndex].src;
			img.src = src;
			this.animating = 1;

			$(img).one("load", function() {
				var oldImg = self.$('.gallery .image img');
				var img2 = self.$('.gallery .image').append(img);
				$(img).css({
					opacity: 0
				});
				self.animating = 0;
				$(img).css({
					opacity: 1
				});
				oldImg.remove();
			});

			self.$('.gallery .bread-crumbs li.active').removeClass('active');
			self.$('.gallery .bread-crumbs li:nth-child(' + (self.curIndex + 1) + ')').addClass('active');

			function animDone(event) {
				self.animating = 0;
				// preload next image
				var next = (self.curIndex + offset) % (self.images.length);
				if (next > 0) {
					var img = new Image();
					src = self.baseURL + self.images[next].src;
					img.src = src;
				}
			}
			animDone();

            this.OmnitureAnalyticsHelper.setType("photo");
            this.OmnitureAnalyticsHelper.setAsset(img.src, true);
        },
		onClose: function(){
            this.OmnitureAnalyticsHelper.setAction("Exit Full Screen Photo Gallery", true);

            return {
            	resumePoint: {
            		photo: {
            			id: this.model.id,
			            currentIndex: this.curIndex,
			            currentImages: this.images
            		}
            	}
            };
        },
		onBackButtonPressed: function() {
            var returnData;
            if(this.onClose) returnData = this.onClose();
            this.trigger("close", returnData);

            this.OmnitureAnalyticsHelper.setAction("Exit Full Screen Photo Gallery", true);
        },
		render: function() {
			//console.log('render map')
			var self = this;
			// TODO: same indexing system for both cast and gallery
            if(this.curIndex) {
                this.curIndex--;
            }
			$(this.el).html(_.template( tmp)({size: this.images.length }) );
            $(this.el).addClass(this.styleName);
			if(self.images.length == 1){
					this.$('li.left').remove();
					this.$('li.right').remove();
			}
			this.initFocusManager();
			// draw the first image
			this.$('.gallery .image').html('<img src="' + self.baseURL + self.images[self.curIndex].src + '" />');
			self.$('.gallery .bread-crumbs  li:nth-child(' + (self.curIndex+1) + ')').addClass('active');
			if (this.curIndex === 0) {
                self.$(".left").hide().attr("data-disabled", true);
			}
            else if (this.curIndex === (self.images.length - 1)) {
                self.$(".right").hide().attr("data-disabled", true);
                this.fm.initFocus("0,0",1,1,1);
                this.fm.firstElementIndex = "0,0";
            }
			return this;
		}
	});

	return PhotoGallery
});