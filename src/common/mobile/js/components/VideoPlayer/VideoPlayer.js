'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(['react', 'reactDOM', 'jquery', 'underscore'], function (React, ReactDOM, $, _) {
    var VideoPlayer = function (_React$Component) {
        _inherits(VideoPlayer, _React$Component);

        function VideoPlayer(props) {
            _classCallCheck(this, VideoPlayer);

            var _this = _possibleConstructorReturn(this, (VideoPlayer.__proto__ || Object.getPrototypeOf(VideoPlayer)).call(this, props));

            _this.state = {
                src: props.src
            };
            return _this;
        }

        _createClass(VideoPlayer, [{
            key: 'setSource',
            value: function setSource(source) {
                if (source) {
                    this.state.src = source;
                }
            }
        }, {
            key: 'render',
            value: function render() {
                return React.createElement(
                    'div',
                    null,
                    React.createElement('div', { id: 'close-video-player-hit-box' }),
                    React.createElement('div', { id: 'close-video-player' }),
                    React.createElement('div', { id: 'video-play-icon' }),
                    React.createElement('video', { 'webkit-playsinline': true, playsinline: true, id: 'video-plane', src: this.state.src }),
                    React.createElement('div', { id: 'video-tap-zone' }),
                    React.createElement(
                        'div',
                        { id: 'ui-layer' },
                        React.createElement(
                            'div',
                            { id: 'video-timeline' },
                            React.createElement('div', { id: 'video-timeline-bar' }),
                            React.createElement('div', { id: 'video-completed' }),
                            React.createElement(
                                'div',
                                { id: 'video-timeline-thumb' },
                                React.createElement(
                                    'div',
                                    { id: 'video-timecode' },
                                    '0:00'
                                ),
                                React.createElement('div', { id: 'video-marker' })
                            )
                        )
                    )
                );
            }
        }]);

        return VideoPlayer;
    }(React.Component);

    return VideoPlayer;
});
