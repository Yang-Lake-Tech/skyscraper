'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(['jquery', 'underscore', 'react', 'reactDOM', 'hammer'], function ($, _, React, ReactDOM, Hammer) {
    var LocationListItem = function (_React$Component) {
        _inherits(LocationListItem, _React$Component);

        function LocationListItem() {
            _classCallCheck(this, LocationListItem);

            return _possibleConstructorReturn(this, (LocationListItem.__proto__ || Object.getPrototypeOf(LocationListItem)).apply(this, arguments));
        }

        _createClass(LocationListItem, [{
            key: 'render',
            value: function render() {

                var itemStyle = {
                    backgroundImage: 'url(' + this.props.data.thumbnail + ')',
                    repeat: 'norepeat'
                };

                if (this.props.hasDividers) {
                    return React.createElement(
                        'div',
                        null,
                        React.createElement('hr', { className: 'list-view-divider' }),
                        React.createElement(
                            'div',
                            { className: 'list-item-location', style: itemStyle },
                            React.createElement(
                                'span',
                                { className: 'name' },
                                this.props.data.name
                            ),
                            React.createElement('img', { className: 'gradient', src: this.props.gradientURL })
                        )
                    );
                } else {
                    return React.createElement(
                        'div',
                        { className: 'list-item-location', style: itemStyle },
                        React.createElement(
                            'span',
                            { className: 'name' },
                            this.props.data.name
                        ),
                        React.createElement('img', { className: 'gradient', src: this.props.gradientURL })
                    );
                }
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                this.domNode = Hammer(ReactDOM.findDOMNode(this));
                this.domNode.on('tap', function () {
                    this.props.router.loadViewById(this.props.data.nextPageGUID, { title: this.props.place, locationList: this.props.data.locations });
                }.bind(this));
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                this.domNode.off('tap');
            }
        }]);

        return LocationListItem;
    }(React.Component);

    LocationListItem.propTypes = {
        data: React.PropTypes.object.isRequired,
        gradientURL: React.PropTypes.string,
        hasDividers: React.PropTypes.bool
    };

    return LocationListItem;
});
