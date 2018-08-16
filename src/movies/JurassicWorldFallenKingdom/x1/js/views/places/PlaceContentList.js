/**
 * Created by michelleli on 2017-05-25.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!templates/places/PlaceContentList.html',
    'text!templates/dinoExplorer/DinoExplorerContentListLeft.html',
    'text!templates/dinoExplorer/DinoExplorerContentListRight.html',
    'platform/views/contentList'
], function($
    , _
    , Backbone
    , Hammer
    , InteractiveComp
    , template
    , templateDinoExplorerLeft
    , templateDinoExplorerRight
    , ContentList)
{

    return InteractiveComp.View.extend({
        className: 'content-list',

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);
            this.contents = options.contents;
            this.baseUrl = options.baseUrl + "Assets/Image/Artwork/Backgrounds/Places/Thumbnails/";
            this.iconBaseUrl = options.baseUrl + "Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/";
            if (options.listType !== undefined) {
                this.listType = options.listType;
            } else {
                this.listType = "default";
            }

            this.contentList = new ContentList({
                contentList: this.contents,
                displayCount: this.contents.length < 5 ? (this.contents.length+1) : 5,
                elementHeight: 96,
                parent: this,
                verticalOffset: Number(-100),
                contentMargin: Number(4)
            });

            this.listenTo(this.contentList, "CONTENT_HIGHLIGHTED", this.onClipHighlight);
            this.listenTo(this.contentList, "CONTENT_SELECTED", this.onClipSelect);
            //this.listenTo(this.fm, "activeElementChanged", this.contentChanged);
        },




        selectclose: function () {
            this.onBackButtonPressed();
        },

        selectaudio: function () {
            this.trigger("Audio_CONTENT");
        },

        selectcontent: function (content) {
            console.log("[PlaceContentList] selectcontent", content);
            this.trigger("SELECTED_CONTENT", content);
        },

        onBackButtonPressed: function () {
            this.trigger("ZoomOut_CONTENT");
        },

        render: function() {
            var self = this;

            var templateToLoad = template;

            if (this.listType == "DINO_EXPLORER_LEFT") {
                templateToLoad = templateDinoExplorerLeft;
            } else if (this.listType == "DINO_EXPLORER_RIGHT") {
                templateToLoad = templateDinoExplorerRight;
            }

            $(this.el).html(_.template(templateToLoad)({
                contents: this.contents,
                baseUrl: this.baseUrl,
                iconBaseUrl: this.iconBaseUrl
            }));
            this.fm.firstElementIndex = "1,0";
            this.fm.scrollFactor = 1.0;
            this.initFocusManager();

            setTimeout (function () {
                //if(this.isMobileBrowser) {
                //    self.setupScroll();
                //}
                //self.backgroundHeader =
                $('.backgroundHeader').css({
                    backgroundImage:'url("' + self.baseUrl + self.contents[1].header + '")'
                });

                self.itemContent = $('.itemContent')
                self.itemContent.css({
                    backgroundImage:'url("' + self.baseUrl + self.contents[1].asset + '")'
                });

                //self.onClipHighlight(this.contentList.getCurrentContent());
            });

            var clips = this.contentList.render();
            this.$("#content-items").html(clips.el);
            this.fm.addView(this.contentList);

            return this;
        },

        onClipHighlight: function (contentItem) {
            console.log("[PlaceContentList] onClipHighlight", contentItem);
            if (contentItem) {
                this.itemContent.css({
                    backgroundImage:'url("'
                        + this.baseUrl
                        + contentItem.asset
                        + '")'
                });
            }
        },

        onClipSelect: function (contentItem) {
            console.log("selected content index is " + contentItem);
            this.trigger("SELECTED_CONTENT", contentItem);
        },


        setupScroll: function () {
            var self = this;
            this.scrollable = $('.scrollable', self.el)[0];
            this.scrollableMaxTop = this.scrollable.scrollHeight -  this.scrollable.clientHeight;

            Hammer($('#main-modal')[0]).on('panstart', function(e){
                self.currentScrollTop = self.scrollable.scrollTop;
            });

            Hammer($('#main-modal')[0]).on('panup', function(e){
                self.currentScrollTop = (self.currentScrollTop - e.deltaY) > self.scrollableMaxTop  ?  self.scrollableMaxTop : + self.currentScrollTop - e.deltaY;
                $(self.scrollable).animate({scrollTop: self.currentScrollTop});
            });

            Hammer($('#main-modal')[0]).on('pandown', function(e){
                self.currentScrollTop = (self.currentScrollTop - e.deltaY) < 0 ? 0 : self.currentScrollTop - e.deltaY;
                $(self.scrollable).animate({scrollTop: self.currentScrollTop});
            });
        },

    });
});