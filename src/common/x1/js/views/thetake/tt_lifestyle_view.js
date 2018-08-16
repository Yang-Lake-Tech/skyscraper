/**
 * Created by Diana Fisher on 5/4/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTLifestyleTemplate.html',
    'platform/views/thetake/tt_characters_tab_view',
    'platform/views/thetake/tt_categories_tab_view',
    'platform/views/thetake/tt_products_by_character_tab_view',
    'platform/views/thetake/tt_product_details_view'
], function($, _, Backbone, InteractiveComp, TTLifestyleTemplate,
            TTCharactersTabView, TTCategoriesTabView, TTProductsByCharacterTabView, TTProductDetailsView){

   var TTLifestyleView = InteractiveComp.View.extend({

       mediaId: 410,         // media id for Pitch Perfect 2 is 410

       className: 'tt_lifestyle',

       mashape_headers: {
        "X-Mashape-Key": "zxuiCsa0SemshSHgCQUEbm709nd2p1976vkjsnIrqB4WOE2Pne"
       },

       initialize: function() {
           InteractiveComp.View.prototype.initialize.call(this);

           // Create the tab views.
           this.createCharacterTab();
           this.createCategoriesTab();
       },

       render: function() {

           $(this.el).html(_.template( TTLifestyleTemplate, {} ));

           this.initFocusManager();

           // start with character tab visible.
           this.showCharacterTab();

           return this;
       },

       createCharacterTab: function() {
           this.charactersTab = new TTCharactersTabView({mediaId: this.mediaId, headers: this.mashape_headers});

           // Listen to characterSelected events triggered by the charactersTab.
           this.listenTo(this.charactersTab, 'characterSelected', this.showCharacterProductsTab);

       },

       createCategoriesTab: function() {
           this.categoriesTab = new TTCategoriesTabView({mediaId: this.mediaId, headers: this.mashape_headers});
       },

       showCharacterTab: function() {
           console.log('character tab clicked');

           var element = $('#tab-content', this.el);
           element.html(this.charactersTab.render().el);

           // Let the focus manager know about this view.
           this.fm.addView(this.charactersTab);

       },

       showCategoryTab: function() {
           console.log('category tab clicked');
           var element = $('#tab-content', this.el);
           element.html(this.categoriesTab.render().el);

           // Let the focus manager know about this view.
           this.fm.addView(this.categoriesTab);

       },

       showCharacterProductsTab: function(characterId) {
           console.log('showCharacterProductsTab ' + characterId);

           var productsTabView = new TTProductsByCharacterTabView({mediaId: 230, headers:this.mashape_headers, characterId:0});

           var element = $('#tab-content', this.el);
           element.html(productsTabView.render().el);

           // Let the focus manager know about this view.
           this.fm.addView(productsTabView);

           // Listen to characterSelected events triggered by the charactersTab.
           this.listenTo(productsTabView, 'productSelected', this.showProductDetails);


       },

       showProductDetails: function(productId) {
           console.log('showProductDetails ' + productId);
           var productDetailsView = new TTProductDetailsView({headers:this.mashape_headers, productId:productId});


           this.app.pushView(productDetailsView);


//           var element = $('#tab-content', this.el);
//           element.html(productDetailsView.render().el);
//
//           // Let the focus manager know about this view.
//           this.fm.addView(productDetailsView);
//           this.delegateEvents();
       }




   });

    return TTLifestyleView

});