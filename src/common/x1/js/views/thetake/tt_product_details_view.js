/**
 * Created by Diana Fisher on 5/6/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'platform/collections/thetake_product_details_collection',
    'platform/collections/thetake_frame_product_collection',
    'platform/views/thetake/tt_product_small_view',
    'platform/views/thetake/tt_product_details_view',
    'platform/views/thetake/tt_getit_view',
    'text!platformTemplate/templates/thetake/TTProductDetailsView.html'
], function($, _, Backbone, InteractiveComp, TTProductDetails, TTFrameProducts, TTProductSmallView, TTProductDetailsView, TTGetItView, template){

    var TTProductDetailsView;
    TTProductDetailsView = InteractiveComp.View.extend({

        initialize: function (options) {

            this.headers = options.headers;
            this.childViews = [];

            this.fetchDetails(options.productId);

            InteractiveComp.View.prototype.initialize.call(this);

            this.productStack = [];

            this.listenTo(this.fm, 'backPressed', this.onClose);
        },

        delegateEvents: function () {
            InteractiveComp.View.prototype.delegateEvents.call(this);
            // make sure delegate events is called on all child views
            _.each(this.childViews, function (child) {
                if (child.delegateEvents) child.delegateEvents.apply(child);
            });
        },

        render: function () {

            var self = this;
            var count = 0;

            // remove any existing views
            _.each(this.childViews, function (child) {
                child.remove();
            });
            this.childViews = [];

            _.each(this.productDetails.models, function (model, index) {
                console.log(model);

                var title = model.attributes.verified ? 'EXACT MATCH' : 'CLOSE MATCH';

                var productDetails = {
                    'title' : title,
                    'productImage' : model.attributes.productImage['500pxLink'],
                    'productBrand' : model.attributes.productBrand,
                    'productName' : model.attributes.productName,
                    'productPrice' : model.attributes.productPrice,
                    'productId' : model.attributes.productId
                };

                $(self.el).html(_.template(template, productDetails));

                var soldOut = model.attributes.soldOut;
                var unavailable = model.attributes.unavailable;

                // hide the price if the item is unavailable.
                if (unavailable) {
                    $('.product-price').hide();
                    $('.tt_get_it').addClass('unavailable');
                } else {
                    $('.product-price').show();
                    $('.tt_get_it').removeClass('unavailable');
                }


//                console.log('soldOut = ' + soldOut);
//                console.log('unavailable = ' + unavailable);

                var showMoreInfo = (soldOut || unavailable);
//                console.log('showMoreInfo = ' + showMoreInfo);
                if (showMoreInfo) {
                    $('.tt_get_it').addClass('more_info');
                } else {
                    $('.tt_get_it').removeClass('more_info');
                }

                var left = 50;
                var deltaX = 220;
                var similarStyles = model.attributes['compProducts'];
//                console.log(similarStyles);

                var num_similar = similarStyles.length;

                switch(num_similar) {
                    case 1:
                        left = 270;
                        break;
                    case 2:
                        left = 160;
                        break;
                    default:
                        left = 50;
                        break;
                }

                var accessories = model.attributes['accessories'];
                var num_accessories = accessories.length;

                if (num_accessories == 0) {
                    $('.tt_more_from_outfit').hide();
                    left = 323;
                    deltaX = 350;
                    $('.tt_line').addClass('extended');
                    $('#tt_ss_header').addClass('extended');
                } else {
                    $('.tt_line').removeClass('extended');
                    $('#tt_ss_header').removeClass('extended');
                    $('tt_more_from_outfit').show();
                }
//                console.log(accessories);

                _.each(similarStyles, function (comp, index) {

                    if (index >= 3) {
                        return; // TEMP - show max 3 items
                    }

                    var row = 2;
                    var col = index;
                    var details = {
                        'position': row + ',' + col,
                        'productId': comp['compProductId'],
                        'image': comp['compProductImages']['500pxCompLink'],
                        'brand': comp['compBrand'],
                        'name': comp['compName'],
                        'price': comp['compPrice'],
                        'left': left + 'px'
                    };
                    count += 1;
                    left += deltaX;
                    var element = $('#tt_comps', self.el);
                    var smallProduct = new TTProductSmallView({model: details});

                    self.listenTo(smallProduct, 'productSelected', self.onCompSelected);
                    self.childViews.push(smallProduct);

                    element.after(smallProduct.render().el);
                });

                switch(num_accessories) {
                    case 1:
                        left = 1020;
                        break;
                    case 2:
                        left = 910;
                        break;
                    default:
                        left = 800;
                        break;
                }

                _.each(accessories, function (accessory, index) {

                    if (index >= 3) {
                        return; // TEMP - show max 3 items
                    }

                    var row = 2;
                    var col = count + index;
                    var details = {
                        'position': row + ',' + col,
                        'productId': accessory['productId'],
                        'image': accessory['productImage']['500pxLink'],
                        'brand': accessory['productBrand'],
                        'name': accessory['productName'],
                        'price': accessory['productPrice'],
                        'left': left + 'px'
                    };
                    left += 220;

                    var element = $('#tt_accessories_header', self.el);
                    var smallProduct = new TTProductSmallView({model: details});
                    self.listenTo(smallProduct, 'productSelected', self.onAccessorySelected);
                    self.childViews.push(smallProduct);
                    element.after(smallProduct.render().el);
                });

            });

            //If on comcast Cromium OS - hide X button
            if(navigator.userAgent.match(/CrOS/i) || navigator.userAgent.match(/M-Theory-Chromium/i) ){
                //$('.close').attr("data-disabled",true);
                $('.close').hide();
            }

            this.displayBackButton();
            self.initFocusManager();
            // Set the focus on the close button
            $('div')
            self.fm.initFocus('2,0', 1, 0, 1);
            return this;
        },

        fetchDetails: function (productId) {
//            console.log('fetchDetails for productId ' + productId);
            var options = {productId: productId};
            this.productDetails = new TTProductDetails([], options);

            var self = this;

            this.productDetails.fetch({
                headers: this.headers,
                success: function (data) {
//                    console.log('product details fetch success.');
//                    console.log(data);
                    self.render();
                },
                error: function () {
                    console.log('error fetching tt_product_details.');
                }
            });
        },

        onClose: function () {
            this.app.popView();
        },

        onBack: function () {
//            console.log(this.productStack);
            // Get the previous product id and fetch details for it.
            var previousProductId = this.productStack.pop();
            if (previousProductId) {
                this.fetchDetails(previousProductId);
            }
            this.displayBackButton();
        },

        displayBackButton: function () {
            var backButton = $('.tt_back_button');
            // If there are no products in the stack, hide the back button.
            if (this.productStack.length > 0) {
                // show and enable back button
                backButton.removeAttr("data-disabled");
                backButton.show();
            } else {
                // hide and disable back button
                backButton.attr("data-disabled", true);
                backButton.hide();
            }
        },

        onGetIt: function (el) {
//            console.log('get it!');
            // Which product was selected?
            var product = $(el).attr("data-role");
//            console.log(product);
            var detailModel = this.productDetails.models[0];
//            console.log(detailModel);

            var soldOut = detailModel.attributes.soldOut;
            var unavailable = detailModel.attributes.unavailable;
            var showMoreInfo = (soldOut || unavailable);
            var titleText = 'Get it at';
            if (showMoreInfo) {
                titleText = 'More info at'
            }

            var getItModel = {
                "productId": detailModel.attributes.productId,
                "productImage": detailModel.attributes.productImage['500pxLink'],
                "shortUrl": detailModel.attributes.shortUrl,
                "titleText": titleText
            };

            var getItView = new TTGetItView({model: getItModel});
            getItView.render();
            this.app.pushView(getItView);
        },

        onShare: function (el) {
//            console.log('share!');
            // Which product was selected?
            var product = $(el).attr("data-role");
//            console.log(product);
        },

        onAccessorySelected: function (productId) {
//            console.log('product selected ' + productId);
            // Push the current product onto the stack.
            var currentProductId = this.productDetails.models[0].id;
//            console.log('current product id = ' + currentProductId);
            this.productStack.push(currentProductId);

            // Refresh the page data with information about this accessory.
            this.fetchDetails(productId);

        },

        onCompSelected: function (productId) {
//            console.log('comp product selected: ' + productId);

            // launch get it page
            var detailModel = this.productDetails.models[0];
//            console.log(detailModel);

            var productImage = detailModel.attributes.productImage['500pxLink'];

            _.each(detailModel.attributes.compProducts, function (comp) {
                if (comp.compProductId == productId) {
                    productImage = comp.compProductImages['500pxCompLink'];
                }
            });

            var soldOut = detailModel.attributes.soldOut;
            var unavailable = detailModel.attributes.unavailable;
            var showMoreInfo = (soldOut || unavailable);
            var titleText = 'Get it at';
            if (showMoreInfo) {
                titleText = 'More info at'
            }

            var getItModel = {
                "productId": detailModel.attributes.productId,
                "productImage": productImage,
                "shortUrl": detailModel.attributes.shortUrl,
                "titleText" : titleText
            };

            var getItView = new TTGetItView({model: getItModel});
            getItView.render();
            this.app.pushView(getItView);

//            // Refresh the page data with information about this comp product.
//            this.fetchDetails(productId);
        },

        onBackButtonPressed: null
    });

    return TTProductDetailsView
});

