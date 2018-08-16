//OmnitureAnalyticsHelper.js
define([
    'nextGenSCode'
], function(S) {
    return function (metadata, experienceName) {
        var s = S;
        this.titleMetadata = metadata.titleMetaData;

        s.contextData['next.title'] = this.titleMetadata.title.name;
        s.contextData['next.experience'] = experienceName;

        this.setTitle = function (title, send) {
            if (title) s.contextData['next.title'] = title;
            if (send) push();
        };
        this.setExperience = function (experience, send) {
            if (experience) s.contextData['next.experience'] = experience;
            if (send) push();
        };
        this.setPage = function (page, send) {
            s.contextData['next.page'] = page;
            if (send) push();
        };
        this.setAsset = function (asset, send) {
            s.contextData['next.asset'] = asset;
            if (send) push();
        };
        this.setType = function (type, send) {
            s.contextData['next.type'] = type;
            if (send) push();
        };
        this.setAction = function (action, send) {
            var actionName = action +
                " [Movie: " + (s.contextData['next.title'] ?
                    s.contextData['next.title'] :
                    this.titleMetadata.title.name) +
                ( (s.contextData['next.experience'] || experienceName) ?
                    (" (" + (s.contextData['next.experience'] ?
                        s.contextData['next.experience'] :
                        experienceName ) + "), ") :
                    ", ") +
                "Location: " + s.contextData['next.page'] + "]";

            s.contextData['next.action'] = action;

            pushLink(actionName);

            if (send) push();
        };
        this.setVideoName = function (videoName, send) {
            s.contextData['next.videoname'] = videoName;
            if (send) push();
        };
        this.set360_x = function (x, send) {
            s.contextData['next.360_x'] = x;
            if (send) push();
        };
        this.set360_y = function (y, send) {
            s.contextData['next.360_y'] = y;
            if (send) push();
        };
        this.set360_z = function (z, send) {
            s.contextData['next.360_z'] = z;
            if (send) push();
        };
        this.set360_time = function (time, send) {
            s.contextData['next.360_time'] = time;
            if (send) push();
        };
        this.setEvents = function (events, send) {
            s.events = events;
            if (send) push();
        };

        this.onExperienceLoad =  function () {
            this.setTitle();
            this.setExperience(null, true);
        };

        function pushLink (action) {
            s.tl(true, 'o', action);
        }

        function push () {
            s.t();
            reset();
        }

        this.startSessionOnPage = function(page) {
            console.log('[Omniture] startSessionOnPage', page)
            s.contextData['next.page'] = page;
            s.contextData['next.session'] = 'start';
            push();
        }

        this.setContent = function(content) {
            console.log('[Omniture] setContent', content)
            s.contextData['next.content'] = content;
            push();
        }

        this.stopSession = function() {
            console.log('[Omniture] stopSession')
            s.contextData['next.session'] = 'exit';
            push();
        }

        function reset () {
            s.contextData['next.asset'] = "";
            s.contextData['next.type'] = "";
            s.contextData['next.action'] = "";
            s.contextData['next.videoname'] = "";
            s.contextData['next.360_x'] = "";
            s.contextData['next.360_y'] = "";
            s.contextData['next.360_z'] = "";
            s.contextData['next.360_time'] = "";
            s.events = "";
        }
    };
});