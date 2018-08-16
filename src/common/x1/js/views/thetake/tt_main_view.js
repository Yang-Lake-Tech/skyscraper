/**
 * Created by Diana Fisher on 5/24/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTMainView.html',
    'platform/views/thetake/tt_trending_view',
    'platform/views/thetake/tt_characters_view',
    'platform/views/thetake/tt_category_header_view',
    'platform/views/thetake/tt_category_view',
    'platform/collections/thetake_product_category_collection'
], function($, _, Backbone, InteractiveComp, template, TTTrendingView, TTCharactersView, TTCategoryHeaderView, TTCategoryView, TTProductCategoryCollection) {

    return InteractiveComp.View.extend({

        className: "tt_main preload",

        mashape_headers: {
            "X-Mashape-Key": "zxuiCsa0SemshSHgCQUEbm709nd2p1976vkjsnIrqB4WOE2Pne"
        },

        initialize: function(options) {
            InteractiveComp.View.prototype.initialize.call(this);

            this.superView = options.superView;

            if (!options.mediaID) throw("media ID is required for styles.");

            this.mediaId = options.mediaID;

            this.loadCategories();

            this.$mainModal = $('#main-modal');

            this.listenTo(this.fm, 'enterPressed', this.onEnterPressed);
        },

        preload: true,

        onEnterPressed: function(el) {
            var active = $(this.fm.active);
            var position = active.attr('data-position');
            var row = position.split(',')[0];

            if(row > 0) {
                this.currentView.onActivated(active);
            }
        },

        render: function() {
            this.closeButton = $('div.close');
            this.closeButtonClickableArea = $('div.close-button-clickable-area');

            this.$subView = $('#sub-view');
            this.$hubNav = $('#hub-nav');
            this.$navLink = $('.nav-link');
            this.$contentText = $('#content-text');

            this.onViewLoad();

            return this;
        },

        onViewLoad: function (callback) {
            if (this.closeButton.length && this.closeButton.is(':visible')) {
                this.setEnabled(this.closeButton[0], false);
                this.closeButton.hide();
            }
            if (this.closeButtonClickableArea.length) {
                this.closeButtonClickableArea.hide();
            }

            this.$mainModal.css('left', 'calc((100vw - 1280px)/2)');
            this.$mainModal.css('width', '1920px');
            this.$mainModal.css('height', '1080px');
            this.$mainModal.css('transform', 'scale(0.67, 0.67)');
            this.$mainModal.css('-webkit-transform', 'scale(0.67, 0.67)');
            this.$mainModal.css('transform-origin', 'top left');
            this.$mainModal.css('-webkit-transform-origin', 'top left');

            if (this.superView) {
                if (this.$hubNav.length) {
                    this.$hubNav.attr('data-disabled', 'true');
                    this.$hubNav.hide();
                }
                if (this.$navLink.length) {
                    for (var i = 1; i <= 6; i++) {
                        $(this.$navLink[i]).hide();
                    }
                }
                if (this.$contentText.length) {
                    this.$contentText.hide();
                }

                InteractiveComp.View.prototype.onViewLoad.call(null, callback);
            }
        },

        remove: function () {
            this.$mainModal.css('left', '0');
            this.$mainModal.css('width', '1280px');
            this.$mainModal.css('height', '720px');
            this.$mainModal.css('transform', 'none');
            this.$mainModal.css('-webkit-transform', 'none');
            this.$mainModal.css('transform-origin', 'none');
            this.$mainModal.css('-webkit-transform-origin', 'none');
        },

        unloadView: function (callback) {
            if (this.superView && this.$subView.length) {
                this.$subView.fadeOut(function () {
                    this.$mainModal.css('left', '0');
                    this.$mainModal.css('width', '1280px');
                    this.$mainModal.css('height', '720px');
                    this.$mainModal.css('transform', 'none');
                    this.$mainModal.css('-webkit-transform', 'none');
                    this.$mainModal.css('transform-origin', 'none');
                    this.$mainModal.css('-webkit-transform-origin', 'none');

                    if (this.$hubNav.length) {
                        this.$hubNav.attr('data-disabled', '');
                        this.$hubNav.show();
                    }
                    if (this.$navLink.length) {
                        for (var i = 1; i <= 6; i++) {
                            $(this.$navLink[i]).show();
                        }
                    }
                    if (this.$contentText.length) {
                        this.$contentText.show();
                    }

                    if (this.closeButton.length && !this.closeButton.is(':visible')) {
                        this.setEnabled(this.closeButton[0], true);
                        this.closeButton.show();
                    }
                    if (this.closeButtonClickableArea.length) {
                        this.closeButtonClickableArea.show();
                    }

                    InteractiveComp.View.prototype.unloadView.call(this, callback);
                }.bind(this));
            } else {
                InteractiveComp.View.prototype.unloadView.apply(this, Array.prototype.slice.call(arguments));
            }
        },

        render_headers: function () {
            var self = this;
            var row = 0;
            var col = 0;

            this.closePosition = row + ',' + Math.min(this.categories.length + 1, 6);

            $(this.el).html(_.template(template, {closePosition: this.closePosition}));

            var element = $('#tt_category_list', self.el);

            _.each(this.categories.models, function(model, index){
//                console.log(model);

                // cap at 6 categories
                if (index > 5) return;
                // Calculate row and column
                col = index + 1;

                var categoryData = {
                    'position' : row + ',' + col,
                    'upPosition': self.closePosition,
                    'categoryId' : model.attributes.categoryId,
                    'categoryName' : model.attributes.categoryName,
                    'childCategories' : model.attributes.childCategories
                };

                var headerView = new TTCategoryHeaderView({model: categoryData});
                element.append(headerView.render().el);
            });

            $('#tt_category_list li:nth-child(1)', this.el).addClass('highlighted');


            // set data-position on close button.
            $('#NBC_UF_x_button', this.el).attr('data-position', this.closePosition);
            $('#NBC_UF_x_button', this.el).attr('data-down-position', '0,' + col);

            this.onTrending();
            this.initFocusManager();
            this.fm.initFocus();

            return this;
        },

        resetFocusManager: function() {
            var currentFocus = $(this.fm.active).attr('data-position');
            var highlightSubCategory = this.findHighlightSubCategory();

            if(highlightSubCategory) {
                for (var i = 0, n = this.categories.length + 1; i < n; i++) {
                    $('#tt_category_list li:nth-child(' + (i+1) + ')', this.el).attr('data-down-position', highlightSubCategory);
                }
            }

            this.initFocusManager();
            this.fm.initFocus(currentFocus, true, true, true);
        },

        findHighlightSubCategory: function() {
            var highlighted = $('.highlighted');

            for(var i = 0, n = highlighted.length; i < n; i++) {
                var element = $(highlighted[i]);
                var position = element.attr('data-position');
                var row = position.split(',')[0];

                if(row == 1) {
                    return position;
                }
            }

            return undefined;
        },

        onTrending: function() {
            var self = this;
            if (this.currentView) {
                this.currentView.remove();
            }
            var trendingView = new TTTrendingView({mediaId: this.mediaId, headers: this.mashape_headers, parentView: this});

            // Hold on to the current view.
            this.currentView = trendingView;

            $('#tt_category_list').children().removeClass('highlighted');
            $('#tt_category_list li:nth-child(1)', this.el).addClass('highlighted');
            $('#tt_category_list li').attr('data-down-position','1,0');
            $("#thetake-content", this.el).append(trendingView.el);

            trendingView.done(function() {
                self.deferred.resolve();
            })
        },

        onCharacter: function() {
            // Remove the current view.
            this.currentView.remove();

            // Create a new TTCharactersView.
            var characterView = new TTCharactersView({mediaId: this.mediaId, headers: this.mashape_headers});
//            characterView.render();

            $('#tt_category_list').children().removeClass('highlighted');
            $('#tt_category_list li:nth-child(2)', this.el).addClass('highlighted');

            this.currentView = characterView;

            $("#thetake-content", this.el).append(characterView.el);
            this.fm.addView(characterView);
        },

        onCategory: function(el) {
            var self = this;
            console.log('onCategory');
            // Remove the current view.

            // Which category was selected?
            var categoryId = $(el).attr("data-role");
//            console.log(categoryId);

            // Get the category model from the categories collection.
            var categoryModel = this.categories.get(categoryId);

            //load subCategories into subCategories attribute for subCat Navigation
            this.subCategories = categoryModel.get('childCategories');

            if(!categoryModel) {
                // if category cannot be found try finding within selected category
                // to address bug #9648
                return this.currentView.onCategory(el);
            }
            this.currentView.remove();
            var column = $(el).attr("data-position").split(",")[1];
            var c = parseInt(column, 10) + 1;

            var categoryView = new TTCategoryView({mediaId: this.mediaId, headers: this.mashape_headers, categoryId: categoryId, categoryModel: categoryModel, parentView: this, parentHighlightPosition: '0,' + (c-1)});
            this.listenTo(categoryView, "LOADING_SCREEN", function() { self.trigger("LOADING_SCREEN") });
            categoryView.render();
            this.currentView = categoryView;

            self.trigger("LOADING_SCREEN");

            categoryView.done(function() {
                self.loadAssets();
            });


            $('#tt_category_list').children().removeClass('highlighted');
            $('#tt_category_list li:nth-child(' + (c) + ')', this.el).addClass('highlighted');

            $("#thetake-content", this.el).append(categoryView.el);

            this.resetFocusManager();
        },

        onSubCategory: function(el) {
            // Remove the current view.
            this.currentView.remove();

            // Which category was selected?
            var categoryId = $(el).attr("data-role");
            //console.log(categoryId);

            // Get the category model from the categories collection.
            var categoryModel = this.subCategories.get(categoryId);
            var column = $(el).attr("data-position").split(",")[1];
            var c = parseInt(column, 10) + 1;

            var categoryView = new TTCategoryView({mediaId: this.mediaId, headers: this.mashape_headers, categoryId: categoryId, categoryModel: categoryModel, parentView: this, parentHighlightPosition: '0,' + (c-1)});
            categoryView.render();
            this.currentView = categoryView;


            $('#tt_category_list').children().removeClass('highlighted');
            $('#tt_category_list li:nth-child(' + (c) + ')', this.el).addClass('highlighted');

            $("#thetake-content", this.el).append(categoryView.el);

            this.resetFocusManager();
        },

        closeModal: function() {
            var self = this;

            require(["platform/router"],function(router) {
                var app = router.getApp();
                app.popView();
            });
        },

        loadCategories: function() {
            var options = {mediaId: this.mediaId};
            this.categories = new TTProductCategoryCollection([], options);

            var self = this;

            this.categories.fetch({
                headers:this.mashape_headers,
                success: function(data) {
//                    console.log('product categories collection fetch success.');
//                    console.log(data);
                    self.render_headers();
                    self.trigger("READY");
                },
                error: function() {
                    console.log('error fetching tt_product_categories.');
                }
            });
        }
    })

});
