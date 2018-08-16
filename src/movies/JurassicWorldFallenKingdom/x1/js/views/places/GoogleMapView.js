/**
 * Created by michelleli on 2017-05-29.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!templates/places/GoogleMapView.html'
], function($, _, Backbone, Hammer, InteractiveComp, template) {

    return InteractiveComp.View.extend({

        className: 'content-list',

        initialize: function (options) {
            console.log('[GoogleMapView] initialize', options)
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.listenTo(this.fm,"activeElementChanged",this.locationChanged);
            this.listenTo(this.fm, "SCROLLED_TO_TOP", this.scrolledToTop );
            this.listenTo(this.fm, "START_SCROLLED_DOWN", this.startScrolledDown );
            this.listenTo(this.fm, "SCROLLED_TO_BOTTOM", this.scrolledToBottom );
            this.listenTo(this.fm, "START_SCROLLED_UP", this.startScrolledUp );

            this.locations = options.locations;
            this.options = options

            this.backgroundUrl = "Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/";
            this.baseUrl = options.baseUrl + this.backgroundUrl;

            this.eventIndexGraphic = options.graphic;

            this.currentLocationCoords = {};
            this.minMapZoom = 2;
            this.SATELLITE_ICON = "Map_Toggle_Icon_satellite.png";
            this.ROADMAP_ICON = "Map_Toggle_Icon_map.png";
        },

        scrolledToTop: function () {
            //$('#location-list-up-arrow').fadeOut()
        },

        scrolledToBottom: function () {
            //$('#location-list-down-arrow').fadeOut()
        },

        startScrolledDown: function () {
            //$('#location-list-up-arrow').fadeIn()
        },

        startScrolledUp: function () {
            //$('#location-list-down-arrow').fadeIn()
        },

        locationChanged: function(index, el) {

            if ($("#google-map-panel-view").find(el).length > 0) {
                if(this.currentelement == el) {
                    return;
                }
                $(this.currentElement).find(".backgroundThumb").css({
                    //width: this.getCurrentLocation().title_nor_size[2] + 'px',
                    //height: this.getCurrentLocation().title_nor_size[3] + 'px',
                    backgroundImage:'url("'+this.baseUrl + this.getCurrentLocation().title_nor +'")'
                });
                $(this.currentElement).removeClass('selected');
                this.currentElement = el;

                this.updateBackgroundImage();

                if(this.OmnitureAnalyticsHelper){
                    this.OmnitureAnalyticsHelper.setAction("Change Google Map location to: " + this.getCurrentLocation().name, true);
                }
            }
        },

        onBackButtonPressed: function () {
            this.trigger("ZoomOut_Location");
        },

        selectcontent: function () {
            if(!this.isMobileBrowser) {
                this.fm.initFocus("2,0", true, true, true);
            }
        },

        render: function() {
            var self = this

            $(this.el).html(_.template(template)({
                locations: this.locations,
                baseUrl: this.baseUrl
            }));
            var $contentItems = $('.location-item' ,this.el);
            var $firstClip= $contentItems.first();
            $firstClip.attr('data-up-position', $firstClip.attr('data-position'));

            this.fm.firstElementIndex = "3,0";
            this.fm.scrollFactor = 1.0;
            this.initFocusManager();

            this.currentElement = this.fm.selected;
            this.updateBackgroundImage();
            this.$("#place_events_index").css({backgroundImage:'url("'+this.baseUrl + this.eventIndexGraphic +'")'});

            this.satelliteToggleIcon = $('#google-map-satellite-view', this.el);

            _.delay(function(){
                //$('#place-events-location-marker').addClass(self.options.currentPlace.name)
                $('.place-specific').addClass(self.options.currentPlace.name)
                //$('#location-list-up-arrow').hide()
                
                /*if (self.locations.length <= 7) {
                    $('#location-list-down-arrow').hide()
                    $('#location-list-up-arrow').hide()
                }*/
            })

            return this;
        },

        updateBackgroundImage: function () {
            var self = this;
            $(this.currentElement).addClass('selected');
            $(this.currentElement).find(".backgroundThumb").css({
                //width: this.getCurrentLocation().title_nor_size[2] + 'px',
                //height: this.getCurrentLocation().title_nor_size[3] + 'px',
                backgroundImage:'url("'+this.baseUrl + this.getCurrentLocation().title_sel +'")'
            });
            this.$("#map-desc-text-view").css({backgroundImage:'url("'+this.baseUrl + this.getCurrentLocation().text +'")'});

            this.$("#map-title").css({backgroundImage:'url("'+this.baseUrl + this.getCurrentLocation().header +'")'});

            /*this.$('#place-events-location').css({
                backgroundImage:'url("'+this.baseUrl + this.getCurrentLocation().type_icon +'")'
            });*/

            this.currentLocationCoords = this.getCurrentLocation().coordinates;

            if (!this.googlemap) {
                setTimeout(function(){

                    self.googlemap = new google.maps.Map(document.getElementById('map'), {
                        center: {lat: self.currentLocationCoords.lat, lng: self.currentLocationCoords.lng},
                        zoom: self.currentLocationCoords.zoom,
                        maxZoom: self.currentLocationCoords.max_zoom,
                        scrollwheel: false,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        disableDefaultUI: true
                    });

                    if(self.marker){
                        self.marker.setMap(null);
                    }
                    self.marker = new google.maps.Marker({
                        map: self.googlemap,
                        position: self.currentLocationCoords,
                        title: 'Marker',
                        icon: 'Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/JWFK_Places_Map_GOOGLE_Marker.png'
                    });

                    self.googlemap.setCenter(self.marker.getPosition()); //Set
                });
            } else {
                self.googlemap.setCenter({lat: self.currentLocationCoords.lat, lng: self.currentLocationCoords.lng});
                self.googlemap.setZoom(self.currentLocationCoords.zoom);
                 if(self.marker){
                     self.marker.setMap(null);
                 }
                 self.marker = new google.maps.Marker({
                     map: self.googlemap,
                     position: self.currentLocationCoords,
                     title: 'Marker',
                     icon: 'Assets/Image/Artwork/Backgrounds/Places/Locations_And_GoogleMaps/JWFK_Places_Map_GOOGLE_Marker.png'
                 });
                self.googlemap.setCenter(self.marker.getPosition()); //Set
            }
        },

        satelliteToggle: function(){
            if(this.googlemap.mapTypeId == "roadmap"){
                this.googlemap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
                this.satelliteToggleIcon.removeClass('satellite')
                this.satelliteToggleIcon.addClass('maps')
                //this.satelliteToggleIcon.css('background-image', 'url("' + this.backgroundUrl + this.ROADMAP_ICON + '")');
                this.OmnitureAnalyticsHelper.setAction("Change Google Map view to Setellite on: " + this.getCurrentLocation().name, true);
            } else if(this.googlemap.mapTypeId == "satellite"){
                this.googlemap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                this.satelliteToggleIcon.removeClass('maps')
                this.satelliteToggleIcon.addClass('satellite')
                //this.satelliteToggleIcon.css('background-image', 'url("' + this.backgroundUrl + this.SATELLITE_ICON + '")');
                this.OmnitureAnalyticsHelper.setAction("Change Google Map view to Roadmap on: " + this.getCurrentLocation().name, true);
            }
        },

        getCurrentLocation: function() {
            var selectedContentIndex = $(this.currentElement).attr("data-role");
            var selectIndex = selectedContentIndex? parseInt(selectedContentIndex) :0;
            return this.locations[selectIndex];
        },

        mapZoomIn: function () {
            this.googlemap.setZoom(this.googlemap.getZoom() + 1);
            this.updateZoom(this.googlemap.getZoom());
            this.OmnitureAnalyticsHelper.setAction("Zoom in Google Map view: " + this.getCurrentLocation().name, true);
        },

        mapZoomOut: function () {
            this.googlemap.setZoom(Math.max(this.minMapZoom,this.googlemap.getZoom() - 1));
            this.updateZoom(this.googlemap.getZoom());
            this.OmnitureAnalyticsHelper.setAction("Zoom out Google Map view: " + this.getCurrentLocation().name, true);
        },

        updateZoom: function(value) {
            if(value>=this.currentLocationCoords.max_zoom) {
                // disable zoom in
                this.$("#map-nav-zoom-in").attr({"data-disabled":1});
                if(this.fm.active == this.$("#map-nav-zoom-in")[0]) this.fm.initFocus( this.$("#map-nav-zoom-out").attr("data-position"), 1, 1, 1 );
            } else {
                this.$("#map-nav-zoom-in").removeAttr("data-disabled");
            }

            if(value<=this.minMapZoom ) {
                // disable zoom in
                this.$("#map-nav-zoom-out").attr({"data-disabled":1});
                if(this.fm.active == this.$("#map-nav-zoom-out")[0]) this.fm.initFocus( this.$("#map-nav-zoom-in").attr("data-position"), 1, 1, 1 );
            } else {
                this.$("#map-nav-zoom-out").removeAttr("data-disabled");
            }

        },

        setUpPinchZoom: function () {
            var self = this;

            Hammer($('#google-map-api-view', self.el)[0]).on('pinchend', function( e ) {
                if(e.scale > 1){
                    self.mapZoomIn();
                }else{
                    self.mapZoomOut();
                }
            });
        }

    });
});