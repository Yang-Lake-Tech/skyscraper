'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(['reactDOM', 'jquery', 'underscore', 'react', 'hammer'], function (ReactDOM, $, _, React, Hammer) {
    var SwipeLandingPage = function (_React$Component) {
        _inherits(SwipeLandingPage, _React$Component);

        function SwipeLandingPage(props) {
            _classCallCheck(this, SwipeLandingPage);

            var _this = _possibleConstructorReturn(this, (SwipeLandingPage.__proto__ || Object.getPrototypeOf(SwipeLandingPage)).call(this, props));

            _this.state = {
                backgroundUrl: props.backgroundUrl
            };
            return _this;
        }

        _createClass(SwipeLandingPage, [{
            key: 'setBackgroundUrl',
            value: function setBackgroundUrl(url) {
                if (this.state && url) {
                    this.state.backgroundUrl = url;
                }
            }
        }, {
            key: 'render',
            value: function render() {
                return React.createElement(
                    'div',
                    { className: 'swipe-landing-page' },
                    React.createElement('img', { className: 'background', src: this.state.backgroundUrl }),
                    React.createElement('div', { className: 'arrow left-arrow' }),
                    React.createElement('div', { className: 'arrow right-arrow' }),
                    React.createElement(
                        'div',
                        { className: 'section-title' },
                        this.props.sectionTitle
                    ),
                    React.createElement(
                        'div',
                        { className: 'section-subtitle' },
                        this.props.sectionSubtitle
                    ),
                    React.createElement(
                        'div',
                        { className: 'swipe-text-bottom' },
                        this.props.bottomText
                    ),
                    React.createElement('div', { className: 'down-arrow-bottom' })
                );
            }
        }, {
            key: 'navigateToTarget',
            value: function navigateToTarget(target, reset) {
                reset ? this.props.router.resetToViewId(target) : this.props.router.loadViewById(target);
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                this.hammerBackground = new Hammer($(ReactDOM.findDOMNode(this)).find('.background')[0]);
                this.hammerBackground.get('swipe').set({
                    direction: Hammer.DIRECTION_ALL,
                    threshold: 1,
                    velocity: 0.1
                });
                this.hammerBackground.on('swipeleft', this.navigateToTarget.bind(this, this.props.rightTarget, true));
                this.hammerBackground.on('swiperight', this.navigateToTarget.bind(this, this.props.leftTarget, true));
                this.hammerBackground.on('swipeup', function () {
                    if (this.props.router.viewStack.length < 3) {
                        this.navigateToTarget.call(this, this.props.contentTarget, false);
                    }
                }.bind(this));

                this.hammerLeftArrow = Hammer($(ReactDOM.findDOMNode(this)).find('.left-arrow')[0]);
                this.hammerLeftArrow.on('tap', this.navigateToTarget.bind(this, this.props.leftTarget, true));

                this.hammerRightArrow = Hammer($(ReactDOM.findDOMNode(this)).find('.right-arrow')[0]);
                this.hammerRightArrow.on('tap', this.navigateToTarget.bind(this, this.props.rightTarget, true));

                this.contentTargetHammerSources = [Hammer($(ReactDOM.findDOMNode(this)).find('.down-arrow-bottom')[0]), Hammer($(ReactDOM.findDOMNode(this)).find('.swipe-text-bottom')[0])];
                _.each(this.contentTargetHammerSources, function (hammerSource) {
                    hammerSource.on('tap', this.navigateToTarget.bind(this, this.props.contentTarget, false));
                }.bind(this));
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                this.hammerBackground.off('swipeleft swiperight');
                this.hammerLeftArrow.off('tap');
                this.hammerRightArrow.off('tap');
                _.each(this.contentTargetHammerSources, function (hammerSource) {
                    hammerSource.off('tap');
                }.bind(this));
            }
        }]);

        return SwipeLandingPage;
    }(React.Component);

    SwipeLandingPage.propTypes = {
        backgroundUrl: React.PropTypes.array.isRequired,
        sectionTitle: React.PropTypes.array.isRequired
    };

    return SwipeLandingPage;
});
