define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'three',
    'platform/views/interactiveComp',
    'text!templates/panoramavideo/panoramaVideo.html',
    'platform/tools',
    'platform/utils/math-util',
], function($
        , _
        , Backbone
        , Hammer
        , THREE
        , InteractiveComp
        , template
        , Tools
        , MathUtil) {
    var camera, scene, renderer;

    var difX = 0;
    var difY = 0;
    var DIF = 5;
    var paused = 0;

    var texture_placeholder,
    isUserInteracting = false,
    onMouseDownMouseX = 0, onMouseDownMouseY = 0,
    lon = 180, onMouseDownLon = 0,
    lat = 0, onMouseDownLat = 0,
    phi = 0, theta = 0;

    var rotateStart_ = new MathUtil.Vector2();
    var rotateEnd_ = new MathUtil.Vector2();
    var rotateDelta_ = new MathUtil.Vector2();
    var isDragging_ = false;

    var MOUSE_SPEED_X = 0.5;
    var MOUSE_SPEED_Y = 0.3;

    function onEnded() {

    }

    function onProgress() {

    }

    function init(video,container) {
        var container, mesh;

        var width = 1280;
        var height = 720;

        camera = new THREE.PerspectiveCamera( 75, width / height, 1, 1100 );
        camera.target = new THREE.Vector3( 0, 0, 0 );

        scene = new THREE.Scene();

        var geometry = new THREE.SphereGeometry( 500, 60, 40 );
        geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

        video.addEventListener('ended',onEnded,false);

        //TODO: if player skin needs to be implemented
        //video.addEventListener('progress',onProgress,false);

        var texture = new THREE.VideoTexture( video );
        texture.minFilter = THREE.LinearFilter;

        var material   = new THREE.MeshBasicMaterial( { map : texture } );

        mesh = new THREE.Mesh( geometry, material );

        scene.add( mesh );

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( width, height );
        container.append( renderer.domElement );

        document.addEventListener( 'keydown', onKeyDown, false);
        document.addEventListener( 'keyup', onKeyUp, false);

        window.addEventListener('mousemove', onMouseMove_);
        window.addEventListener('mousedown', onMouseDown_);
        window.addEventListener('mouseup', onMouseUp_);

        window.addEventListener('touchmove', onTouchMove_);
        window.addEventListener('touchstart', onTouchDown_);
        window.addEventListener('touchend', onTouchUp_);

        //window.addEventListener( 'resize', onWindowResize, false );
        return video;
    }

    function onTouchDown_(e) {
        if (Tools.isNull(e.touches)) return
        if (e.touches.length === 0) return
        onMouseDown_({
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        })
    }

    function onTouchMove_(e) {

        if (Tools.isNull(e.touches)) return
        if (e.touches.length === 0) return
        onMouseMove_({
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        })
        e.preventDefault()
    }

    function onTouchUp_(e) {

        if (Tools.isNull(e.touches)) return
        if (e.touches.length === 0) return
        onMouseUp_({
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        })
    }

    function onMouseDown_(e) {
        console.log('[PanoramaView] onMouseDown_')

        //this.el[0].play()
        rotateStart_.set(e.clientX, e.clientY)
        isDragging_ = true
    }

    function onMouseMove_(e) {

        if (!isDragging_ && !isPointerLocked_()) {
            return;
        }

        // Support pointer lock API.
        if (isPointerLocked_()) {
            var movementX = e.movementX || e.mozMovementX || 0;
            var movementY = e.movementY || e.mozMovementY || 0;
            rotateEnd_.set(rotateStart_.x - movementX, rotateStart_.y - movementY);
        } else {
            rotateEnd_.set(e.clientX, e.clientY);
        }
        // Calculate how much we moved in mouse space.
        rotateDelta_.subVectors(rotateEnd_, rotateStart_);
        rotateStart_.copy(rotateEnd_);

        // Keep track of the cumulative euler angles.
        phi -= 2 * Math.PI * rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
        theta -= 2 * Math.PI * rotateDelta_.x / screen.width * MOUSE_SPEED_X;

        // Prevent looking too far up or down.
        phi = Tools.clamp(phi, 0, Math.PI);
    }

    function onMouseUp_(e) {

        isDragging_ = false;
    }

    function isPointerLocked_() {
        var el = document.pointerLockElement || document.mozPointerLockElement ||
            document.webkitPointerLockElement;
        return el !== undefined;
    }

    function onKeyDown(event) {
        switch(event.keyCode) {
            case 179: // comcast play/pause button
            case 80: this.onPlayPause(); return true; // p

            case 37:
                difX = -DIF;
                break;
            case 39:
                difX = DIF;
                break;
            case 38:
                difY = DIF;
                break;
            case 40:
                difY = -DIF;
                break;
        }
        if(difX != 0 || difY != 0) pan();
    }

    function pan() {
        /*
        lon += difX;
        lat += difY;
        if(difX != 0 || difY != 0) setTimeout(pan,100);
        */
    }

    function onKeyUp(event) {
        difX = 0;
        difY = 0;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function animate() {
        if(!paused) {
            requestAnimationFrame( animate );
            update();
        }
    }

    function update() {
        if (!isDragging_) {
            lon += difX;
            lat += difY;


            lat = Math.max( - 85, Math.min( 85, lat ) );
            phi = THREE.Math.degToRad( 90 - lat );
            theta = THREE.Math.degToRad( lon );
        } else {
            lon = THREE.Math.radToDeg(theta)
            lat = -(THREE.Math.radToDeg(phi) - 90)
        }
        camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
        camera.target.y = 500 * Math.cos( phi );
        camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

        camera.lookAt( camera.target );

        /*
        // distortion
        camera.position.copy( camera.target ).negate();
        */

        renderer.render( scene, camera );
    }

    return InteractiveComp.View.extend({
        className: 'panorama_video',

        initialize: function(options) {
            console.log('panorama_video', options)
            InteractiveComp.View.prototype.initialize.call(this);
            this.listenTo(this.fm, 'backPressed', this.onClose);

            difX = 0;
            difY = 0;
            paused = false;
            isUserInteracting = false;
            lon = 180;
            lat = 0;
            phi = 0;
            theta = 0;

            this.data = options;
            this.hasAudio = 1;

            _.bindAll(this,"onEnded","onClose");
        },

        start: function() {
            this.$(".panorama-tutorial").remove();
            this.trigger("ACTIVATE_CLOSE");
            this.isUserInteracting = true;
            this.paused = false;
            this.video.play();
        },

        events: {
            'click .close-360': 'onClose'

        },

        render: function () {
            $(this.el).html(_.template(template, this.data));

            _.delay(function(){
                if (Tools.isMobile()) {
                    $('#panorama-tutorial').addClass('panorama-tutorial-mobile')
                }
            })
            //TODO: change this video to a generic video after consolidating all the video tags

            var video = this.video = document.createElement( 'video' );
            video.width = 1920;
            video.height = 1080;
            video.autoplay = false;

            video.src = this.data.baseURL + this.data.src;

            var video = init( video, $('#panorama-container'));
            animate();
            this.initFocusManager();
            video.addEventListener('ended',this.onEnded,false);
 			this.pause ();
            return this;
        },

        onPlayPause: function() {
            console.log("Play/Pause " + this.paused);
            var video = $('#video-plane');
            var rate = video[0].playbackRate;

            if (!this.paused) {
                if(rate != 1.0) {
                    video[0].defaultPlaybackRate = 1.0;
                    video[0].playbackRate = 1.0;
                } else {
                    this.pause();
                }
            } else {
                this.play();
            }
        },

        play: function() {
            this.playVideo();
        },

        onEnded: function() {
            this.trigger("close");
            this.onClose();
        },

        initVideo: function() {

        },

        onClose: function() {
            console.log("onClose" );
            paused = true;
            this.video.pause();
            this.video.src = "";
            delete this.video;
                this.app.popView();

            $(this.el).remove();

            //if (this.emulator()) {
            //} else {
            //    NativeBridge.AppShutdown();
           // }
        },

        pause: function() {
            this.paused = true;
            var video = $('#video-plane');
            this.video.pause();

        },

        emulator: function() {
            return navigator.userAgent.match(/CrOS/i) || navigator.userAgent.match(/M-Theory-Chromium/i)
        }
    })

});