define([
    'underscore',
    'backbone',
    'common/js/NativeBridge',
    'common/js/models/TitleMetaDataModel',
    'experience/js/viewLoader'
], function (_, Backbone, NativeBridge, TitleMetaDataModel, ViewLoader) {
    return Backbone.Router.extend({
        movieMetadata: {},
        eventBus: _({}).extend(Backbone.Events),

        viewStack: [],

        start: function() {
            var model = new TitleMetaDataModel();

            model.fetch({
                success: function(metadata) {
                    this.movieMetadata = {
                        title: metadata.attributes.title,
                        content: metadata.attributes.content
                    };

                    ViewLoader.loadViews(this);

                    Backbone.history.start();
                }.bind(this),
                error: function() {
                    console.error('metadata model fetch error');
                }.bind(this)
            });
        },

        loadViewById: function (id, viewData, transition) {
            var viewMetadata = _.findWhere(this.movieMetadata.content, { guid: id });

            if ($.type(viewData) === 'object' || !viewData) {
                viewMetadata = _.extend(viewMetadata, viewData);
            } else {
                viewMetadata = _.extend(viewMetadata, { view_data: viewData });
            }

            if (viewMetadata) {
                this.loadViewByMetadata(viewMetadata, viewMetadata, transition);
            }
        },

        resetToViewId: function (id, viewData, transition) {
            while (this.viewStack.length > 1) {
                this.popView();
            }

            const landingViewId = _.findWhere(this.movieMetadata.content, { mobile_view_name: "landing-view" }).guid;
            landingViewId !== id ? this.loadViewById(id, viewData, transition) : null;
        },

        loadViewByMetadata: function(viewMetadata, viewData, transition) {
            var view = null;

            switch (viewMetadata.asset_type) {
                case "Video":
                    if (!viewData.metadata.video.url.match(/^http/)) {
                        viewData.metadata.video.url = this.movieMetadata.title.base_url + viewData.metadata.video.url;
                    }
                    view = _.find(ViewLoader.views, function (view) {
                        return view.className.includes("video-view");
                    }.bind(this));
                    break;
                case "Third_Party":
                    view = _.find(ViewLoader.views, function (view) {
                        return view.className.includes("third-party-content-view");
                    }.bind(this));
                    break;
                default:
                    view = _.find(ViewLoader.views, function (view) {
                        return view.className.includes(viewMetadata.mobile_view_name);
                    });
                    break;
            }

            if (view) {
                this.pushView(view, viewData, transition);
            }
        },

        pushView: function(view, viewData, transition) {
            if (view instanceof Backbone.View) {
                var current = null;

                if (this.viewStack.length) {
                    current = this.viewStack[this.viewStack.length - 1];

                    if (_.isFunction(current.suspend)) {
                        current.suspend();
                    }
                }

                this.viewStack.push(view);

                if (_.isFunction(view.resume)) {
                    view.resume(viewData);
                }

                view.delegateEvents();

                this.transitionViews(current, view, transition);

                if (_.isFunction(view.startAnalytics)) {
                    view.startAnalytics();
                }
            }
        },

        popView: function(resumeData, transition) {
            if (this.viewStack.length > 1) {
                var current = this.viewStack.pop();

                if (current instanceof Backbone.View) {
                    if (_.isFunction(current.suspend)) {
                        current.suspend();
                    }
                }

                var previous = this.viewStack[this.viewStack.length - 1];

                previous.delegateEvents();

                this.transitionViews(current, previous, transition);

                if (_.isFunction(previous.resume)) {
                    previous.resume(resumeData);
                }

                if (_.isFunction(previous.startAnalytics)) {
                    previous.startAnalytics();
                }
            } else if (this.viewStack.length === 1) {
                NativeBridge.AppShutdown();
            }
        },

        transitionViews: function (from, to, transition) {
            switch (transition) {
                case 'none':
                    to.$el.show();
                    if (from instanceof Backbone.View) {
                        from.$el.hide();
                    }
                    break;
                case 'fade':
                default:
                    if (from instanceof Backbone.View) {
                        from.$el.fadeOut();
                    }
                    to.$el.fadeIn();
                    break;
            }

        },

        showProgress: function(progress) {
            $("#loading-wrapper .progress-bar").css('transform', 'translateX(' + parseInt(progress > 100 ? 100 : progress, 10) + '%)');
        }
    });
});