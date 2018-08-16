'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(['jquery', 'underscore', 'react', 'reactDOM', 'hammer', 'text!experience/global.json'], function ($, _, React, ReactDOM, Hammer, GlobalAssets) {
    var AccordionListItem = function (_React$Component) {
        _inherits(AccordionListItem, _React$Component);

        function AccordionListItem() {
            _classCallCheck(this, AccordionListItem);

            return _possibleConstructorReturn(this, (AccordionListItem.__proto__ || Object.getPrototypeOf(AccordionListItem)).apply(this, arguments));
        }

        _createClass(AccordionListItem, [{
            key: 'render',
            value: function render() {
                var _this2 = this;

                var itemStyle = {};

                if (this.props.data.thumbnail) {
                    itemStyle = {
                        backgroundImage: 'url(' + this.props.data.thumbnail + ')',
                        repeat: 'norepeat'
                    };
                }

                //TODO: Look into whether or not we can transition the accordion arrow
                //or if we need to do two images and swap their visibility

                if (this.props.hasDividers) {
                    return React.createElement(
                        'div',
                        null,
                        React.createElement('hr', { className: 'list-view-divider' }),
                        React.createElement(
                            'div',
                            { className: 'list-item-accordion', style: itemStyle },
                            React.createElement(
                                'div',
                                { className: 'accordion-header' },
                                React.createElement(
                                    'span',
                                    { className: 'accordion-header-name' },
                                    this.props.data.name
                                ),
                                React.createElement('img', { className: 'accordion-arrow', src: this.props.accordionArrowDownURL })
                            ),
                            React.createElement(
                                'div',
                                { className: 'accordion-body', ref: function ref(body) {
                                        return _this2.accordionBody = body;
                                    } },
                                React.createElement(
                                    'span',
                                    { className: 'accordion-body-name' },
                                    this.props.data.text
                                )
                            )
                        )
                    );
                } else {
                    return React.createElement(
                        'div',
                        { className: 'list-item-accordion', style: itemStyle },
                        React.createElement(
                            'div',
                            { className: 'accordion-header accordion-header-selected' },
                            React.createElement(
                                'span',
                                { className: 'accordion-header-name' },
                                this.props.data.name
                            ),
                            React.createElement('img', { className: 'accordion-arrow', src: this.props.accordionArrowDownURL })
                        ),
                        React.createElement(
                            'div',
                            { className: 'accordion-body' },
                            React.createElement(
                                'span',
                                { className: 'accordion-body-name' },
                                this.props.data.text
                            )
                        )
                    );
                }
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                var self = this;

                var selfIndex = this.props.data.index;

                var eventBus = this.props.router.eventBus;
                var coordinates = this.props.data.coordinates;

                this.domNode = Hammer(ReactDOM.findDOMNode(this));
                this.domNode.on('tap', function () {
                    var self = this;

                    $('.accordion-body').each(function (index) {
                        // TODO: On tap, show selected glow on tapped item
                        $(this).parent().find('.accordion-arrow')[0].src = self.props.accordionArrowDownURL;
                        $(this).parent().find('.accordion-header').removeClass('selected');
                        $(this).hide();
                        if (index === selfIndex) {
                            $(this).show();
                            $(this).parent().find('.accordion-arrow')[0].src = self.props.accordionArrowUpURL;
                            $(this).parent().find('.accordion-header').addClass('selected');
                            eventBus.trigger('onMapLocationChanged', coordinates);
                        }
                    });
                }.bind(this));
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                this.domNode.off('tap');
            }
        }]);

        return AccordionListItem;
    }(React.Component);

    AccordionListItem.propTypes = {
        data: React.PropTypes.object.isRequired,
        accordionArrowDownURL: React.PropTypes.string.isRequired,
        accordionArrowUpURL: React.PropTypes.string.isRequired,
        gradientURL: React.PropTypes.string,
        hasDividers: React.PropTypes.bool
    };

    return AccordionListItem;
});
