define([
    'jquery',
    'underscore',
    'backbone',
    'hammer',
    'three',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/panoramaInteractive.html',
    "platform/tools",
    'platform/utils/math-util',
    'experience/js/views/360/FloorNavigationView',
    'tween'
], function($, _, Backbone, Hammer, THREE, InteractiveComp, template, Tools, MathUtil, FloorNavigationView, TWEEN) {
    var camera, renderer;
    var MOUSE_SPEED_X = 0.5;
    var MOUSE_SPEED_Y = 0.3;

    return InteractiveComp.View.extend({
        className: 'panorama_video_interactive',

        initialize: function (options) {
            console.log('[panoramaInteractive] initialize', options)
            InteractiveComp.View.prototype.initialize.call(this, options);

            this.data = options;
            this.app = this.data.app;
            this.canNavigate = false;
            this.autoPlayVideoIsPlaying = false;
            this.videoTransitionIsPlaying = false;
            //this.app.current360AudioTime = 0;
            this.hasAudio = false;
            this.videoIsPlaying = false;
            this.currentSpriteIndexPlaying = null;

            this.baseUrl = options.app.titleMetaData.title.base_url;
            this.video360Url = "Assets/Video/360s/";
            this.panorama = "Assets/Image/Artwork/Backgrounds/360s/Panoramas/" + this.data.metadata.panorama;

            this.app.current360GUID = this.data.metadata.guid
            this.data.contentData = this.data.contentData ? this.data.contentData : {}
            this.isChild = this.data.contentData.addToStack === false
            this.hasVideoStarted = false

            this.lat = 0;
            this.lon = 180;

            this.difX = 0;
            this.difY = 0;
            this.paused = 0;
            this.rotateStart_ = new MathUtil.Vector2();
            this.rotateEnd_ = new MathUtil.Vector2();
            this.rotateDelta_ = new MathUtil.Vector2();
            this.isDragging_ = false;

            this.hasAudio = 1;

            this.blockReturn = true;
            this.blockNavigation = true;

            _.bindAll(this, "onClose");
        },
        preload: true,

        events: {
            //"click .panorama-tutorial": "startMobile",
            //"click #panorama-start-mobile": "startMobile",
            //"click .close": "onBackButtonPressed",
            //"click .close-button-clickable-area" : "onBackButtonPressed"
        },

        startMobile: function() {
            this.$panoramaTutorial.hide();
            this.blockNavigation = false;
            this.blockReturn = false;
            this.start('', true)
        },

        getAudioSource: function() {
            return "";
        },

        start: function(element, hitEnter) {
            if (hitEnter) {

                var canvas = $('canvas', this.el)[0];
                Hammer(canvas).on('pan', this.onPan.bind(this));
                Hammer(canvas).on('panstart', this.onPanStart.bind(this));
                Hammer(canvas).on('panend', this.onPanEnd.bind(this));

                /*if (this.currentSprite) {
                    this.currentSprite.sprite.material.map.image.src = this.data.metadata.video.marker_sel;
                    this.currentSprite.sprite.material.map.needsUpdate = true;
                }*/

/*
                _.each(this.spriteObjects, function(sprite) {
                    sprite.sprite.material.map.image.src = this.data.metadata.video.marker_nor;
                    sprite.sprite.material.map.needsUpdate = true;
                }.bind(this))
*/

                if (this.spriteObjects.length === 1) {
                    this.currentSpriteIndex = 0
                    this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = false
                    this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = true
                } else {
                    this.checkSprite()
                }
                //this.video.play();

                this.experienceStarted = true;

                this.OmnitureAnalyticsHelper.setAction("User Starts 360 experience", true);

                this.trigger("ACTIVATE_CLOSE");
            }
        },

        startAnalytics: function () {
            this.OmnitureAnalyticsHelper.startSessionOnPage(this.data.metadata.guid);
        },

        setup3Denvironment: function (container) {
            this.difX = 0;
            this.difY = 0;
            this.DIF = 1.0;
            this.DIF_PAN = 2;
            this.paused = 0;
            this.radialLength = 10;

            var width = 1280;
            var height = 720;

            camera = new THREE.PerspectiveCamera( 75, width / height, 1, 1100 );
            camera.target = new THREE.Vector3( 0, 0, 0 );

            this.mainScene = new THREE.Scene();

            var geometry = new THREE.SphereGeometry( 500, 60, 40 );
            geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

            // instantiate a loader
            var loader = new THREE.TextureLoader();

            var self = this

            loader.load(
                // resource URL
                this.panorama,
                // Function when resource is loaded
                function ( texture ) {
                    // do something with the texture

                    self.mainMenuVideoTexture = texture
                    self.mainMenuVideoTexture.minFilter = THREE.LinearFilter;
                    self.mainMenuVideoMaterial = new THREE.MeshBasicMaterial({
                        map : self.mainMenuVideoTexture
                    } );


                    self.mainMesh = new THREE.Mesh( geometry, self.mainMenuVideoMaterial );
                    self.mainScene.add( self.mainMesh );
                    var material = new THREE.MeshBasicMaterial( {
                        map: texture
                     } );
                }
            );

            /* PIP */
            this.pipObjects = [];

            _.each(this.data.metadata.PIP, function (pip) {
                if (pip !== null) {
                    var lat = pip.coords[0];
                    var lon = pip.coords[1];
                    var phi = THREE.Math.degToRad( 90 - lat );
                    var theta = THREE.Math.degToRad( lon );

                    var pipObject = {}

                    pipObject.pipIndex = pip.pipIndex;
                    pipObject.shouldAutoPlay = pip.shouldAutoPlay;

                    pipObject.video = document.createElement( 'video' );

                    pipObject.video.autoplay = true;
                    pipObject.video.playsInline = true;
                    pipObject.video.src = pip.Video;

                    //pipObject.video.oncanplay = function () {
                    var geometry = new THREE.PlaneGeometry( pip.scale*16/9, pip.scale, 1 );
                    var vidTex = new THREE.VideoTexture( pipObject.video );
                    var material = new THREE.MeshBasicMaterial( {
                        side: THREE.DoubleSide,
                        map: vidTex,
                        transparent: true,
                        opacity: 0
                    } );

                    pipObject.material = material

                    var pipMesh = new THREE.Mesh( geometry, material );
                    pipMesh.position.x = this.radialLength * Math.sin( phi ) * Math.cos( theta );
                    pipMesh.position.y = this.radialLength * Math.cos( phi );
                    pipMesh.position.z = this.radialLength * Math.sin( phi ) * Math.sin( theta );
                    //pipMesh.scale.set(1.2,1.2,1.2);

                    if (pip.shouldAutoPlay == true) {
                        if (this.app.current360GUID == "JWFK_360_Rooms_LibraryCenter_bg" && this.app.replay360LibraryVideo == false
                            || this.app.current360GUID == "JWFK_360_Rooms_LabFront_bg" && this.app.replay360LabFrontVideo == false
                            || this.app.current360GUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg" && this.app.replay360ContainmentVideo == false
                        ) {
                            pipMesh.visible = false;
                        } else {
                            this.app.replay360Video == true;
                            pipMesh.visible = true;
                        }
                    } else {
                        pipMesh.visible = false
                    }

                    pipObject.pipMesh = pipMesh
                    this.mainScene.add( pipObject.pipMesh );
                    this.pipObjects.push(pipObject);

                    if (pip.shouldAutoPlay == true) {
                        if (this.app.current360GUID == "JWFK_360_Rooms_LibraryCenter_bg" && this.app.replay360LibraryVideo == false
                            || this.app.current360GUID == "JWFK_360_Rooms_LabFront_bg" && this.app.replay360LabFrontVideo == false
                            || this.app.current360GUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg" && this.app.replay360ContainmentVideo == false
                        ) {
                            pipObject.video.pause();
                        } else {
                            pipObject.material.opacity = 1;
                            this.autoPlayVideoIsPlaying = true;
                        }
                    } else {
                        pipObject.video.pause();
                    }
                    //}.bind(this)

                    pipObject.video.onended = function () {
                        this.videoIsPlaying = false;

                        if (self.currentSpriteIndex >= 0 && self.currentSpriteIndexPlaying) {
                            self.spriteObjects[self.currentSpriteIndexPlaying].spriteSel.visible = true;
                        } else {
                            self.spriteObjects[self.currentSpriteIndexPlaying].spriteNor.visible = true;
                        }

                        //this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = true;
                        //this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = true;
                        pipObject.pipMesh.visible = false;
                        this.audio = $('#background-audio', this.el);

                        this.audio[0].src = this.app.audio360Src;
                        this.audio[0].removeEventListener('ended', this.audioOnEnded.bind(this));
                        this.audio[0].addEventListener('ended', this.audioOnEnded.bind(this));
                        this.audio[0].currentTime = this.app.current360AudioTime;
                        this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audio[0].src, 2000);

                        if (pipObject.shouldAutoPlay == true) {
                            this.autoPlayVideoIsPlaying = false;
                        } else {
                            pipObject.video.currentTime = 0;
                        }
                    }.bind(this);
                }
            }.bind(this));

            this.audio = $('#background-audio', this.el);

            if (this.autoPlayVideoIsPlaying) {
                //this.audio[0].pause();
                this.audio[0].src = "Assets/Audio/JWFK_360_audiobed0" + this.app.current360AudioTag + ".wav?NO_MTHEORY_DECODER";
                this.audio[0].currentTime = this.app.current360AudioTime;
            } else {
                //if (!this.$panoramaTutorial.is(':visible')) {
                    this.audio[0].src = "Assets/Audio/JWFK_360_audiobed0" + this.app.current360AudioTag + ".wav?NO_MTHEORY_DECODER";
                    this.audio[0].removeEventListener('ended', this.audioOnEnded.bind(this));
                    this.audio[0].addEventListener('ended', this.audioOnEnded.bind(this));
                    this.audio[0].currentTime = this.app.current360AudioTime;
                    this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audio[0].src, 2000);
                //}
            }

            /* Hot Spots */
            this.spriteObjects = [];

            var hotspots = this.data.metadata.hotspots;
            hotspots = _.sortBy(hotspots, function(hotspot){
                return hotspot.coords[1];
            });

            var index = 0;
            _.each(hotspots, function (hotspot){
                var lat = hotspot.coords[0];
                var lon = hotspot.coords[1];
                var phi = THREE.Math.degToRad( 90 - lat );
                var theta = THREE.Math.degToRad( lon );

                var leftIndex = index === 0 ? (hotspots.length - 1) : (index - 1);
                var rightIndex = index === (hotspots.length - 1) ? 0 : (index + 1);
                var leftLon = leftIndex === (hotspots.length - 1) ? hotspots[leftIndex].coords[1] - 360 : hotspots[leftIndex].coords[1];
                var rightLon = rightIndex === 0 ? hotspots[rightIndex].coords[1] + 360 : hotspots[rightIndex].coords[1];
                var leftBound = (((leftLon + lon) / 2) + 360) % 360;
                var rightBound = ((rightLon + lon) / 2) % 360;

                leftBound = lon - 10
                if (leftBound < 0) leftBound = 360 + leftBound

                rightBound = lon + 10
                if (rightBound > 360) rightBound = rightBound - 360

                var map = THREE.ImageUtils.loadTexture(hotspot.marker_nor);
                var material = new THREE.SpriteMaterial( {
                    map: map
                } );
                var spriteNor = new THREE.Sprite( material );
                spriteNor.position.x = this.radialLength * Math.sin( phi ) * Math.cos( theta );
                spriteNor.position.y = this.radialLength * Math.cos( phi );
                spriteNor.position.z = this.radialLength * Math.sin( phi ) * Math.sin( theta );

                if (hotspot.type == "floorNavigation") {
                    spriteNor.scale.set(4,4,4);
                } else {
                    spriteNor.scale.set(3,3,3);
                }

                if (hotspot.type === "pip") {
                    if (this.data.metadata.PIP[hotspot.pipIndex].shouldAutoPlay) {
                        spriteNor.visible = false
                    }
                }

                var mapSel = THREE.ImageUtils.loadTexture(hotspot.marker_sel);
                var materialSel = new THREE.SpriteMaterial( {
                    map: mapSel
                } );
                var spriteSel = new THREE.Sprite( materialSel );
                spriteSel.position.x = this.radialLength * Math.sin( phi ) * Math.cos( theta );
                spriteSel.position.y = this.radialLength * Math.cos( phi );
                spriteSel.position.z = this.radialLength * Math.sin( phi ) * Math.sin( theta );
                spriteSel.visible = false

                if (hotspot.type == "floorNavigation") {
                    spriteSel.scale.set(4,4,4);
                } else {
                    spriteSel.scale.set(3,3,3);
                }

                var spriteObj = {
                    index: index,
                    spriteNor: spriteNor,
                    spriteSel: spriteSel,
                    bounds: [ leftBound, rightBound ],
                    target: hotspot.asset,
                    TransitionVideo: hotspot.TransitionVideo,
                    Orientation: hotspot.Orientation,
                    TargetOrientation: hotspot.TargetOrientation,
                    type: hotspot.type,
                    pipIndex: hotspot.pipIndex,
                    shouldAutoPlay: hotspot.shouldAutoPlay,
                    guid: hotspot.guid
                };

                this.spriteObjects.push(spriteObj);

                this.mainScene.add( spriteNor );
                this.mainScene.add( spriteSel );

                index++;
            }.bind(this));

            // Map
            this.mapSpriteNor = new THREE.Sprite( new THREE.SpriteMaterial( {
                map: THREE.ImageUtils.loadTexture("Assets/Image/Artwork/Backgrounds/360s/Navigation/JWFK_360_nav_floorPlan_nor.png")
            } ) );
            this.mapSpriteNor.position.x = 11;
            this.mapSpriteNor.position.y = -6;
            this.mapSpriteNor.position.z = -10;
            this.mapSpriteNor.scale.set(3,3,3);
            camera.add(this.mapSpriteNor);

            this.mapSpriteSel = new THREE.Sprite( new THREE.SpriteMaterial( {
                map: THREE.ImageUtils.loadTexture("Assets/Image/Artwork/Backgrounds/360s/Navigation/JWFK_360_nav_floorPlan_sel.png")
            } ) );
            this.mapSpriteSel.position.x = 11;
            this.mapSpriteSel.position.y = -6;
            this.mapSpriteSel.position.z = -10;
            this.mapSpriteSel.scale.set(3,3,3);
            this.mapSpriteSel.visible = false
            camera.add(this.mapSpriteSel);


            this.mainScene.add( camera );



            //this.currentSprite = this.spriteObjects[0] //_.findWhere(this.spriteObjects, { target: this.data.metadata.video.initial_asset });
            this.currentSpriteIndex = 0
            this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = false
            this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = true

            renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( width, height );
            container.appendChild( renderer.domElement );

            this.onKeyDownBinded = this.onKeyDown.bind(this)
            document.addEventListener( 'keydown', this.onKeyDownBinded, false);

            this.onKeyUpBinded = this.onKeyUp.bind(this)
            document.addEventListener( 'keyup', this.onKeyUpBinded, false);

            if (Tools.isMobile()) {

                this.onTouchMoveBinded_ = this.onTouchMove_.bind(this)
                this.onTouchDownBinded_ = this.onTouchDown_.bind(this)
                this.onTouchUpBinded_ = this.onTouchUp_.bind(this)

                window.addEventListener('touchmove', this.onTouchMoveBinded_, false);
                window.addEventListener('touchstart', this.onTouchDownBinded_, false);
                window.addEventListener('touchend', this.onTouchUpBinded_, false);
            }
        },

        onTouchDown_: function(e) {
            if (Tools.isNull(e.touches)) return
            if (e.touches.length === 0) return
            this.onMouseDown_({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            })
        },

        onTouchMove_: function(e) {
            if (Tools.isNull(e.touches)) return
            if (e.touches.length === 0) return
            this.onMouseMove_({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            })
            e.preventDefault()
        },

        onTouchUp_: function(e) {
            if (Tools.isNull(e.touches)) return
            if (e.touches.length === 0) return
            this.onMouseUp_({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            })
        },

        onMouseDown_: function (e) {
            this.rotateStart_.set(e.clientX, e.clientY)
            this.isDragging_ = true
        },

        onMouseMove_: function (e) {
            if (!this.isDragging_ && !this.isPointerLocked_()) {
                return;
            }

            // Support pointer lock API.
            if (this.isPointerLocked_()) {
                var movementX = e.movementX || e.mozMovementX || 0;
                var movementY = e.movementY || e.mozMovementY || 0;
                this.rotateEnd_.set(
                    this.rotateStart_.x - movementX,
                    this.rotateStart_.y - movementY);
            } else {
                this.rotateEnd_.set(e.clientX, e.clientY);
            }
            // Calculate how much we moved in mouse space.
            this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
            this.rotateStart_.copy(this.rotateEnd_);

            // Keep track of the cumulative euler angles.
            this.phi -= 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
            this.theta -= 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

            // Prevent looking too far up or down.
            this.phi = Tools.clamp(this.phi, 0, Math.PI);
        },

        onMouseUp_: function (e) {
            this.isDragging_ = false;
        },

        isPointerLocked_: function () {
            var el = document.pointerLockElement || document.mozPointerLockElement ||
                document.webkitPointerLockElement;
            return el !== undefined;
        },

        render: function () {
            var self = this;

            $(this.el).html(_.template(template, this.data));

            this.blackBackground = $('.black-background', this.el);
            this.blackBackground.css('opacity', '1');

            //this.persistentFloor = $('.persistent-floor-navigation', this.el);
            //this.persistentFloor.hide();

            this.$panoramaTutorial = $('.panorama-tutorial', this.el);
            this.$panoramaTutorial.css('opacity', '0');
            /*this.$panoramaTutorial.css('background-image', 'url("'
                + (Tools.isMobile()
                    ? this.data.metadata.instructions_mobile
                    : this.data.metadata.instructions)
                + '")');
            */

            _.delay(function(){
                if (!Tools.isMobile()) {
                    $('#panorama-start-mobile').remove()
                } else {
                    Hammer($('#panorama-start-mobile')[0]).on('tap', function () {
                        self.startMobile()
                    })
                    Hammer($('.panorama-tutorial')[0]).on('tap', function () {
                        self.startMobile()
                    })
                }

                if (this.data.contentData.skipPoster) {
                    $('.panorama-tutorial').remove()
                    $('#panorama-start-mobile').remove()
                    $('video').hide();
                    this.$panoramaTutorial.hide();
                    this.blockNavigation = false;
                    this.experienceStarted = true;
                    this.blockReturn = false;
                    this.start()
                }
            }.bind(this))

            //this.audio = $('#background-audio', self.el);
            //this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audio[0].src, 2000);

            if (!this.data.contentData.skipPoster) {
                var videoEl = $('video', this.el);
                this.video = videoEl[0]
                this.video.src = this.baseUrl + this.video360Url + "JWFK_INTRO_04_ref_WithMusic.mp4?NO_MTHEORY_DECODER";
                this.video.muted = true

                self.trigger("LOADING_SCREEN");

                this.video.ontimeupdate = function () {
                    var self = this
                    if (this.video.currentTime >= 10 && this.video.currentTime <= 11) {
                        self.$panoramaTutorial.animate({opacity: 1}, function() {
                            //self.video.pause();
                            self.canNavigate = true;

                            self.audio = $('#background-audio', self.el);
                            self.app.current360AudioTime = self.audio[0].currentTime;
                            //$('.panorama-tutorial-enter').addClass('active focused')
                            $('.panorama-tutorial-enter').trigger( "click" );
                        });
                    } else if (this.video.currentTime >= 20) {
                        self.video.pause();
                    }
                }.bind(this);


                this.video.oncanplay = function () {
                    this.trigger("LOAD_COMPLETE");
                    if (!this.hasVideoStarted) {
                        this.setup3Denvironment.apply(this, [this.el]);
                        this.animate();

                        this.fixTick = setInterval(function(){
                            self.onTick();
                        }, 1000);
                    }
                    if (this.isChild || this.hasVideoStarted) {
                        this.video.play()
                    }
                    this.hasVideoStarted = true
                    console.log('[panoramaInteractive] Main Video canplay')
                }.bind(this)
            } else {
                self.canNavigate = true;

                this.trigger("LOAD_COMPLETE");

                this.setup3Denvironment.apply(this, [this.el]);
                this.animate();

                this.fixTick = setInterval(function(){
                    self.onTick();
                }, 1000);

                this.hasVideoStarted = true
            }

            $('#start-experience').hide();
            this.initFocusManager();

            setTimeout(() => {
                this.blackBackground.animate({opacity: 0}, 1000)
            }, 1000);

            this.audio = $('#background-audio', this.el);
            this.audio[0].currentTime = this.app.current360AudioTime;

            return this;
        },

        animate: function () {
            if (!this.paused) {
                requestAnimationFrame(this.animate.bind(this));
            }
            this.update();
        },

        update: function () {
            if (!this.isDragging_) {
                this.lon += this.difX;
                this.lat += this.difY;

                this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
                this.phi = THREE.Math.degToRad( 90 - this.lat );
                this.theta = THREE.Math.degToRad( this.lon );
            } else {
                this.lon = THREE.Math.radToDeg(this.theta)
                this.lat = -(THREE.Math.radToDeg(this.phi) - 90)
            }

            camera.target.x = 500 * Math.sin( this.phi ) * Math.cos( this.theta );
            camera.target.y = 500 * Math.cos( this.phi );
            camera.target.z = 500 * Math.sin( this.phi ) * Math.sin( this.theta );

            _.each(this.pipObjects, function (obj)  {
                obj.pipMesh.lookAt( new THREE.Vector3(0,0,0) )
            }.bind(this))

            TWEEN.update()
            camera.lookAt( camera.target );
            renderer.render( this.mainScene, camera );
        },

        replaceCurrentVideo (video, orientation) {
            /*
            var self = this

            if (this.video) {
                //this.video.pause();
                //this.video.src = "";
                delete this.video;
            }

            this.mainScene.remove( this.mainMesh );
            this.update()

            var geometry = new THREE.SphereGeometry( 490, 60, 40 );
            geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

            this.mainMenuVideoTexture = new THREE.VideoTexture( video );
            this.mainMenuVideoTexture.minFilter = THREE.LinearFilter;
            this.mainMenuVideoMaterial = new THREE.MeshBasicMaterial({
                map: this.mainMenuVideoTexture
            });

            this.mainMesh = new THREE.Mesh( geometry, this.mainMenuVideoMaterial );

            console.log('orientation', orientation)
            if (orientation) {
                this.mainMesh.setRotationFromEuler(new THREE.Euler(
                    0,
                    THREE.Math.degToRad( orientation ),
                    0,
                    'XYZ'
                ));
            }

            this.mainScene.add( this.mainMesh );

            clearInterval(this.fixTick);
            this.video = video
            this.fixTick = setInterval(function(){
                self.onTick();
            }, 1000);
            */
        },

        playTransition : function (cb) {
            this.paused = 0;

            _.each(this.spriteObjects, function (obj)  {
                this.mainScene.remove(obj.spriteNor)
                this.mainScene.remove(obj.spriteSel)
            }.bind(this))

            _.each(this.pipObjects, function (obj)  {
                this.mainScene.remove(obj.pipObject)

                if (obj.video) {
                    obj.video.pause();
                    obj.video.src = "";
                    //delete obj.video;
                }
            }.bind(this))

            this.blackBackground.animate({opacity: 1})

            this.transitionVideoLoaded = false;
            this.lon = 0;
            this.lat = 0;

            this.trigger("LOAD_COMPLETE");
            this.transitionVideoLoaded = true

            this.blackBackground.animate({opacity: 0}, 2000)
        },

        audioOnEnded: function() {
            if (this.$panoramaTutorial.is(':visible')) {
                this.app.current360AudioTag = 1;
            } else {
                if (this.app.current360AudioTag == undefined) {
                    this.app.current360AudioTag = 2;
                } else {
                    if (this.app.current360AudioTag < 4) {
                        this.app.current360AudioTag += 1;
                    } else {
                        this.app.current360AudioTag = 2;
                    }
                }
            }

            //console.log('audioOnEnded :' + this.app.current360AudioTag)

            this.audioSource = "Assets/Audio/JWFK_360_audiobed0" + this.app.current360AudioTag + ".wav?NO_MTHEORY_DECODER";
            this.audio = $('#background-audio', this.el);
            this.audio[0].pause();
            this.audio[0].currentTime = 0;
            this.audio[0].src = this.audioSource;

            setTimeout(() => {
                this.fadeInAudioElementWithSrcAndDuration(this.audio[0], "Assets/Audio/JWFK_360_audiobed0" + this.app.current360AudioTag + ".wav?NO_MTHEORY_DECODER", 2000);
            }, 1000);
        },

        onKeyUp: function (event) {
            console.log('[panoramaInteractive] onKeyUp ', event.keyCode)
            var self = this

            if (event.keyCode === 13) {
                if (this.canNavigate) {
                    if (this.$panoramaTutorial.is(':visible')) {
                        this.$panoramaTutorial.hide();
                        var self = this
                        this.blackBackground.animate({opacity: 1}, 1000, function() {
                            $('video', this.el).css('opacity', '0');
                            //self.persistentFloor.show();
                            self.blockNavigation = false;
                            self.blockReturn = false;
                            self.blackBackground.animate({opacity: 0})
                            self.audio = $('#background-audio', self.el);
                            self.app.current360AudioTag = 2;
                            self.audio[0].src = "Assets/Audio/JWFK_360_audiobed0" + self.app.current360AudioTag + ".wav?NO_MTHEORY_DECODER";
                            self.audio[0].addEventListener('ended', self.audioOnEnded.bind(self));
                            //self.audio[0].currentTime = self.app.current360AudioTime;
                            self.fadeInAudioElementWithSrcAndDuration(self.audio[0], "Assets/Audio/JWFK_360_audiobed0" + self.app.current360AudioTag + ".wav?NO_MTHEORY_DECODER", 1000);
                        });
                    } else {
                        if (!this.blockReturn
                                && this.experienceStarted
                                && event.keyCode === 13
                                && !this.videoTransitionIsPlaying
                        ) {
                            this.app.current360AudioTime = this.audio[0].currentTime;
                            if (this.autoPlayVideoIsPlaying == true) {
                                if (this.app.current360GUID == "JWFK_360_Rooms_LibraryCenter_bg") {
                                    this.app.replay360LibraryVideo = false;
                                }

                                if (this.app.current360GUID == "JWFK_360_Rooms_LabFront_bg") {
                                    this.app.replay360LabFrontVideo = false;
                                }

                                if (this.app.current360GUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg") {
                                    this.app.replay360ContainmentVideo = false;
                                }

                                _.each(self.pipObjects, function (pipObject) {
                                    if (pipObject.shouldAutoPlay == true) {
                                        pipObject.video.pause();
                                        pipObject.pipMesh.visible = false
                                    }
                                })

                                this.autoPlayVideoIsPlaying = false;

                                this.audio[0].removeEventListener('ended', this.audioOnEnded.bind(this));
                                this.audio[0].addEventListener('ended', this.audioOnEnded.bind(this));
                                this.audio[0].currentTime = this.app.current360AudioTime;
                                this.fadeInAudioElementWithSrcAndDuration(this.audio[0], this.audio[0].src, 2000);

                            } else {

                                if (self.currentSpriteIndex === -1) {
                                    this.playTransition()
                                    this.OmnitureAnalyticsHelper.stopSession();

                                    if (this.app.current360GUID == "JWFK_360_Rooms_LibraryCenter_bg") {
                                        this.app.replay360LibraryVideo = false;
                                    }

                                    if (this.app.current360GUID == "JWFK_360_Rooms_LabFront_bg") {
                                        this.app.replay360LabFrontVideo = false;
                                    }

                                    if (this.app.current360GUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg") {
                                        this.app.replay360ContainmentVideo = false;
                                    }

                                    this.showFloorNavigation();
                                } else if (self.spriteObjects[self.currentSpriteIndex].type == "pip") {
                                    if (!this.autoPlayVideoIsPlaying) {
                                        var currentPipObject = null;

                                        _.each(self.pipObjects, function (pipObject) {
                                            if (pipObject.pipIndex === self.spriteObjects[self.currentSpriteIndex].pipIndex) {
                                                currentPipObject = pipObject
                                            } else {
                                                pipObject.video.pause();
                                                pipObject.pipMesh.visible = false
                                            }
                                        })

                                        if (currentPipObject !== undefined && currentPipObject !== null) {
                                            self.audio = $('#background-audio', self.el);

                                            if (currentPipObject.pipMesh.visible) {
                                                this.videoIsPlaying = false;
                                                new TWEEN
                                                    .Tween( currentPipObject.pipMesh.material )
                                                    .to( { opacity: 0 }, 1000 )
                                                    .start()
                                                    .onComplete( function (argument) {

                                                        if (self.currentSpriteIndex >= 0 && self.currentSpriteIndexPlaying) {
                                                            self.spriteObjects[self.currentSpriteIndexPlaying].spriteSel.visible = true;
                                                        } else {
                                                            self.spriteObjects[self.currentSpriteIndexPlaying].spriteNor.visible = true;
                                                        }
                                                        //self.checkSprite()
                                                        currentPipObject.pipMesh.visible = false
                                                        currentPipObject.video.pause()


                                                        this.currentSpriteIndexPlaying = null;

                                                        self.fadeInAudioElementWithSrcAndDuration(self.audio[0], self.audio[0].src, 1000);
                                                    })
                                            } else {
                                                this.videoIsPlaying = true;
                                                this.currentSpriteIndexPlaying = self.currentSpriteIndex;
                                                self.spriteObjects[self.currentSpriteIndex].spriteNor.visible = false;
                                                self.spriteObjects[self.currentSpriteIndex].spriteSel.visible = false;
                                                currentPipObject.pipMesh.visible = true
                                                currentPipObject.video.play()

                                                new TWEEN
                                                    .Tween( currentPipObject.pipMesh.material )
                                                    .to( { opacity: 1 }, 1000 )
                                                    .start();

                                                self.fadeOutAudioElementWithSrcAndDuration(self.audio[0], 1000);
                                            }
                                        }
                                    }
                                } else if (self.spriteObjects[self.currentSpriteIndex].type == "panoramaWithVideoTransition") {
                                    if (this.app.current360GUID == "JWFK_360_Rooms_LibraryCenter_bg") {
                                        this.app.replay360LibraryVideo = false;
                                    }

                                    if (this.app.current360GUID == "JWFK_360_Rooms_LabFront_bg") {
                                        this.app.replay360LabFrontVideo = false;
                                    }

                                    if (this.app.current360GUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg") {
                                        this.app.replay360ContainmentVideo = false;
                                    }

                                    var videoEl = $('video', this.el);
                                    this.video = videoEl[0]
                                    this.video.autoplay = true;
                                    this.video.loop = false;
                                    this.video.playsInline = true;
                                    this.video.muted = false;
                                    this.video.src = this.baseUrl + this.video360Url + "360_Going_down_a_Level.mp4?NO_MTHEORY_DECODER";

                                    $('video').insertAfter('.black-background');

                                    this.blackBackground.animate({opacity: 1}, 1000)

                                    self.fadeOutAudioElementWithSrcAndDuration(self.audio[0], 2000);

                                    _.each(this.pipObjects, function (obj)  {
                                        this.mainScene.remove(obj.pipObject)

                                        if (obj.video) {
                                            obj.video.pause();
                                            obj.video.src = "";
                                            //delete obj.video;
                                        }
                                    }.bind(this))

                                    this.videoTransitionIsPlaying = true;

                                    this.video.play()
                                    $('video').show();

                                    this.video.onended = function () {
                                        console.log('videoTransition onended')

                                        $('video').hide();

                                        this.playTransition()
                                        this.OmnitureAnalyticsHelper.stopSession();
                                        self.app.playContent(
                                            self.spriteObjects[self.currentSpriteIndex].target,
                                            null,
                                            {
                                                skipPoster: true,
                                                addToStack: false,
                                                targetOrientation: self.spriteObjects[self.currentSpriteIndex].TargetOrientation
                                            }
                                        )

                                        self.spriteObjects = []
                                        delete self.spriteObjects

                                        self.pipObjects = []
                                        delete self.pipObjects

                                        //if (self.isChild)
                                        {
                                            console.log('[panoramaInteractive] Removing view ', self)
                                            self.onClose();
                                            self.remove();
                                        }

                                        this.video.currentTime = 0;
                                        this.video.pause();
                                    }.bind(this)
                                } else {
                                    this.playTransition()
                                    this.OmnitureAnalyticsHelper.stopSession();

                                    if (this.app.current360GUID == "JWFK_360_Rooms_LibraryCenter_bg") {
                                        this.app.replay360LibraryVideo = false;
                                    }

                                    if (this.app.current360GUID == "JWFK_360_Rooms_LabFront_bg") {
                                        this.app.replay360LabFrontVideo = false;
                                    }

                                    if (this.app.current360GUID == "JWFK_360_Rooms_ContainmentFacilityMainHall_bg") {
                                        this.app.replay360ContainmentVideo = false;
                                    }

                                    self.app.playContent(
                                        self.spriteObjects[self.currentSpriteIndex].target,
                                        null,
                                        {
                                            skipPoster: true,
                                            addToStack: false,
                                            targetOrientation: self.spriteObjects[self.currentSpriteIndex].TargetOrientation
                                        }
                                    )

                                    //if (self.isChild)
                                    {
                                        console.log('[panoramaInteractive] Removing view ', self)
                                        self.onClose();
                                        self.remove();
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (event.keyCode >= 37 && event.keyCode <= 40) {
                this.difX = 0;
                this.difY = 0;
            } else if (event.keyCode === 8) {
                if (!this.app.floorNavigationIsShowing) {
                    this.onBackButtonPressed();
                }

                this.app.floorNavigationIsShowing = false;
            }
        },

        checkSprite () {
            var foundSprite


            var lon = this.lon % 360
            lon = (lon < 0) ? 360 + lon : lon

            //console.log('this.lon:', this.lon)

            _.each(this.spriteObjects, function(sprite){
                //console.log(lon + '', sprite.bounds)

                //sprite.sprite.material.map.image.src = this.data.metadata.video.marker_nor;
                //sprite.sprite.material.map.needsUpdate = true;

                if (sprite.bounds[1] < sprite.bounds[0]) {
                    if (lon > sprite.bounds[0] || lon <= sprite.bounds[1]) {
                        foundSprite = sprite
                    }
                } else if (lon > sprite.bounds[0] && lon <= sprite.bounds[1]){
                    foundSprite = sprite
                }
            }.bind(this))

            //console.log('foundSprite:', foundSprite)
            //console.log('this.currentSpriteIndex:', this.currentSpriteIndex)

            //var changeCurrentSprite = false

/*
            if (foundSprite && this.currentSpriteIndex !== foundSprite.index) {
                //console.log('Switch sprite '+this.currentSpriteIndex+' to normal', this.data.metadata.video.marker_nor)

                //this.spriteObjects[this.currentSpriteIndex].sprite.material.map.image.src = this.data.metadata.video.marker_nor;
                //this.spriteObjects[this.currentSpriteIndex].sprite.material.map.needsUpdate = true;
                //this.spriteObjects[this.currentSpriteIndex].sprite.material.needsUpdate = true;
                //this.spriteObjects[this.currentSpriteIndex].sprite.scale.set(1, 1, 1)

                if (this.videoIsPlaying != true) {
                    this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = true
                    this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = false
                } else {
                    if (this.currentSpriteIndex != this.currentSpriteIndexPlaying) {
                        this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = true
                        this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = false
                    }
                }

                changeCurrentSprite = true
            }*/

            if (foundSprite
                    //&& (changeCurrentSprite
                        //|| (this.currentSprite
                        && foundSprite.index !== this.currentSpriteIndex)
                //))
             {
                this.mapSpriteSel.visible = false
                this.mapSpriteNor.visible = true

                if (this.currentSpriteIndex !== -1) {
                    this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = true
                    this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = false
                }

                //console.log('Switch sprite '+foundSprite.index+' to active')
                this.currentSpriteIndex = foundSprite.index

                if (this.videoIsPlaying != true) {
                    this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = false
                    this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = true
                }  else {
                    if (this.currentSpriteIndex != this.currentSpriteIndexPlaying) {
                        this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = false
                        this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = true
                    }
                }

                //this.spriteObjects[this.currentSpriteIndex].sprite.material.map.image.src = this.data.metadata.video.marker_sel;
                //this.spriteObjects[this.currentSpriteIndex].sprite.material.map.needsUpdate = true;
                //this.spriteObjects[this.currentSpriteIndex].sprite.scale.set(1.5, 1.5, 1)
                //this.spriteObjects[this.currentSpriteIndex].sprite.material.needsUpdate = true;
            }

            if (!foundSprite && this.currentSpriteIndex !== -1) {
                this.mapSpriteSel.visible = true
                this.mapSpriteNor.visible = false

                if (!this.videoIsPlaying || (this.videoIsPlaying && this.currentSpriteIndexPlaying !== this.currentSpriteIndex)) {
                    this.spriteObjects[this.currentSpriteIndex].spriteNor.visible = true
                    this.spriteObjects[this.currentSpriteIndex].spriteSel.visible = false
                }
                this.currentSpriteIndex = -1
            }
            this.update()
        },

        onKeyDown: function (event) {
            console.log('[panoramaInteractive] onKeyDown ', event.keyCode)
            if (this.paused) return;

            if (!this.blockNavigation && event.keyCode >= 37 && event.keyCode <= 40) {

                /*
                if (this.currentSprite) {
                    if (this.currentSprite.bounds[1] < this.currentSprite.bounds[0]) {
                        if (event.keyCode === 39) {
                            if (this.lon > this.currentSprite.bounds[1]) {
                                if (!this.circular) {
                                    this.lon -= 360;
                                    this.circular = true;
                                }
                            }
                        } else if (event.keyCode === 37) {
                            if (this.lon < this.currentSprite.bounds[0]) {
                                if (!this.circular) {
                                    this.lon += 360;
                                    this.circular = true;
                                }
                            }
                        }
                    }
                }
                */

                this.checkSprite()


                switch(event.keyCode) {
                    case 37:
                        this.difX = -this.DIF;
                        /*
                        if (this.currentSprite && this.lon < this.currentSprite.bounds[0]) {
                            this.currentSprite.sprite.material.map.image.src = this.data.metadata.video.marker_nor;

                            var prevIndex = (this.currentSprite.index - 1 + this.spriteObjects.length) % this.spriteObjects.length;
                            this.currentSprite = this.spriteObjects[prevIndex];

                            this.currentSprite.sprite.material.map.image.src = this.data.metadata.video.marker_sel;
                            this.currentSprite.sprite.material.map.needsUpdate = true;

                            this.circular = false;
                        }*/
                        break;
                    case 39:
                        this.difX = this.DIF;
                        /*
                        if (this.currentSprite && this.lon > this.currentSprite.bounds[1]) {
                            this.currentSprite.sprite.material.map.image.src = this.data.metadata.video.marker_nor;

                            var nextIndex = (this.currentSprite.index + 1) % this.spriteObjects.length;
                            this.currentSprite = this.spriteObjects[nextIndex];

                            this.currentSprite.sprite.material.map.image.src = this.data.metadata.video.marker_sel;
                            this.currentSprite.sprite.material.map.needsUpdate = true;

                            this.circular = false;
                        }*/
                        break;
                    case 38:
                        this.difY = this.DIF;
                        break;
                    case 40:
                        this.difY = -this.DIF;
                        break;
                    default:
                        break;
                }
            }
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
                    //this.video.currentTime       +
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
                    //this.video.currentTime       +
                    " seconds, Camera Target: [" +
                    camera.target.x + ", "       +
                    camera.target.y + ", "       +
                    camera.target.z + "]"
                    , true
                );
            }
        },

        onTick: function () {
            /*
            if(this.OmnitureAnalyticsHelper && this.experienceStarted && this.video) {
                this.OmnitureAnalyticsHelper.set360_x(camera.target.x);
                this.OmnitureAnalyticsHelper.set360_y(camera.target.y);
                this.OmnitureAnalyticsHelper.set360_z(camera.target.z);
                this.OmnitureAnalyticsHelper.set360_time(this.video.currentTime, true);
            }*/
        },

        onBackButtonPressed: function () {
            console.log('onBackButtonPressed - panoramaInteractive')
            var self = this

            this.app.replay360LibraryVideo = true;
            this.app.replay360LabFrontVideo = true;
            this.app.replay360ContainmentVideo = true;
            this.app.current360AudioTime = 0;

            _.each(this.spriteObjects, function (obj)  {
                this.mainScene.remove(obj.spriteNor)
                this.mainScene.remove(obj.spriteSel)
            }.bind(this))

            _.each(this.pipObjects, function (obj)  {
                this.mainScene.remove(obj.pipObject)

                if (obj.video) {
                    obj.video.pause();
                    obj.video.src = "";
                    delete obj.video;
                }
            }.bind(this))

            self.spriteObjects = []
            delete self.spriteObjects

            self.pipObjects = []
            delete self.pipObjects

            $('.panorama_video_interactive').animate({opacity: 0}, function() {
                self.onClose();
                self.OmnitureAnalyticsHelper.stopSession();
                if (self.isChild) {
                    self.remove();
                }
                if (self.app.viewStack.length > 1) {
                    InteractiveComp.View.prototype.onBackButtonPressed.call(self);
                }
            });
        },

        onWindowResize: function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );
        },

        resume: function () {
            //this.video.src = this.data.baseURL + this.data.metadata.video.url;
            //this.video.play();
            this.paused = 0;
            this.animate();

            this.fixTick = setInterval(function(){
                this.onTick();
            }.bind(this), 1000);

            this.blockReturn = false;
        },

        suspend: function () {
            clearInterval(this.fixTick);

            this.paused = 1;

            /*if (this.video) {
                this.video.pause();
                this.video.src = "";
            }*/

            this.blockReturn = true;
        },

        onClose: function() {
            this.suspend();

            document.removeEventListener( 'keydown', this.onKeyDownBinded);
            document.removeEventListener( 'keyup', this.onKeyUpBinded);

            if (Tools.isMobile()) {
                window.removeEventListener('touchmove', this.onTouchMoveBinded_);
                window.removeEventListener('touchstart', this.onTouchDownBinded_);
                window.removeEventListener('touchend', this.onTouchUpBinded_);
            }

            this.OmnitureAnalyticsHelper.setAction("Exit Panorama 360 Experience", true);

            //delete this.video;
            $(this.el).remove();

            if (this.app.viewStack.length === 1) {
                InteractiveComp.View.prototype.onClose.call(this);
            }
        },

        remove: function() {
            clearInterval(this.fixTick);

            this.paused = 1;

            //if (this.video) {
                //this.video.pause();
                //this.video.src = "";
              //  delete this.video;
            //}

            if (this.el) {
                $(this.el).remove();
            }
        },

        showFloorNavigation: function() {
            console.log('showFloorNavigation')
            var self = this

            this.audio = $('#background-audio', this.el);
            this.app.current360AudioTime = this.audio[0].currentTime;

            document.removeEventListener( 'keydown', this.onKeyDownBinded);
            document.removeEventListener( 'keyup', this.onKeyUpBinded);

            var experience = new FloorNavigationView({
                app: self.app,
                assetType: "floor_navigation",
                contentItem: "floor_navigation",
                currentGUID: this.app.current360GUID
            });
            experience.experienceName = "floor_navigation";
            experience.render();

            this.app.pushView(experience, 0, 0, null, null, null, { type: "fade" });
        }
    })
});
