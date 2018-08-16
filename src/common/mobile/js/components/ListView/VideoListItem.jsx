define([
    'jquery',
    'underscore',
    'react',
    'reactDOM',
    'hammer'
], function ($, _, React, ReactDOM, Hammer) {

    class VideoListItem extends React.Component {

        render() {
            const itemStyle = {
                backgroundImage: 'url(' + this.props.data.thumbnail + ')',
                repeat: 'norepeat'
            };

            if (this.props.hasDividers) {
                return (
                    <div>
                        <hr className="list-view-divider"/>
                        <div className="list-item-video" style={itemStyle}>
                            <img className="play-icon" src={this.props.playIconURL}/>
                            <span className="name">{this.props.data.name}</span>
                            <img className="gradient" src={this.props.gradientURL}/>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="list-item-video" style={itemStyle}>
                        <img className="play-icon" src={this.props.playIconURL}/>
                        <span className="name">{this.props.data.name}</span>
                        <img className="gradient" src={this.props.gradientURL}/>
                    </div>
                );
            }
        }

        componentDidMount() {
            this.domNode = Hammer(ReactDOM.findDOMNode(this));
            this.domNode.on('tap', function() {
                this.props.router.loadViewById(this.props.data.asset);
            }.bind(this));
        }

        componentWillUnmount() {
            this.domNode.off('tap');
        }

    }

    VideoListItem.propTypes = {
        data: React.PropTypes.object.isRequired,
        playIconURL: React.PropTypes.string.isRequired,
        gradientURL: React.PropTypes.string,
        hasDividers: React.PropTypes.bool
    };

    return VideoListItem;

});