/**
 * Created by Diana Fisher on 5/24/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTTrendingView.html',
    'platform/collections/thetake_product_collection',
    'platform/views/thetake/tt_product_thumb_view'
], function($, _, Backbone, InteractiveComp, template, TTProductCollection, TTProductThumbView) {

    return InteractiveComp.View.extend({

//        events: {
//            'click button' : 'onButtonClick'
//        },

        initialize: function(options) {

//            this.index = 0;
//            this.listenTo(this.collection, 'add', this.addOne);

            this.isLoading = false;
            this.mediaId = options.mediaId;
            this.headers = options.headers;
            this.parentView = options.parentView;
            this.childViews = [];

            this.nextButtonActive = false;
            this.prevButtonActive = false;

            this.productCollection = new TTProductCollection([], options);
            this.loadProducts();

            InteractiveComp.View.prototype.initialize.call(this);
//            this.listenTo(this.fm, "NEXT_PAGE", this.nextPage );

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

        nextPage: function() {
            console.log('next page..');
        },

        loadNextPage: function() {
            if (this.isLoading) {
                return;
            }
            console.log('loading next page..');
            this.productCollection.page += 1;  // Load next page
            this.loadProducts();

            this.nextButtonActive = true;
            this.prevButtonActive = false;
        },

        loadPreviousPage: function() {
            if (this.isLoading) {
                return;
            }
            console.log('loading previous page..');
            if (this.productCollection.page > 0) {
                this.productCollection.page -= 1;  // Load next page
                this.loadProducts();

                this.nextButtonActive = false;
                this.prevButtonActive = true;
            }
        },

        onActivated: function(item) {
            var position = item.attr('data-position');
            var product = this.findProductWithPosition(position);

            if(product) {
                product.showProductDetails(item[0]);
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

        render: function () {
            $(this.el).html(_.template(template, {}));
            var self = this;

            // remove any existing views
            _.each(this.childViews, function(child) {
                child.remove();
            });
            this.childViews = [];

            var element = $('#tt_trending', self.el);
            var startRow = 1;

            _.each(this.productCollection.models, function(model, index){
//                console.log(model);

                // Calculate row and column
                var row = Math.floor(index/3) + startRow;
                var col = index % 3;

//              

                var productData = {
                    'headers' : self.headers,
                    'position' : row + ',' + col,
                    'productId' : model.attributes.productId,
                    'image' : model.attributes.cropImage['500pxCropLink'],
                    'marker_x' : model.attributes.keyCropProductX * 100,
                    'marker_y' : model.attributes.keyCropProductY * 100,
                    'up_position' : row == startRow ? '0,0' : row - 1 + ',' + col,
                    'productName' : model.attributes.productName,
                    'productBrand' : model.attributes.productBrand
                };

                // Create the thumb view
                var thumbView = new TTProductThumbView({model: productData});
                self.childViews.push(thumbView);


                // Append the thumb view to the DOM.
                element.append(thumbView.render().el);

            });

            var dummyCount = 9 - self.childViews.length;
            var index = self.childViews.length - 1;

            for (var i = 0; i < dummyCount; i++) {
                index += 1;
                var row = Math.floor(index/3) + 1;
                var col = index % 3;
                var position = row + ',' + col;
                element.append('<div class="tt_trending_dummy" data-position="' + position + '" data-disabled="true">');
            }


            // reset parent focus manager once products are loaded
            self.parentView.resetFocusManager();

            if (self.nextButtonActive) {
                // set the focus on the Next Page button..
                this.fm.initFocus("3,1",1,0,1);
            } else if (self.prevButtonActive) {
                // set the focus on the Previous Page button..
                this.fm.initFocus("3,0",1,0,1);
            }

            return this;
        },


        loadProducts: function() {

            var self = this;

            this.productCollection.fetch({
                headers:this.headers,
                success: function(data) {
                    self.render();
                    self.isLoading = false;
                    self.deferred.resolve();
                },
                error: function() {
                    self.deferred.reject();
                    console.log('error fetching tt_products.');
                }
            });
        }


      
    })

});

