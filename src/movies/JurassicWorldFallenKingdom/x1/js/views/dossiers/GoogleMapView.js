/**
 * Created by michelleli on 2017-05-29.
 */
define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'platform/views/interactiveComp',
    'text!experience/templates/dossiers/GoogleMapView.html'
], function($, _, Backbone, Hammer, InteractiveComp, template) {
    return InteractiveComp.View.extend({
        className: 'google-map-view popup-component',

        events: {
            "click .close-button-clickable-area" : "onBackButtonPressed"
        },

        initialize: function (options) {
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.baseUrl = options.app.titleMetaData.title.base_url;

            this.audioSrc = "Assets/Audio/AB_Dossier_menu_audio.mp3?NO_MTHEORY_DECODER";

            this.characterName = options.locationData.characterName;
            this.locations = options.locationData.locations;

            this.currentLocationCoords = {};
            this.minMapZoom = 3;
            this.SATELLITE_ICON = "Assets/Image/Artwork/Backgrounds/Dossiers_Places/AtomicBlonde_Dossier_CharacterFile_Places_Map_satalite.png";
            this.ROADMAP_ICON = "Assets/Image/Artwork/Backgrounds/Dossiers_Places/AtomicBlonde_Dossier_CharacterFile_Places_Map_roadmap.png";

            this.currentPage = 1;
            this.pageSize = 99; // Set to unreasonably large page size as there are no pages in this particular view

            this.listenTo(this.fm, "activeElementChanged", this.locationChanged);
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Pitch Perfect 3 Dossiers Experience - Places");
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        onAppAssociation: function () {
            InteractiveComp.View.prototype.onAppAssociation.apply(this, Array.prototype.slice.call(arguments));

            this.refreshLocations();

            if (this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setPage("Google Map Page for " + this.characterName, true);
            }
        },


        locationChanged: function(trigger, el, hitEnter, previousEl) {
            if (this.$el.find(el).length > 0) {
                if (this.currentElement === el) {
                    return;
                }

                if (previousEl && previousEl.className && el && el.className && el.className.includes("location-item")) {
                    if (previousEl.className.includes("location-item")) {
                        $(this.currentElement).css({backgroundImage:'url("' + this.getCurrentLocation().title_nor + '")'});

                        this.currentElement = el;

                        this.updateBackgroundImage();

                        if (this.OmnitureAnalyticsHelper && !hitEnter) {
                            this.OmnitureAnalyticsHelper.setAction("Change Google Map Location to: " + this.getCurrentLocation().name, true);
                        }
                    } else if (previousEl.className.includes("map-nav") || previousEl.id === "video-clip") {
                        if (this.browserPlatformHelper.isExperienceOnEmulator() || (this.app && this.app.debug)) {
                            if (this.currentElement) {
                                this.fm.initFocus($(this.currentElement).attr("data-position"), true, true, true, true);
                            }
                        } else {
                            if (this.currentElement) {
                                $(this.currentElement).css({backgroundImage: 'url("' + this.getCurrentLocation().title_nor + '")'});
                            }
                            this.fm.initFocus($(el).attr("data-position"), true, true, true, true);
                            $(el).css({backgroundImage: 'url("' + this.getCurrentLocation().title_sel + '")'});
                        }
                    }
                }
            }
        },

        onBackButtonPressed: function() {
            if (!this.fm.blockKeyDown) {
                this.OmnitureAnalyticsHelper.setAction("Exit Pitch Perfect 3 Dossiers Experience - Places", true);

                InteractiveComp.View.prototype.onBackButtonPressed.call(this, { type: 'fade' });

                this.app.toggleKeyPress(true);
            }
        },

        selectcontent: function () {
            if (!this.isMobileBrowser) {
                this.updateBackgroundImage();

                this.fm.initFocus("1,1", true, true, true, true);
            }
        },

        render: function() {
            var self = this;

            $(this.el).html(_.template(template));

            this.audio = $('#audio-content');

            this.closeButton = $('div.close', this.el);
            this.closeButtonClickableArea = $('div.close-button-clickable-area', this.el);

            this.header = $('#header', this.el);
            this.locationsElement = $('#locations', this.el);
            this.googleMapApiView = $('#google-map-api-view', this.el);
            this.satelliteToggleIcon = $('#google-map-satellite-view', this.el);
            this.videoThumb = $('#video-thumb', this.el);
            this.text = $("#text", this.el);
            this.deClassifyButon = $('#text-declassify-button', this.el);

            this.fm.firstElementIndex = "1,4";
            this.initFocusManager();

            this.header.css('background-image', 'url("' + this.getCurrentLocation().header + '")');

            return this;
        },

        updateBackgroundImage: function (coordinates) {
            var self = this;

            if (!this.currentElement || this.currentElement.className.includes("location-item")) {
                $(this.currentElement).css({backgroundImage: 'url("' + this.getCurrentLocation().title_sel + '")'});

                this.videoThumb.css('background-image', 'url("' + this.getCurrentLocation().video.thumb + '")');

                this.deClassifyButon.fadeIn(function(){
                    this.setEnabled(this.deClassifyButon[0], true);
                }.bind(this));

                if (!coordinates) {
                    this.text.hide();
                    this.text.css({
                        'background-image': 'url("' + this.getCurrentLocation().text.classified + '")'
                    });
                    this.text.fadeIn();

                    this.currentLocationCoords = this.getCurrentLocation().coordinates.story;
                }
                if (!this.googlemap) {
                    setTimeout(function () {
                        self.googlemap = new google.maps.Map(document.getElementById('map'), {
                            center: {lat: self.currentLocationCoords.lat, lng: self.currentLocationCoords.lng},
                            zoom: self.currentLocationCoords.zoom,
                            minZoom: this.minMapZoom,
                            maxZoom: self.currentLocationCoords.max_zoom,
                            scrollwheel: false,
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            disableDefaultUI: true
                        });

                        if (self.marker) {
                            self.marker.setMap(null);
                        }
                        self.marker = new google.maps.Marker({
                            map: self.googlemap,
                            position: self.currentLocationCoords,
                            title: 'Marker',
                            icon: 'Assets/Image/Artwork/Backgrounds/Dossiers_Places/AtomicBlonde_Dossier_CharacterFile_Places_Map_marker.png'
                        });

                        self.googlemap.setCenter(self.marker.getPosition());
                    });
                } else {
                    self.googlemap.setCenter({
                        lat: self.currentLocationCoords.lat,
                        lng: self.currentLocationCoords.lng
                    });
                    self.googlemap.setZoom(self.currentLocationCoords.zoom);
                    if (self.marker) {
                        self.marker.setMap(null);
                    }
                    self.marker = new google.maps.Marker({
                        map: self.googlemap,
                        position: self.currentLocationCoords,
                        title: 'Marker',
                        icon: 'Assets/Image/Artwork/Backgrounds/Dossiers_Places/AtomicBlonde_Dossier_CharacterFile_Places_Map_marker.png'
                    });
                    self.googlemap.setCenter(self.marker.getPosition());
                }
            }
        },

        satelliteToggle: function() {
            if (this.googlemap.mapTypeId == "roadmap") {
                this.googlemap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
                this.satelliteToggleIcon.css('background-image', 'url("' + this.ROADMAP_ICON + '")');
                this.OmnitureAnalyticsHelper.setAction("Change Google Map view to Setellite on: " + this.getCurrentLocation().name, true);
            } else if(this.googlemap.mapTypeId == "satellite"){
                this.googlemap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                this.satelliteToggleIcon.css('background-image', 'url("' + this.SATELLITE_ICON + '")');
                this.OmnitureAnalyticsHelper.setAction("Change Google Map view to Roadmap on: " + this.getCurrentLocation().name, true);
            }
        },

        getCurrentLocation: function() {
            var selectedContentIndex = $(this.currentElement).attr("data-role");
            var selectIndex = selectedContentIndex? parseInt(selectedContentIndex) : 0;
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
            if(value >= this.currentLocationCoords.max_zoom) {
                // disable zoom in
                this.$("#map-nav-zoom-in").attr({"data-disabled": 1});
                if(this.fm.active == this.$("#map-nav-zoom-in")[0]) this.fm.initFocus( this.$("#map-nav-zoom-out").attr("data-position"), 1, 1, 1 );
            } else {
                this.$("#map-nav-zoom-in").removeAttr("data-disabled");
            }

            if(value <= this.minMapZoom ) {
                // disable zoom in
                this.$("#map-nav-zoom-out").attr({"data-disabled": 1});
                if(this.fm.active == this.$("#map-nav-zoom-out")[0]) this.fm.initFocus( this.$("#map-nav-zoom-in").attr("data-position"), 1, 1, 1 );
            } else {
                this.$("#map-nav-zoom-out").removeAttr("data-disabled");
            }
        },

        resume: function () {
            this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audioSrc, 2000);
        },

        onVideoClipSelect: function () {
            this.audio.animate({volume: 0}, this.app.getHalfDurationForTransition({ type: 'fade' }), 'linear', function(){
                this.audio[0].pause();
                this.app.playContent(this.getCurrentLocation().video.asset);
            }.bind(this));
        },

        toggleClassified: function () {
            this.currentLocationCoords = this.getCurrentLocation().coordinates.filming;

            this.updateBackgroundImage(this.currentLocationCoords);

            this.setEnabled(this.deClassifyButon[0], false);
            this.deClassifyButon.fadeOut(100);
            this.text.fadeOut(100, function () {
                this.text.css({ 'background-image': 'url("' + this.getCurrentLocation().text.de_classified + '")' });
                this.text.fadeIn(function(){
                    this.fm.initFocus("1,1", true, true, true, true);
                }.bind(this));
            }.bind(this));
        },

        refreshLocations: function() {
            var self = this;

            this.locationsElement.empty();
            var newLocations = this.locations.slice( (this.currentPage - 1) * this.pageSize, (this.currentPage) * this.pageSize );
            var i = 0;
            _.each(newLocations, function(location) {
                var style =
                    "position: absolute;" +
                    "top: " + (location.title_coords.top_fixed + i * location.title_coords.height) + "px; " +
                    "background-image: url('" + location.title_nor + "')";

                const mobileView = !(self.browserPlatformHelper.isExperienceOnEmulator() || (self.app && self.app.debug)) ? "mobileView" : "";
                $('<div class="focusable ' + mobileView + ' location-item"' +
                    'data-position="' + (i + 1) + ',4"' +
                    'data-left-position="1,1"' +
                    'data-action="selectcontent"' +
                    'data-role="' + location.index + '"' +
                    'style="' + style + '"' +
                    '></div>').appendTo(self.locationsElement[0]);

                if (i === newLocations.length - 1) {
                    var $firstLocation = self.locationsElement.children().first();
                    $firstLocation.attr('data-up-position', $firstLocation.attr("data-position"));

                    if (self.locations.length <= self.pageSize) {
                        var $lastLocation = self.locationsElement.children().last();
                        $lastLocation.attr('data-down-position', $lastLocation.attr("data-position"));
                    }

                    self.currentElement = $firstLocation[0];

                    self.initFocusManager();
                    self.fm.initFocus($firstLocation.attr("data-position"), true, true, true, true);
                    self.updateBackgroundImage();
                }

                i++;
            });
        }
    });
});