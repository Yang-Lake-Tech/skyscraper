define([
    'platform/Platform',
    'experience/js/views/hub/HubView',
    'experience/js/views/featurettes/FeaturettesView',
    'experience/js/views/dossiers/DossiersView',
    'experience/js/views/dossiers/DossiersCharacterFilesView',
    'experience/js/views/dossiers/GoogleMapView',
    'experience/js/views/places/PlacesView',
    'experience/js/views/panoramaVideo/panoramaVideo',
    'experience/js/views/360_Map/360Map',
    'experience/js/views/dinoExplorer/DinoExplorerView',
    'experience/js/views/360/360View'
],function (Platform
        , HubView
        , FeaturettesView
        , DossiersView
        , DossiersCharacterFilesView
        , DossiersCharacterPlacesView
        , PlacesView
        , PanoramaVideo
        , Map360
        , DinoExplorerView
        , View360) {
    return function (contentItem, bookmark, data) {
        var experience;
        
        var urlParams = {};
        
        if (window.location.search.length > 1) {
            var params = window.location.search.slice(1).split('&')
            if (params) {
                params.forEach(function (param) {
                    var pArray = param.split('=')
                    urlParams[pArray[0]] = pArray[1]
                })
            }
        }

        var contentToLoad = contentItem.type.toLowerCase();

        if (urlParams["section"] != undefined && urlParams["section"] != 'hub') {
            experience = new HubView({
                app: this,
                experienceName: contentItem.content_type
            });
            experience.experienceName = contentItem.content_type;
            experience.render();

            this.pushView(experience, 0, 0, null, null, null, { type: "fade" });

            contentToLoad = urlParams["section"];    
        }

        switch (contentToLoad) {
            case "hub":
                experience = new HubView({
                    app: this,
                    experienceName: contentItem.content_type
                });
                experience.experienceName = contentItem.content_type;
                experience.render();
                
                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            case "map_360":
                experience = new Map360({
                    app: this,
                    experienceName: contentItem.content_type
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;

            case "360":
                experience = new View360({
                    app: this,
                    experienceName: contentItem.content_type
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;

            case "third_party":
            case "featurettes":
            case "jurassicjournal":
            case "the_final_climax":
            case "panorama_video_list":
                experience = new FeaturettesView({
                    app: this,
                    experienceName: contentItem.content_type,
                    assetType: contentItem.type,
                    contentItem: contentItem.asset
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            case 'dinoexplorer':
                experience = new DinoExplorerView({
                    app        : this,
                    superView  : null
                });
                experience.render();
                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            case 'places':
                experience = new PlacesView({
                    app        : this,
                    superView  : null
                });
                experience.render();
                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            case '360s_video':
                experience = new PanoramaVideo({
                    app        : this,
                    superView  : null
                });
                experience.render();
                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;





            case "story_in_motion":
                experience = new StoryInMotionView({
                    app: this,
                    experienceName: contentItem.content_type
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            case "dossiers":
                experience = new DossiersView({
                    app: this,
                    experienceName: contentItem.content_type
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            case "dossiers_character_files":
                experience = new DossiersCharacterFilesView({
                    app: this,
                    experienceName: contentItem.content_type,
                    contentItem: data
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "dip-fade" }, true);
                break;
            case "dossiers_character_places":
                experience = new DossiersCharacterPlacesView({
                    app: this,
                    experienceName: contentItem.content_type,
                    locationData: data
                });
                experience.experienceName = contentItem.content_type;
                experience.render();

                this.pushView(experience, 0, 0, null, null, null, { type: "fade" });
                break;
            default:
                Platform.Router.prototype.playContentItem.apply(this, Array.prototype.slice.call(arguments));
                break;
        }
    }
});