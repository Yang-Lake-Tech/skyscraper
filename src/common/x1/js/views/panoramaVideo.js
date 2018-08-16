define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'three',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/panoramaVideo.html'
], function($, _, Backbone, Hammer, THREE, InteractiveComp, template ) {
    var camera, scene, renderer;

    return InteractiveComp.View.extend({
        className: 'panorama_video',

        initialize: function(options) {
            this.data = options;

            InteractiveComp.View.prototype.initialize.call(this, options);

            this.skipPoster = options.skipPoster;
            this.data.metadata = options.metadata;
            this.data.src = options.metadata.video.url;
            this.data.initial_coords = options.metadata.video.initial_coords;
            this.lat = this.data.initial_coords[0];
            this.lon = this.data.initial_coords[1];
            this.difX = 0;
            this.difY = 0;
            this.paused = 0;

            this.hasAudio = 1;

            _.bindAll(this, "onEnded", "onClose");
        },

        start: function() {
            var canvas = $('canvas', this.el)[0];
            Hammer(canvas).on('pan', this.onPan.bind(this));
            Hammer(canvas).on('panstart', this.onPanStart.bind(this));
            Hammer(canvas).on('panend', this.onPanEnd.bind(this));

            this.$(".panorama-tutorial").remove();

            this.video.play();

            this.experienceStarted = true;

            setTimeout(function(){
                this.OmnitureAnalyticsHelper.setAction("User Starts 360 experience", true);
            }.bind(this));

            this.trigger("ACTIVATE_CLOSE");
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.setPage("Panorama 360 Experience");
            this.OmnitureAnalyticsHelper.onExperienceLoad();
        },

        render: function () {
            var self = this;

            $(this.el).html(_.template(template, this.data));
            //TODO: change this video to a generic video after consolidating all the video tags

            var video = this.video = document.createElement( 'video' );
            video.autoplay = false;
            video.loop = false;
            video.playsInline = true;
            
            video.src = this.data.baseURL + this.data.src;

            var video = this.setup3Denvironment.apply(this, [video, this.el]);
            this.animate();
            this.initFocusManager();
            video.addEventListener('ended', this.onEnded, false);

            this.fixTick = setInterval(function(){
                self.onTick();
            }, 1000);

            if (this.skipPoster) {
                console.log(this.data);
                this.start();
            }

            $('#start-experience').hide();

            return this;
        },

        setup3Denvironment: function (video,container) {
            this.difX = 0;
            this.difY = 0;
            this.DIF = 1.5;
            this.DIF_PAN = 2;
            this.paused = 0;

            var mesh;

            var width = 1280;
            var height = 720;

            camera = new THREE.PerspectiveCamera( 75, width / height, 1, 1100 );
            camera.target = new THREE.Vector3( 0, 0, 0 );

            scene = new THREE.Scene();

            var geometry = new THREE.SphereGeometry( 500, 60, 40 );
            geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

            var texture = new THREE.VideoTexture( video );
            texture.minFilter = THREE.LinearFilter;

            var material = new THREE.MeshBasicMaterial( { map : texture } );

            mesh = new THREE.Mesh( geometry, material );

            scene.add( mesh );

            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( width, height );
            container.appendChild( renderer.domElement );

            document.addEventListener( 'keydown', this.onKeyDown.bind(this), false);
            document.addEventListener( 'keyup', this.onKeyUp.bind(this), false);

            return video;
        },

        animate: function () {
            if (!this.paused) {
                requestAnimationFrame(this.animate.bind(this));
            }

            this.update();
        },

        update: function () {
            this.lon += this.difX;
            this.lat += this.difY;

            this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
            phi = THREE.Math.degToRad( 90 - this.lat );
            theta = THREE.Math.degToRad( this.lon );

            camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
            camera.target.y = 500 * Math.cos( phi );
            camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

            camera.lookAt( camera.target );

            renderer.render( scene, camera );
        },

        onKeyDown: function (event) {
            switch(event.keyCode) {
                case 37:
                    this.difX = -this.DIF;
                    break;
                case 39:
                    this.difX = this.DIF;
                    break;
                case 38:
                    this.difY = this.DIF;
                    break;
                case 40:
                    this.difY = -this.DIF;
                    break;
            }
        },

        onKeyUp: function () {
            this.difX = 0;
            this.difY = 0;
        },

        onPan: function (event) {
            if (event.isFinal) {
                this.difX = 0;
                this.difY = 0;
            }
            else {
                this.difX = -event.velocityX * this.DIF_PAN;
                this.difY = event.velocityY * this.DIF_PAN;
            }
        },

        onPanStart: function (event) {
            if (this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setAction
                (
                    "User started panning at "        +
                    this.video.currentTime       +
                    " seconds, Camera Target: [" +
                    camera.target.x + ", "       +
                    camera.target.y + ", "       +
                    camera.target.z + "]"
                    , true
                );
            }
        },

        onPanEnd: function (event) {
            if (this.OmnitureAnalyticsHelper) {
                this.OmnitureAnalyticsHelper.setAction
                (
                    "User ended panning at "        +
                    this.video.currentTime       +
                    " seconds, Camera Target: [" +
                    camera.target.x + ", "       +
                    camera.target.y + ", "       +
                    camera.target.z + "]"
                    , true
                );
            }
        },

        onTick: function () {
            if(this.OmnitureAnalyticsHelper && this.experienceStarted) {
                this.OmnitureAnalyticsHelper.set360_x(camera.target.x);
                this.OmnitureAnalyticsHelper.set360_y(camera.target.y);
                this.OmnitureAnalyticsHelper.set360_z(camera.target.z);
                this.OmnitureAnalyticsHelper.set360_time(this.video.currentTime, true);
            }
        },

        onEnded: function() {
            clearInterval(this.fixTick);

            this.video.pause();
            this.video.src = "";

            delete this.video;

            this.trigger("close");
        },

        onBackButtonPressed: function(){
            this.onClose();
            this.trigger("close");
        },

        onWindowResize: function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );
        },

        onClose: function() {
            this.OmnitureAnalyticsHelper.setAction("Exit Panorama 360 Experience", true);

            clearInterval(this.fixTick);

            this.paused = 1;

            this.video.pause();
            this.video.src = "";

            delete this.video;
            $(this.el).remove();
        },

        remove: function() {
            clearInterval(this.fixTick);

            this.paused = 1;

            if (this.video) {
                this.video.pause();
                this.video.src = "";
                delete this.video;
            }

            if (this.el) {
                $(this.el).remove();
            }
        }
    })
});
