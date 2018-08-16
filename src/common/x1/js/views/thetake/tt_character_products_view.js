/**
 * Created by Diana Fisher on 5/31/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTCharacterProductsView.html',
    'platform/collections/thetake_products_by_character_collection',
    'platform/views/thetake/tt_product_thumb_view'
], function($, _, Backbone, InteractiveComp, template, TTProductsByCharacterCollection, TTProductThumbView) {

    return InteractiveComp.View.extend({

        initialize: function(options) {

            this.isLoading = false;
            this.mediaId = options.mediaId;
            this.headers = options.headers;

            this.data = {"characterName": options.characterName};

//            console.log(this.data);
            this.childViews = [];

            this.nextButtonActive = false;
            this.prevButtonActive = false;

            this.productCollection = new TTProductsByCharacterCollection([], options);

            this.loadProductsForCharacter();

            InteractiveComp.View.prototype.initialize.call(this);
        },

        delegateEvents: function() {
            InteractiveComp.View.prototype.delegateEvents.call(this);
            // make sure delegate events is called on all child views
            _.each(this.childViews, function(child) {
                if(child.delegateEvents) child.delegateEvents.apply(child);
            });
        },

        onButtonClick: function(e) {
            e.preventDefault();

            var target = $(e.target),
                action = target.data('action');

            if (action == 'loadNextPage') {
                this.loadNextPage();
            } else if (action == 'loadPreviousPage') {
                this.loadPreviousPage();
            }
        },

        loadNextPage: function() {
            if (this.isLoading) {
                return;
            }
//            console.log('loading next page..');
            this.productCollection.page += 1;  // Load next page
            this.loadProductsForCharacter();

            this.nextButtonActive = true;
            this.prevButtonActive = false;
        },

        loadPreviousPage: function() {
            if (this.isLoading) {
                return;
            }
//            console.log('loading previous page..');
            if (this.productCollection.page > 0) {
                this.productCollection.page -= 1;  // Load next page
                this.loadProductsForCharacter();

                this.nextButtonActive = false;
                this.prevButtonActive = true;
            }
        },



        render: function () {

            $(this.el).html(_.template(template, this.data));
            var self = this;

            // remove any existing views
            _.each(this.childViews, function(child) {
                child.remove();
            });
            this.childViews = [];

            _.each(this.productCollection.models, function(model, index){
//                console.log(model);

                // Calculate row and column
                var row = Math.floor(index/3) + 1;
                var col = index % 3;

                var element = $('#tt_character_products', self.el);

//                var frameUrl = model.attributes.keyFrameImage['500pxKeyFrameLink'];
//                if(frameUrl.indexOf('https://next-gen.s3.amazonaws.com/') != -1) {
//                    frameUrl = 'http://proxy.theplatform.services/' + frameUrl.substring('https://next-gen.s3.amazonaws.com/'.length);
////                    console.log('after update:' + frameUrl);
//                }

                var productData = {
                    'headers' : self.headers,
                    'position' : row + ',' + col,
                    'productId' : model.attributes.productId,
//                    'image' : frameUrl,
//                    'marker_x' : model.attributes.keyFrameProductX * 100,
//                    'marker_y' : model.attributes.keyFrameProductY * 100,
                    'image' : model.attributes.cropImage['500pxCropLink'],
                    'marker_x' : model.attributes.keyCropProductX * 100,
                    'marker_y' : model.attributes.keyCropProductY * 100,
                    'productName' : model.attributes.productName,
                    'productBrand' : model.attributes.productBrand

                };

                // Create the thumb view
                var thumbView = new TTProductThumbView({model: productData});
                self.childViews.push(thumbView);

                // Append the thumb view to the DOM.
                element.append(thumbView.render().el);

            });

            self.initFocusManager();

            if (self.nextButtonActive) {
                // set the focus on the Next Page button..
                this.fm.initFocus("3,1",1,0,1);
            } else if (self.prevButtonActive) {
                // set the focus on the Previous Page button..
                this.fm.initFocus("3,0",1,0,1);
            }

            return this;
        },

        onClose: function() {
            this.app.popView();
        },

        loadProductsForCharacter: function() {

            var self = this;

            this.productCollection.fetch({
                headers:this.headers,
                success: function(data) {
//                    console.log('character products collection fetch success.');
//                    console.log(data);
                    self.render();
                    self.isLoading = false;

                },
                error: function() {
                    console.log('error fetching tt_products.');
                }
            });
        }
    })

});


