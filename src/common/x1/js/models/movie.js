define([
    'jquery',
    'underscore',
    'backbone',
    'platform/models/search-model',
    'platform/models/user'
], function ($, _, Backbone, SearchModel, user ) {
    "use strict";

    var MovieModel =  Backbone.Model.extend({
        initialize: function (options) {
            var counter = 0;
            var self = this;
            var baseURL = options.app.titleMetaData.title.base_url;

            this.set('featureUrl', baseURL + options.feature.video_url);
            this.set('currentTime', 0);
            this.duration = options.feature.run_time;

            this.listenTo( user.get("bookmarks"), "add", function(model) {
                var content = self.findById( model.get("content_guid") );
                if(content) content.bookmarked = 1;
            });

             this.listenTo( user.get("bookmarks"), "remove", function(model) {
                var content = self.findById( model.get("content_guid") );
                if(content) content.bookmarked = 0;
            });

            var baseUrl = options.app.titleMetaData.title.base_url;

            // TODO - Map new metadata to old content item names for now, need to change code to use new metadata names directly.
            var allContentsMap = {};

            var allContents = options.app.titleMetaData.content.map(function(asset) {
                var smallThumb = self.getThumbnail(asset, baseUrl, '352x198');
                var mediumThumb = self.getThumbnail(asset, baseUrl, '714x406');
                var largeThumb = self.getThumbnail(asset, baseUrl, '1076x614');
                var pinVertThumb = self.getThumbnail(asset, baseUrl, '486x560');
                var pinHorThumb = self.getThumbnail(asset, baseUrl, '486x277');
                var assetURL = undefined;
                var prefix = '';

                if (asset.metadata && asset.metadata.video) {
                    assetURL = baseUrl + asset.metadata.video.url;
                }

                if (asset.content_type && asset.content_type != 'Featurette' && asset.content_type != 'Places') {
                    prefix = asset.content_type + ": ";
                }

                var res =  {
                    id: asset.guid, //type + '_' + (counter < 10 ? '0' + counter : counter),
                    mobileId: asset.mobile_guid,
                    viewName: asset.view_name,
                    stills: {small: smallThumb, medium: mediumThumb , large: largeThumb, pinHor: pinHorThumb, pinVert: pinVertThumb },
                    type: asset.asset_type,
                    name: asset.name,
                    assetName: assetURL,
                    duration: 60, // Default duration, currently used by related scenes, should be based on in-time, out-time
                    timeCode: parseInt(asset.timeline_time, 10),
                    section: '',
                    chapter: asset.chapter,
                    category: '',
                    // per Richard's request no prefix is used in title
                    prefix: prefix,
                    is_spoiler: asset.is_spoiler,
                    bookmarked: user.isBookmarked(asset.guid),
                    content_related: asset.content_related,
                    content_type: asset.content_type,
                    metadata: asset.metadata,
                    subDirectory:asset.subDirectory,
                    style_metadata: asset.style_metadata,
                    iframeSrc: asset.iframeSrc,
                    close_button: asset.close_button,
                    child_level: asset.child_level,
                    single_video_content: asset.single_video_content,
                    styleName: asset.style_name,
                    asset: asset
                };

                allContentsMap[asset.guid] = res;

                return res;
            });

            //console.log("bookmakrs retrieved");

            this.set('all_contents', allContentsMap); // keep all contents around for search functions (related scenes, etc)

            this.set('contents',allContents);

            // populate required fields
            var searchModel = new SearchModel({search_tags: options.app.titleMetaData.search_tags, contents: allContents});
            this.set('search-model', searchModel);

            // add saved bookmarks
            user.get("bookmarks").map(function(b) {

                var content = self.findById(b.get("content_guid"));
                if(content) content.bookmarked = 1;
            })
        },

        getThumbnail: function(asset, baseUrl, dimensions) {
            var thumbnail = _.findWhere(asset.thumbnails, {dimensions: dimensions});
            // if there is no thumbnail of the requested size, return the asset name to help with debugging
            if(thumbnail) {
                return baseUrl + thumbnail.url;
            } else {
                return asset.name;
            }
        },

        updateBookmarks: function() {
            this.get("contents").map(function(c) {
                c.bookmarked = user.isBookmarked(c.id);
            });
        },

        findById: function(id) {
            return this.get('all_contents')[id];
        },

        findByAssetName: function(name) {
            var contents = this.get('contents');
            for(var i = 0, n = contents.length; i < n; i++) {
                if(contents[i].assetName == name) {
                    return contents[i];
                }
            }

            return undefined;
        },

        parseTimeCode: function(tc) {
            if(!tc || "NA" == tc)
                return undefined;

            var parts = tc.split(':');
            var h = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10);
            var s = parseInt(parts[2], 10);
            var f = parts.length > 3 ? parseInt(parts[3], 10) : 0;
            var base = 0; // 00:00:00:00 as seconds
            var seconds = (h * 60 * 60) + (m * 60) + (s) + (f / 24);

            return seconds - base;
        },

        parseDuration: function(duration) {
            if(!duration || "NA" == duration)
                return undefined;

            var parts = duration.split(':');
            var m = parts[0] ? parseInt(parts[0], 10) : 0;
            var s = parseInt(parts[1], 10);

            return (m * 60) + s;
        }
    });

    return MovieModel;
});
