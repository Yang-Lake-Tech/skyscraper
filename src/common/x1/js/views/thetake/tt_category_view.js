/**
 * Created by Diana Fisher on 5/6/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTCategoryView.html',
    'platform/collections/thetake_category_products_collection',
    'platform/views/thetake/tt_product_thumb_view',
    'platform/views/thetake/tt_category_header_view'
], function($, _, Backbone, InteractiveComp, template, TTCategoryProductsCollection, TTProductThumbView, TTCategoryHeaderView) {

    return InteractiveComp.View.extend({

        initialize: function(options) {

            this.isLoading = false;
            this.mediaId = options.mediaId;
            this.headers = options.headers;
            this.categoryId = options.categoryId;
            this.categoryModel = options.categoryModel;
            this.parentView = options.parentView;
            this.parentHighlightPosition = options.parentHighlightPosition;

            this.childViews = [];
            this.productThumbs = [];

            this.productCollection = new TTCategoryProductsCollection([], options);
            this.rowOffset = 1;
            this.highlightCategory = '0,0';
            this.loadProducts();

            InteractiveComp.View.prototype.initialize.call(this);
        },

        preload: true,

        delegateEvents: function() {
            InteractiveComp.View.prototype.delegateEvents.call(this);
            // make sure delegate events is called on all child views
            _.each(this.childViews, function(child) {
                if(child.delegateEvents) child.delegateEvents.apply(child);
            });
        },

        loadNextPage: function() {
            if (this.isLoading) {
                return;
            }
            console.log('loading next page..');
            this.productCollection.page += 1;  // Load next page
            this.loadProducts();

        },

        loadPreviousPage: function() {
            if (this.isLoading) {
                return;
            }
            console.log('loading previous page..');
            if (this.productCollection.page > 0) {
                this.productCollection.page -= 1;  // Load previous page
                this.loadProducts();

            }
        },

        onActivated: function(item) {
            var position = item.attr('data-position');
            var row = position.split(',')[0];

            console.log('onActivated ' + position);

            if(row >= this.rowOffset) {
                // thumbnail selected
                var product = this.findProductWithPosition(position);

                if (product) {
                    product.showProductDetails(item[0]);
                    // call loadassets of parentView, because its the one which is sent to pushView, check router.pushView for more
                }
            } else {
                // sub-category selected
                this.onCategory(item[0]);
            }
        },

        findProductWithPosition: function(position) {
            for(var i = 0, n = this.childViews.length; i < n; i++) {
                if(this.childViews[i].model.position == position) {
                    return this.childViews[i];
                }
            }

            return undefined;
        },

        renderProducts: function () {

            $('.tt_category_dummy').find().remove();

            // remove any existing views
            _.each(this.productThumbs, function(thumb) {
                thumb.remove();
            });
            this.productThumbs = [];

            var self = this;
            var element = $('#tt_category', self.el);

            _.each(this.productCollection.models, function(model, index){
//                console.log(model);

                // Calculate row and column
                var row = Math.floor(index/3) + self.rowOffset;
                var col = index % 3;

//                var frameUrl = model.attributes.keyFrameImage['500pxKeyFrameLink'];
//                if(frameUrl.indexOf('https://next-gen.s3.amazonaws.com/') != -1) {
//                    frameUrl = 'http://proxy.theplatform.services/' + frameUrl.substring('https://next-gen.s3.amazonaws.com/'.length);
////                    console.log('after update:' + frameUrl);
//                }

                var productData = {
                    'headers' : self.headers,
                    'position' : row + ',' + col,
                    'productId' : model.attributes.productId,
                    'image' : model.attributes.cropImage['500pxCropLink'],
                    'marker_x' : model.attributes.keyCropProductX * 100,
                    'marker_y' : model.attributes.keyCropProductY * 100,
                    'up_position' : row == self.rowOffset ? self.highlightCategory : row - 1 + ',' + col,
                    'right_position' : col == 2 ? self.parentView.closePosition : row + ',' + (col + 1),
//                    'image' : frameUrl,
//                    'marker_x' : model.attributes.keyFrameProductX * 100,
//                    'marker_y' : model.attributes.keyFrameProductY * 100,
                    'productName' : model.attributes.productName,
                    'productBrand' : model.attributes.productBrand
                };

                // Create the thumb view
                var thumbView = new TTProductThumbView({model: productData});
                self.childViews.push(thumbView);
                self.productThumbs.push(thumbView);
                // Append the thumb view to the DOM.
                element.append(thumbView.render().el);

                
            });

/*
            var dummyCount = 9 - self.productThumbs.length;
            var index = self.productThumbs.length - 1;

            for (var i = 0; i < dummyCount; i++) {
                index += 1;
                var row = Math.floor(index/3) + 1;
                var col = index % 3;
                var position = row + ',' + col;
                element.append('<div class="tt_category_dummy" data-position="' + position + '" data-disabled="true">');
            }
*/
            self.parentView.resetFocusManager();

        },

        renderSubCategories: function () {
            var self = this;

            // Add the sub-categories.
            var startIndex = 1;
            var subCategories = this.categoryModel.attributes.childCategories;
            if (subCategories.length < 2) {
                startIndex = 0;
            } else {
                // Add ALL category
                var element = $('.tt_sub_categories', self.el);
                var index = 0;
                var categoryData = {
                    'position' : '1,0',
                    'categoryId' : this.categoryId,
                    'categoryName' : 'All',
                    'upPosition': this.parentHighlightPosition
                };
                var headerView = new TTCategoryHeaderView({model: categoryData});
                self.childViews.push(headerView);
                element.append(headerView.render().el);
            }

            // Loop through sub-categories..

            _.each(subCategories, function(model, index){
//                console.log(model.categoryName);

                // Calculate row and column
                var row = 1;
                var col = index + startIndex;

                var element = $('.tt_sub_categories', self.el);

                var categoryData = {
                    'position' : row + ',' + col,
                    'categoryId' : model.categoryId,
                    'categoryName' : model.categoryName,
                    'childCategories' : model.childCategories,
                    'upPosition': self.parentHighlightPosition
                };

                var headerView = new TTCategoryHeaderView({model: categoryData});
                self.childViews.push(headerView);
                element.append(headerView.render().el);

            });

            // Highlight the first sub-category.
            $('.tt_sub_categories li:nth-child(1)', this.el).addClass('highlighted');
            this.highlightCategory = '1,0';
        },

        render: function () {
            $(this.el).html(_.template(template, {}));

            // remove any existing views
            _.each(this.childViews, function(child) {
                child.remove();
            });
            this.childViews = [];

            var subCategories = this.categoryModel.attributes.childCategories;
            var count = subCategories.length;

            this.rowOffset = 1;
            // If there are no sub-categories...
            if (count < 1) {
                this.highlightCategory = '0,0';
            } else {
                this.rowOffset = 2;
                this.highlightCategory = '1,0';
                this.renderSubCategories();
            }

            this.renderProducts();
            this.parentView.resetFocusManager();

            return this;
        },


        loadProducts: function() {
            var self = this;

            this.isLoading = true;
            var self = this;

            this.productCollection.fetch({
                headers:this.headers,
                success: function(data) {
//                    console.log('product collection fetch success.');
//                    console.log(data);
                    self.renderProducts();
                    self.isLoading = false;
                    self.deferred.resolve();

                },
                error: function() {
                    console.log('error fetching tt_products.');
                }
            });
        },

        onCategory: function(el) {

            // Which category was selected?
            var categoryId = $(el).attr("data-role");
            this.categoryPosition = $(el).attr("data-position");
//            console.log(this.categoryPosition);
//            console.log(categoryId);

            // remove all of the current thumbnails.
            // remove any existing views
            _.each(this.productThumbs, function(thumb) {
                thumb.remove();
            });
            this.productThumbs = [];

            var column = $(el).attr("data-position").split(",")[1];
            var c = parseInt(column, 10) + 1;

            $('.tt_sub_categories').children().removeClass('highlighted');
            $('.tt_sub_categories li:nth-child(' + (c) + ')', this.el).addClass('highlighted');

            var options = {
                mediaId: this.mediaId,
                headers: this.headers,
                categoryId: categoryId
            };

            this.highlightCategory = '1,' + (c - 1);
            this.productCollection = new TTCategoryProductsCollection([], options);
            this.loadProducts();

        }

    })

});
