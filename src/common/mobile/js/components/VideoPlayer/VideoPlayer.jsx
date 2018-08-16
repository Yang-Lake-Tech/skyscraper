define([
    'react',
    'reactDOM',
    'jquery',
    'underscore',

], function (React, ReactDOM, $, _) {
    class VideoPlayer extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                src: props.src
            };
        }

        setSource (source) {
            if (source) {
                this.state.src = source;
            }
        }

        render() {
            return (
                <div>
                    <div id="close-video-player-hit-box"/>
                    <div id="close-video-player"/>
                    <div id="video-play-icon"/>
                    <video webkit-playsinline playsinline id="video-plane" src={this.state.src}/>
                    <div id="video-tap-zone"/>
                    <div id="ui-layer">
                        <div id="video-timeline">
                            <div id="video-timeline-bar"/>
                            <div id="video-completed"/>
                            <div id="video-timeline-thumb">
                                <div id="video-timecode">0:00</div>
                                <div id="video-marker"/>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return VideoPlayer;
});