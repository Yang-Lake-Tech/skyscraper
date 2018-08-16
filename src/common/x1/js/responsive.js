/**
 * @author Fabien Le Guillarm <fabien.leguillarm@trailerpark.com>
 */

'use strict';

define(['jquery',
	'underscore',
	'backbone'],function($,_,Backbone) {

		const APP_RATIO = 1920 / 1080
		const APP_INV_RATIO = 1 / APP_RATIO

		var Responsive = function(options) {

        	this.mAppContainer = $('#main-modal')
	        this.mAppWidth = 1280
	        this.mAppHeight = 720
        	this.mAppSizeRatio = 1

		    window.addEventListener(
		        'resize',
		        this.onResize.bind(this),
		        false
		    )
		    this.onResize()
		}

		_.extend(Responsive.prototype, Backbone.Events, {
			onResize: function () {
		        this.mWidth = $(window).width()
		        this.mHeight = $(window).height()
        		this.mWindowRatio = this.mWidth / this.mHeight

				if (this.mWindowRatio < APP_RATIO) {
		            // Will put black area on top and bottom
		            this.mAppWidth = this.mWidth
		            this.mAppHeight = this.mAppWidth * APP_INV_RATIO
		            this.mOffsetTop = (this.mHeight - this.mAppHeight) * 0.5
		            this.mOffsetLeft = 0
		            this.mAppSizeRatio = this.mAppWidth / 1280
		        } else {
		            // Will put black area on left and right
		            this.mAppHeight = this.mHeight
		            this.mAppWidth = this.mAppHeight * APP_RATIO
		            this.mOffsetTop = 0
		            this.mOffsetLeft = (this.mWidth - this.mAppWidth) * 0.5
		            this.mAppSizeRatio = this.mAppHeight / 720
		        }

        		//console.log(this.mAppSizeRatio)

		        this.mAppContainer.css({
		            //width: this.mAppWidth + 'px',
		            //height: this.mAppHeight + 'px',
		            top: this.mOffsetTop + 'px',
		            left: this.mOffsetLeft + 'px',
		            transform: 'scale('+this.mAppSizeRatio+', '+this.mAppSizeRatio+')'
		        })
			}
		});

		return Responsive;

})