'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(['jquery', 'underscore', 'react', 'hammer', 'text!experience/global.json', 'components/ListView/TransitionListItem', 'components/ListView/VideoListItem', 'components/ListView/ThreeSixtyListItem', 'components/ListView/LocationListItem', 'components/ListView/AccordionListItem'], function ($, _, React, Hammer, GlobalAssets, TransitionListItem, VideoListItem, ThreeSixtyListItem, LocationListItem, AccordionListItem) {
    var ListView = function (_React$Component) {
        _inherits(ListView, _React$Component);

        function ListView(props) {
            _classCallCheck(this, ListView);

            var _this = _possibleConstructorReturn(this, (ListView.__proto__ || Object.getPrototypeOf(ListView)).call(this, props));

            _this.state = {
                items: props.items,
                options: props.options
            };
            return _this;
        }

        _createClass(ListView, [{
            key: 'setHamburgerMenuTitle',
            value: function setHamburgerMenuTitle(place) {
                if (place) {
                    this.state.place = place;
                }
            }
        }, {
            key: 'setData',
            value: function setData(items) {
                if (items) {
                    this.state.items = items;
                }
            }
        }, {
            key: 'render',
            value: function render() {
                var place = this.state.place;
                var globalAssets = JSON.parse(GlobalAssets);
                var options = this.state.options;
                var className = getClassName(options);
                var backgroundImage = getBackgroundImage(options);
                var hasDividers = getDividers(options);
                var router = options.router;

                if (!this.state.items) {
                    return null;
                }

                return React.createElement(
                    'div',
                    { className: className, style: backgroundImage },
                    this.state.items.map(function (listItem) {

                        listItem.name = returnTextCase(options, listItem.name);

                        switch (listItem.contentType.toLowerCase()) {
                            case "video":
                                return React.createElement(VideoListItem, {
                                    data: listItem,
                                    playIconURL: globalAssets.videoPlayIconAsset,
                                    gradientURL: globalAssets.gradientAsset,
                                    hasDividers: hasDividers,
                                    router: router
                                });
                                break;
                            case "360":
                                return React.createElement(ThreeSixtyListItem, {
                                    data: listItem,
                                    threeSixtyIconURL: globalAssets.threeSixtyIconAsset,
                                    gradientURL: globalAssets.gradientAsset,
                                    hasDividers: hasDividers,
                                    router: router
                                });
                                break;
                            case "google_map":
                                return React.createElement(LocationListItem, {
                                    place: place,
                                    data: listItem,
                                    gradientURL: globalAssets.gradientAsset,
                                    hasDividers: hasDividers,
                                    router: router
                                });
                                break;
                            case "accordion":
                                return React.createElement(AccordionListItem, {
                                    data: listItem,
                                    accordionArrowDownURL: globalAssets.accordionArrowDownAsset,
                                    accordionArrowUpURL: globalAssets.accordionArrowUpAsset,
                                    gradientURL: globalAssets.gradientAsset,
                                    hasDividers: hasDividers,
                                    router: router
                                });
                                break;
                            default:
                                return React.createElement(TransitionListItem, {
                                    data: listItem,
                                    gradientURL: globalAssets.gradientAsset,
                                    hasDividers: hasDividers,
                                    router: router
                                });
                                break;
                        }
                    })
                );
            }
        }]);

        return ListView;
    }(React.Component);

    function returnTextCase(options, text) {
        var transformedText = text;
        if (options && options.textCase) {
            transformedText = options.textCase.toLowerCase() === "upper" ? text.toUpperCase() : options.textCase.toLowerCase() === "lower" ? text.toLowerCase() : text;
        }

        return transformedText;
    }

    function getClassName(options) {
        var className = "vanilla-list-view";
        if (options && options.className) {
            className = options.className;
        }
        return className;
    }

    function getBackgroundImage(options) {
        var style = {};
        if (options && options.backgroundImage) {
            style = {
                backgroundImage: 'url(' + options.backgroundImage + ')',
                repeat: 'norepeat'
            };
        }
        return style;
    }

    function getDividers(options) {
        return options && options.hasDividers;
    }

    ListView.propTypes = {
        items: React.PropTypes.array.isRequired
    };

    return ListView;
});
