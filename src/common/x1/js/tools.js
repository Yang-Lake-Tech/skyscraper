// tools.js
define(['jquery','underscore','backbone'], function($, Underscore, Backbone) {
    var FocusManager = function() {
        var activeComp;
        var index = 0;
        var gridData = {};
        var activePos = [0,0];
        var nextPos;
        var self = this;
        //size of each scroll, if there is focusable element on page by default it will be done page by page
        this.scrollPageSize = 0;
        // size of the grid containing all the elements
        var gridSize = [0,0];

        // if true, it doesn't lose the active-look after losing focus, to keep track of the selected menu-item
        this.menuMode = false;
        // if true active element gets changed after pressing enter, currently only works for html elements(no nested views)
        // if enterMode is true , this.selected represents the one which is selected by enter vs this.active which has the focus
        this.enterMode = false;

        var addComponent = function(comp, position, size) {
            validated = 0;
            var height = 1, width = 1;
            try {
                var row = parseInt(position.split(",")[0],10);
                var column = parseInt(position.split(",")[1],10);
            } catch(e) {
                throw new Error("component or view added without having a parent with data-position");
            }

            if (size && size !== 'fill' && size !== 0) {
                height = parseInt(size.split(",")[0],10);
                width = parseInt(size.split(",")[1],10);
            }

            // size of the grid
            gridSize[0] = Math.max(gridSize[0], height + row);
            gridSize[1] = Math.max(gridSize[1], width + column);

            if(comp) {
                // position and size of the current component
                comp.position = [row,column];
                comp.gridSize = [height,width];
                comp.autoSize = size === 0;
                comp.index = index++;
            }

            for(var i = 0 ; i < height; i++) {
                for(var j = 0 ; j < width; j++) {
                    if(comp) {
                        gridData[(row + i) +  "," + (column + j)] = comp;
                    } else {
                        gridData[(row + i) +  "," + (column + j)] = null;
                    }
                }
            }

            return this;
        }

        this.mousemove = function(event) {
            this.mouseMode = 1;//TODO: use MODERNIZR
            if(this.active && this.active.fm) this.active.fm.trigger('mousemove',event);
        }

        if (isMobile()) {
            this.listenTo(this,"mousemove",this.mousemove);
        }

        this.reset = function() {
            this.blur();
            this.active = null;
            this.selected = null;
            gridData = {};
            gridSize = [0,0];
            $(this.scrollable).off("scroll");
            $(document).off("mousemove");
            $(this.scrollThumb).off("mousedown");
        }


        this.getViews = function() {
            var views = [];
            for( var prop in gridData) {
                if( gridData[prop].fm ) views.push( gridData[prop] );
            }
            return views;
        }

        this.getActivePosition = function() {
            return activePos;
        }

        this.getElementAt = function(index) {
            return gridData ? gridData[index] : null;
        }

        // adding backbone view to focus manager
        this.addView = function(view) {
            if(view.el && $(view.el).parent().length) {
                var target = $(view.el);
                if(!target.attr('data-position')) target = $(view.el).parent();

                if( target.attr("data-left-position") ) $(view).attr("data-left-position", target.attr("data-left-position") );
                if( target.attr("data-right-position") ) $(view).attr("data-right-position", target.attr("data-right-position") );
                if( target.attr("data-up-position") ) $(view).attr("data-up-position", target.attr("data-up-position") );
                if( target.attr("data-down-position") ) $(view).attr("data-down-position", target.attr("data-down-position") );


                addComponent(view, target.attr('data-position'), target.attr("data-size"));
            }
        }

        this.removeViewAt = function(el) {
            var el = $(el);
            addComponent(null, el.attr('data-position'), el.attr("data-size"));
        }

        // adding all focusable children of component
        this.addElements = function(component) {
            var self = this;
            this.component = component;

            $("[data-position]",component).each(function() {
                //TODO: data-hidden is deprecated, use data-disabled without calling initFocusManager and with unique ids
                if( !$(this).attr('data-hidden') ) {
                    addComponent(this, $(this).attr('data-position'), $(this).attr("data-size"));
                }

            });
            this.validateScroll();
        }

        this.addNewElements = function(component) {
            var self = this;
            $("[data-position]",component).each(function() {
                //TODO: data-hidden is deprecated, use data-disabled without calling initFocusManager and with unique ids
                if( !$(this).attr('data-hidden') ) {
                    addComponent(this, $(this).attr('data-position'), $(this).attr("data-size"));
                }
            });
            this.validateScroll();
        }

        // validate scroll values
        this.validateScroll = function() {
            if(this.liveScroll) return;
            // if user uses mouse, mo need to auto scroling
            if(mouseEnabled) return;

            var component = this.component;
            var self = this;

            if($(component).find('.scrollable').length) {

                this.scrollable = $(component).find('.scrollable')[0];
                var scrollableBounding = this.scrollable.getBoundingClientRect();

                if($(component).find('.scroll-box').length) {
                    this.scrollBox = $(component).find('.scroll-box')[0];
                }
                this.scrollWrapper = $(component).find('.scrollable-wrapper')[0];
                var scrollWrapperBounding = this.scrollWrapper.getBoundingClientRect();


                //console.log('scrollableBounding', scrollableBounding)
                //console.log('scrollWrapperBounding', scrollWrapperBounding)

                this.scrollableWrapperTop = scrollWrapperBounding.top;
                this.scrollableWrapperBottom = scrollWrapperBounding.bottom;
                this.scrollableWrapperHeight = scrollWrapperBounding.height;
                this.scrollableHeight = this.scrollable.scrollHeight;


                // if addELements is called before adding to DOM heights are zero and cannot validate scroll related values
                if(this.scrollableWrapperHeight == 0) {
                    if(console.warn) console.warn("addElements got called before adding to DOM!");
                    return;
                }

                this.scrollValidated = 1;
                //
                // always to preserve the position of scroll
                this.activeMemory = 1;
                //

                // if scrollpagesize is set to zero or null, scrollWrapperBounding.height is scroll page size
                var scrollPageSize = this.scrollPageSize || scrollWrapperBounding.height;
                numScrolledPages = Math.ceil( Math.max(0,this.scrollableHeight - scrollWrapperBounding.height) / scrollPageSize )+1;
                this.scrollThumb = $('.scroll-thumb', component)[0];

                var thumbSize =  scrollWrapperBounding.height * (scrollWrapperBounding.height/this.scrollableHeight);

                // amount of distance that thumb moves after each key down
                var thumbMoveSize = thumbSize * ( scrollPageSize/scrollWrapperBounding.height );

                // max move-space in pixels
                var thumbGap = scrollWrapperBounding.height - thumbSize;
                var scrollNeeded = this.scrollableHeight - this.scrollableWrapperHeight;

                this.isScrolledToTop = true
                this.isScrolledToBottom = false

                var scrolled = function() {
                    var pos = $(self.scrollable).scrollTop()/scrollNeeded*thumbGap;
                    var scrollPercentage = self.scrollable.scrollTop / (self.scrollable.scrollHeight - self.scrollable.clientHeight)

                    console.log('scrollPercentage', scrollPercentage)
                    if (scrollPercentage <= 0.05) {
                        if (!self.isScrolledToTop) {
                            self.isScrolledToTop = true
                            self.trigger("SCROLLED_TO_TOP");
                        }
                    } else if (scrollPercentage > 0.95) {
                        if (!self.isScrolledToBottom) {
                            self.isScrolledToBottom = true
                            self.trigger("SCROLLED_TO_BOTTOM")
                        }
                    } else {
                        if (self.isScrolledToTop) {
                            self.isScrolledToTop = false
                            self.trigger("START_SCROLLED_DOWN");
                        }
                        if (self.isScrolledToBottom) {
                            self.isScrolledToBottom = false
                            self.trigger("START_SCROLLED_UP");
                        }
                    }
                    $(self.scrollThumb).css('top',  pos + 'px' );
                    // if 75% of the content is scrolled fire end_scroll for pagination
                    if ( self.scrollable.scrollTop / ( self.scrollable.scrollHeight - self.scrollable.clientHeight  ) > 0.75 ) {
                        self.trigger("NEXT_PAGE");
                    }
                }
                // remove previous scroll
                $(this.scrollable).off("scroll", scrolled);
                // add scroll listener
                $(this.scrollable).scroll(scrolled);

                var startDrag = function(e) {
                    self.dragScrolling = 1;
                    self.offsetY = e.offsetY;
                    $(document).on("mousemove",dragThumb);
                    $(document).on("mouseup",endDrag);
                }

                var endDrag = function() {
                    self.dragScrolling = 0;
                    $(document).off("mousemove",dragThumb);
                    self.lastPos = null;
                }

                var dragThumb = function(e) {
                    var pos =  Math.min(thumbGap, Math.max(0,e.pageY - self.scrollableWrapperTop - self.offsetY));
                    $(self.scrollThumb).css('top', pos + "px");
                    $(self.scrollable).scrollTop( pos/thumbGap*scrollNeeded  );
                }

                $(this.scrollThumb).off("mousedown",startDrag);
                $(this.scrollThumb).on("mousedown",startDrag);

                if(numScrolledPages>1) {

                    $(this.scrollThumb).css('height', thumbSize + 'px' );

                    var scrollThumbBounding = this.scrollThumb ? this.scrollThumb.getBoundingClientRect() : null;

                    if( !gridData["0,0"]) {
                        this.scrollMode = 1;// if there is no content to get focused but scroll(like text)
                        for(var i = 0 ; i < numScrolledPages ; i++) {
                            gridData[i+",0"] = {scrollPosition:  i*scrollPageSize, position: [i,0], gridSize: [1,1] }; //thumbPosition: Math.min(i * thumbMoveSize, scrollWrapperBounding.height - thumbSize)
                            // set size of the scroll thumb

                        }
                        // if scrollbar can get the focus
                        this.scrollFocusable = 1;

                    } else {

                        for (var key in gridData) {
                            if (gridData.hasOwnProperty(key) && gridData[ key ].getBoundingClientRect) {
                                var bounding = gridData[ key ].getBoundingClientRect();
                                var scrollPosition = Math.max(
                                    0,
                                    //Math.min(
                                    //    this.scrollableHeight - scrollWrapperBounding.height,
                                        Math.max(
                                            bounding.top - scrollableBounding.top - scrollWrapperBounding.height/2 + bounding.height/2,
                                            bounding.top - scrollableBounding.top  - scrollWrapperBounding.height + bounding.height
                                        )
                                    //)
                                ); //show the target in mid scroll box unless its height doesn't fit in mid-scroll-box

                                gridData[key].scrollPosition = scrollPosition;
                                console.log('bounding ' + key, gridData[ key ].getBoundingClientRect())
                                console.log('this.scrollableHeight ' + key, this.scrollableHeight)
                                console.log('scrollWrapperBounding.height ' + key, scrollWrapperBounding.height)
                                console.log('this.scrollableHeight - scrollWrapperBounding.height ' + key, this.scrollableHeight - scrollWrapperBounding.height)
                                console.log('scrollPosition ' + key, scrollPosition)
                            }
                        }
                    }
                } else {
                    // even if there is no need for scrolling and page doesn't contain selectable elements add 0,0 dummy poisition
                    if(!gridData["0,0"]) {
                        gridData["0,0"] =  {scrollPosition: 0, position: [0,0], gridSize: [1,1]};//thumbPosition: 0
                        this.scrollFocusable = 1;
                    }
                    $(this.scrollWrapper).addClass('scroll-inactive');
                }
            }

            // even if it's not scrolled still can have anchors
            this.anchors = this.anchors || [];
            $("*[data-anchor]", component).each(function() {
                var el = $(this);

                var bounding = this.getBoundingClientRect();

                var anchor = {name: el.attr("data-anchor"), next: el.attr("data-next-position") || el.attr("data-position") };

                if(self.scrollValidated) {
                    var scrollPosition = Math.max( 0, Math.min( self.scrollableHeight - scrollWrapperBounding.height , Math.max( bounding.top - scrollableBounding.top  , (bounding.top - scrollableBounding.top  - scrollWrapperBounding.height + bounding.height ) ) ) ); //show the target in mid scroll box unless its height doesn't fit in mid-scroll-box
                    anchor.scrollPosition = scrollPosition;
                                console.log('scrollPosition anchor', scrollPosition)
                }
                self.anchors.push( anchor );
            });
        }

        // TODO: integrate all the flags into the options
        // set the forced to true to overwrite the current active
        // focus is set to true if it is called from a keyDown(same object or parent focus manager)
        // if forceEnterMode is true element gets active class


        //options:
        // if down=1 index row is explicitly set to the  bottom-most element
        // if right=1 index row is explicitly set to the  bottom-right element

        this.initFocus = function(
            index
            , forced
            , trigger
            , focus
            , forceEnterMode
            , options
            , hitEnter
        ) {
            /*
             if(this.scrollable && !this.scrollValidated ) {
             this.validateScroll();
             }
             */

            if(forced === undefined) forced = false;
            if(trigger === undefined) trigger = false;
            if(focus === undefined) focus = true;


            if(this.scrollFocusable) $(this.scrollWrapper).addClass('active');

            // if other item should get the focus first before 0,0 set firstElementIndex

            var active = this.active;

            if(options && (options.bottom || options.right) )  {
                index = (options.bottom ? (gridSize[0]-1) : ( this.firstElementIndex ? this.firstElementIndex.split(',')[0] : '0') ) + ',' + (options.right ? (gridSize[1]-1) : ( this.firstElementIndex ? this.firstElementIndex.split(',')[1] : '0'))
            }



            if(!this.active || forced) {
                var dynamic = undefined;
                if(this.dynamicFirstElementIndex) {
                    // allow computed first element index, used on playMovie when play/play+ buttons hidden
                    dynamic = this.dynamicFirstElementIndex();
                }
                index = index || dynamic || this.firstElementIndex || '0,0';


                var active = gridData[index];
                // if new active element is a subview call initFocus without sending the index
                //if(active && active.fm) active.fm.initFocus(null, forced, trigger, focus, forceEnterMode);
            } else {
                active = this.active;
                index = (activePos ? activePos.join(',') : null ) || this.firstElementIndex || '0,0';

            }

            nextPos = index;
            if ($(active).attr("data-disabled")) {
                active = gridData[this.firstElementIndex || "0,0"];
                if ($(active).attr("data-disabled")) {
                    return false;
                }
            }

            var res = this.setActive(active,trigger,focus,forceEnterMode, hitEnter);
            if(res) {
                nextPos = null;
                activePos = index.split(",");
            }

            return res;
        };

        this.blur = function(silent, forceEnterMode) {
            if(!this.active) return;

            $(this.scrollWrapper).removeClass('active');

            if(this.active.fm) this.active.fm.blur(silent, forceEnterMode);
            else {
                $(this.active).removeClass("focused");

                if(!this.menuMode || silent && !this.enterMode || forceEnterMode) {
                    $(this.active).removeClass("active");
                    // if activeMemory, current active gets the focus after coming back to component

                }
            }


            if(!this.activeMemory && !this.menuMode) this.active = null;

            if(!silent) {
                this.trigger("blurred");

            }
        }

        // scroll to an item without changing focus or making it active
        this.scrollTo = function(anchorName) {
            var anchor = _.findWhere(this.anchors, {name: anchorName});
            if(anchor) {
                $(this.scrollable).animate({scrollTop:anchor.scrollPosition});
                //$(this.scrollable).css('top', -anchor.scrollPosition + 'px' );
                //$(this.scrollThumb).css('top', anchor.thumbPosition + 'px' );

                var target = gridData[ anchor.next ];
                if(target) {
                    if(this.menuMode) this.setActive(target,0,0,1);
                    else this.active = target;
                    activePos = anchor.next.split(","); //TODO: setactive and initfocus need refactoring
                }
            }
        }

        this.sync = function() {

            if( this.syncedFM ) {
                var target = $(this.active).attr("data-anchor-group");
                if( target ) {
                    this.syncedFM.scrollTo( target );

                }
            }
        }

        this.listenTo(this,"activeElementChanged", this.sync);

        // in case we want to store and restore active-element, like infinit dynamic scrolling
        this.storeActive = function() {
            this.stored = this.active;
        }

        this.restoreActive = function() {
            this.setActive( this.stored, 1,1,1);
        }

        this.updateScrolls = function() {
            /// TODO: scrollFactor to apply scale effect on scroll, needs to be improved
            if(this.active) $(this.scrollable).scrollTop(this.active.scrollPosition * (this.scrollFactor || 1.57));
        }

        // focus is set to true if it is called from a keyDown(same object or parent focus manager)
        this.setActive = function(active, trigger, focus, forceEnterMode, hitEnter) {
            if(!active) return false;
            var self = this;
            var res = true;
            var bounds = active.getBoundingClientRect ? active.getBoundingClientRect() : null;

            if(active.fm) {
                active.fm.lastKeyCode = this.lastKeyCode;
                // if container of the view is not visible it can't get the focus
                if($(active.el).parent().length && $(active.el).parent().css("display") == "none" ) {
                    res = false;
                } else {
                    if(nextPos && (typeof nextPos == 'string' ) && nextPos.split(',').length) {
                        nextPos = nextPos.split(',');
                    } else nextPos = {};
                    res =  active.fm.initFocus(null,false,trigger, focus, false, {bottom: this.lastKeyCode==38, right: this.lastKeyCode==37});
                }
            } else if( active.getBoundingClientRect ) { // if active is a dom element
                // if first time is getting called set the selected by default
                if(!this.enterMode || forceEnterMode || !this.selected)  {
                    $(this.selected).removeClass("active");
                    $(active).addClass("active");
                    this.selected = active;
                }
                if(focus) {
                    $(this.active).removeClass("focused");
                    $(active).addClass("focused");
                }

                if(this.scrollable && !this.scrollValidated ) {
                    this.validateScroll();
                }
            }


            // handle scrolling if user is using keyboard
            if (!mouseEnabled && !this.liveScroll) {
                if($(active).attr("data-scroll-to-anchor")) { // is active has scroll-to-anchor always scroll to anchor(regardless of being masked)
                    this.scrollTo($(active).attr("data-anchor-group") || $(active).attr("data-anchor"));
                } else if ( !this.mouseMode
                    && ( this.scrollMode || // if scrollbar has text or other not-focusable content or
                       $(this.scrollable).length && $(this.scrollable).has(active).length &&  //  active is inside the scrolling content and
                       ( bounds && (  Math.round(bounds.top) < Math.round(this.scrollableWrapperTop) ||
                            Math.round(bounds.top + bounds.height) > Math.round(this.scrollableWrapperBottom) ) ))) // content has a DOM element and is partially hidden outside of scroll box
                {
                    /// TODO: scrollFactor to apply scale effect on scroll, needs to be improved
                    console.log($(this.scrollable).scrollTop(), active.scrollPosition * (this.scrollFactor || 1.57))
                    $(this.scrollable).stop(true, true)
                    $(this.scrollable).animate({
                        scrollTop:active.scrollPosition * (this.scrollFactor || 1.57)
                    });
                }
            } else if( this.liveScroll ) {
                this.scrollable = $(this.component).find('.scrollable')[0];
                var scrollableBounding = this.scrollable.getBoundingClientRect();

                var scrollWrapper = $(this.component).find('.scrollable-wrapper')[0];
                var scrollWrapperBounding = scrollWrapper.getBoundingClientRect();

                var scrollableHeight = this.scrollable.scrollHeight;


                this.scrollableWrapperTop = scrollWrapperBounding.top;
                this.scrollableWrapperBottom = scrollWrapperBounding.bottom;
                this.scrollableWrapperHeight = scrollWrapperBounding.height;
                this.scrollableHeight = this.scrollable.scrollHeight;


                var bounding = active.getBoundingClientRect();
                var scrollPosition = Math.max(
                    0,
                    Math.min(
                        scrollableHeight - scrollWrapperBounding.height,
                        Math.max(
                            bounding.top - scrollableBounding.top - scrollWrapperBounding.height/2 + bounding.height/2,
                            (bounding.top - scrollableBounding.top  - scrollWrapperBounding.height + bounding.height)
                        )
                    )
                );
                console.log('scrollPosition', scrollPosition)

                // if its visible dont do anything
                if(  bounds && (  Math.round(bounds.top) < Math.round(this.scrollableWrapperTop)  ||  Math.round(bounds.top + bounds.height) > Math.round(this.scrollableWrapperBottom) ) ) {
                    var scrollPosition = Math.max(0, $(active).offset().top - $(this.scrollable).offset().top + $(this.scrollable).scrollTop() - $(this.scrollable).height()/2 + $(active).height()/2);
                    $(this.scrollable).stop(true, true)
                    $(this.scrollable).animate({scrollTop: scrollPosition},{complete: function() {
                        if ( self.scrollable.scrollTop / ( self.scrollable.scrollHeight - self.scrollable.clientHeight  ) > 0.75 ) {
                            self.trigger("NEXT_PAGE");
                        }
                    }});
                }
            }

            if(res) {
                var previousActive = this.active;

                // if return from an adjacent element, reselect the previously selected item without trigerring blurred event
                // if view is a scroll box donot call blur on scrolling//&& isNaN(active.scrollPosition)
                if(this.active != active ) this.blur(true);
                this.active = active;

                if((!this.enterMode || forceEnterMode ) && trigger) this.trigger("activeElementChanged", trigger, active, hitEnter, previousActive);
                this.trigger("focusChanged", trigger, active, hitEnter, previousActive);
            }

            return res;
        };

        this.keyPress = function(keyCode) {

            if(!this.active)
                return false;

            if(this.active.fm && this.active.fm.keyPress(keyCode)) {
                return true;
            }

            this.trigger('keyPress', keyCode);

            return false;
        }

        this.keyUp = function(keyCode) {
            if (this.blockKeyDown) {
                return true;
            } else {
                if (this.active && this.active.fm && this.active.fm.keyUp(keyCode)) {
                    return true;
                }
                else if (keyCode == 13 && !this.ignoreEnter) {
                    $(this.active).trigger("click", true); // to support Backbone native events
                    if(this.enterMode && !$(this.active).hasClass("not-selectable")) {
                        if(this.selected) $(this.selected).removeClass("active");
                        this.selected = this.active;
                        this.trigger("activeElementChanged", true, this.active);
                        $(this.active).addClass("active");
                    }
                    return true;
                }
                this.trigger('keyUp', keyCode);

                return false;
            }
        }

        this.keyDown = function(keyCode, position) {
            this.mouseMode = 0;

            if (this.blockKeyDown) {
                return true;
            }

            //if active component has focusManager and it can handle the keyCode do nothing
            if (this.active && this.active.fm && this.active.fm.keyDown(keyCode)) {
                return true;
            }

            // in case element doesnt have any focusable but needs to listen to key events
            this.trigger('keyDown', keyCode);
            if(!this.active && !this.initFocus(null, false, true, true)) {
                return false;
            }
            var row = activePos[0];
            var column = activePos[1];
            var navigateKey = true;
            var newPosition;
            var pos = row.toString() + "," + column.toString();

            var currentActive = gridData[position] || this.active;

            switch(keyCode) {
                case 37:
                    if ($(currentActive).attr('data-left-position') !== undefined || $(currentActive.el).attr('data-left-position') !== undefined) {
                        pos = $(currentActive).attr('data-left-position') || $(currentActive.el).attr('data-left-position');
                        row = pos.split(",")[0];
                        column = pos.split(",")[1];
                    }
                    else if (column === 0) return false;
                    else if (currentActive.position) {
                        column = (currentActive.position)[1] - 1;
                        pos = row.toString() + "," + column.toString();
                        while(!gridData[pos] && column > 0) {
                            column--;
                            pos = row.toString() + "," + column.toString();
                        }
                        if (!gridData[pos]) {
                            while (!gridData[pos] && row > 0) {
                                row--;
                                column = (currentActive.position)[1] - 1;
                                pos = row.toString() + "," + column.toString();
                                while(!gridData[pos] && column > 0) {
                                    column--;
                                    pos = row.toString() + "," + column.toString();
                                }
                            }
                            if(!gridData[pos]) {
                                row = activePos[0];
                                pos = row.toString() + "," + column.toString();
                                while (!gridData[pos] && row < (gridSize[0] - 1)) {
                                    row++;
                                    column = (currentActive.position)[1] - 1;
                                    pos = row.toString() + "," + column.toString();
                                    while(!gridData[pos] && column > 0) {
                                        column--;
                                        pos = row.toString() + "," + column.toString();
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 38:
                    if ($(currentActive).attr('data-up-position') !== undefined || $(currentActive.el).attr('data-up-position') !== undefined) {
                        pos = $(currentActive).attr('data-up-position') || $(currentActive.el).attr('data-up-position');
                        row = pos.split(",")[0];
                        column = pos.split(",")[1];
                    }
                    else if (row === 0) return false;
                    else if (currentActive.position) {
                        row =  (currentActive.position)[0] - 1;
                        pos = row.toString() + "," + column.toString();
                        while(!gridData[pos] && row > 0) {
                            row--;
                            pos = row.toString() + "," + column.toString();
                        }
                        if (!gridData[pos]) {
                            while (!gridData[pos] && column > 0) {
                                column--;
                                row = (currentActive.position)[0] - 1;
                                pos = row.toString() + "," + column.toString();
                                while(!gridData[pos] && row > 0) {
                                    row--;
                                    pos = row.toString() + "," + column.toString();
                                }
                            }
                            if(!gridData[pos]) {
                                column = activePos[1];
                                pos = row.toString() + "," + column.toString();
                                while (!gridData[pos] && column < (gridSize[1] - 1)) {
                                    column++;
                                    row = (currentActive.position)[0] - 1;
                                    pos = row.toString() + "," + column.toString();
                                    while(!gridData[pos] && row > 0) {
                                        row--;
                                        pos = row.toString() + "," + column.toString();
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 39:
                    if ($(currentActive).attr('data-right-position') !== undefined || $(currentActive.el).attr('data-right-position') !== undefined) {
                        pos = $(currentActive).attr('data-right-position') || $(currentActive.el).attr('data-right-position');
                        row = pos.split(",")[0];
                        column = pos.split(",")[1];
                    }
                    else if (column === (gridSize[1] - 1)) return false;
                    else if( currentActive.position && currentActive.gridSize) {
                        column =  (currentActive.position)[1] + currentActive.gridSize[1];
                        pos = row.toString() + "," + column.toString();
                        while(!gridData[pos] && column < (gridSize[1] - 1)) {
                            column++;
                            pos = row.toString() + "," + column.toString();
                        }
                        if (!gridData[pos]) {
                            while (!gridData[pos] && row > 0) {
                                row--;
                                column = (currentActive.position)[1] + currentActive.gridSize[1];
                                pos = row.toString() + "," + column.toString();
                                while(!gridData[pos] && column < (gridSize[1] - 1)) {
                                    column++;
                                    pos = row.toString() + "," + column.toString();
                                }
                            }
                            if(!gridData[pos]) {
                                row = activePos[0];
                                pos = row.toString() + "," + column.toString();
                                while (!gridData[pos] && row < (gridSize[0] - 1)) {
                                    row++;
                                    column = (currentActive.position)[1] + currentActive.gridSize[1];
                                    pos = row.toString() + "," + column.toString();
                                    while(!gridData[pos] && column < (gridSize[1] - 1)) {
                                        column++;
                                        pos = row.toString() + "," + column.toString();
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 40:
                    if ($(currentActive).attr('data-down-position') !== undefined || $(currentActive.el).attr('data-down-position') !== undefined) {
                        pos = $(currentActive).attr('data-down-position') || $(currentActive.el).attr('data-down-position');
                        row = pos.split(",")[0];
                        column = pos.split(",")[1];
                    }
                    else if (row === (gridSize[0] - 1)) return false;
                    else if( currentActive.position && currentActive.gridSize) {
                        row = (currentActive.position)[0] + currentActive.gridSize[0];
                        pos = row.toString() + "," + column.toString();
                        while(!gridData[pos] && row < (gridSize[0] - 1)) {
                            row++;
                            pos = row.toString() + "," + column.toString();
                        }
                        if (!gridData[pos]) {
                            while (!gridData[pos] && column > 0) {
                                column--;
                                row = (currentActive.position)[0] + currentActive.gridSize[0];
                                pos = row.toString() + "," + column.toString();
                                while(!gridData[pos] && row < (gridSize[0] - 1)) {
                                    row++;
                                    pos = row.toString() + "," + column.toString();
                                }
                            }
                            if(!gridData[pos]) {
                                column = activePos[1];
                                pos = row.toString() + "," + column.toString();
                                while (!gridData[pos] && column < (gridSize[1] - 1)) {
                                    column++;
                                    row = (currentActive.position)[0] + currentActive.gridSize[0];
                                    pos = row.toString() + "," + column.toString();
                                    while(!gridData[pos] && row < (gridSize[0] - 1)) {
                                        row++;
                                        pos = row.toString() + "," + column.toString();
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 13:
                    navigateKey = false;
                    this.trigger("enterPressed", currentActive);

                    break;
                case 8:
                    navigateKey = false;
                    this.trigger("backPressed");
                default:
                    navigateKey = false;
            }

            this.lastKeyCode = keyCode;

            if (!navigateKey) {
                return true;
            } else {
                if(gridData[pos]) {
                    row = (gridData[pos].position)[0];
                    column = (gridData[pos].position)[1];
                    pos = row.toString() + "," + column.toString();
                } else {
                    return false;
                }
            }

            newPosition = pos;

            // if component is disabled repeat the same keycode stroke
            // allow disabled views as well as disabled DOM elements
            if( $(gridData[newPosition]).attr("data-disabled") || (gridData[newPosition] && gridData[newPosition].disabledFocusManager)) return this.keyDown(keyCode, newPosition);

            var res = this.initFocus(newPosition, true, true, true);

            return res;
        }
    }
    _.extend(FocusManager.prototype, Backbone.Events);

    // polyfill
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }


    var dateFormat = function () {
        var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {
            var dF = dateFormat;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date;
            if (isNaN(date)) throw SyntaxError("invalid date");

            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var _ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
                D = date[_ + "Day"](),
                m = date[_ + "Month"](),
                y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
                M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
                L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d:    d,
                    dd:   pad(d),
                    ddd:  dF.i18n.dayNames[D],
                    dddd: dF.i18n.dayNames[D + 7],
                    m:    m + 1,
                    mm:   pad(m + 1),
                    mmm:  dF.i18n.monthNames[m],
                    mmmm: dF.i18n.monthNames[m + 12],
                    yy:   String(y).slice(2),
                    yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12),
                    H:    H,
                    HH:   pad(H),
                    M:    M,
                    MM:   pad(M),
                    s:    s,
                    ss:   pad(s),
                    l:    pad(L, 3),
                    L:    pad(L > 99 ? Math.round(L / 10) : L),
                    t:    H < 12 ? "a"  : "p",
                    tt:   H < 12 ? "am" : "pm",
                    T:    H < 12 ? "A"  : "P",
                    TT:   H < 12 ? "AM" : "PM",
                    Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    }();

// Some common format strings
    dateFormat.masks = {
        "default":      "ddd mmm dd yyyy HH:MM:ss",
        shortDate:      "m/d/yy",
        mediumDate:     "mmm d, yyyy",
        longDate:       "mmmm d, yyyy",
        fullDate:       "dddd, mmmm d, yyyy",
        shortTime:      "h:MM TT",
        mediumTime:     "h:MM:ss TT",
        longTime:       "h:MM:ss TT Z",
        isoDate:        "yyyy-mm-dd",
        isoTime:        "HH:MM:ss",
        isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

// Internationalization strings
    dateFormat.i18n = {
        dayNames: [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
    };

// For convenience...
    Date.prototype.format = function (mask, utc) {
        return dateFormat(this, mask, utc);
    };





    var isAndroid = function () {
        return /(android|Android)/g.test(navigator.userAgent)
    }

    var isIOS = function () {
        return /(iPad|iPhone|iPod)/g.test(navigator.userAgent)
    }

    var isMobile = function () {
        var check = false;
        (function(a){if(/(android|Android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check || isAndroid() || isIOS();
    };

    var httpGetAsync = function(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest()
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                callback(xmlHttp.responseText)
            }
        }
        xmlHttp.open("GET", theUrl, true)
        xmlHttp.send(null)
    }


    var clamp = function (a,b,c) {
        return Math.max(b, Math.min(c,a));
    }


    var isNull = function (obj) {
    return ((typeof(obj) == 'undefined') || (obj == null));
};


    return {
        FocusManager: FocusManager,
        isMobile: isMobile,
        httpGetAsync: httpGetAsync,
        clamp: clamp,
        isNull: isNull
    }

})
