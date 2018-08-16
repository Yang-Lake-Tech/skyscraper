define([
    'jquery',
    'underscore',
    'react',
    'reactDOM',
    'hammer'
], function ($, _, React, ReactDOM, Hammer) {

    class TransitionListItem extends React.Component {

        render() {
            const itemStyle = {
                backgroundImage: 'url(' + this.props.data.thumbnail + ')',
                repeat: 'norepeat'
            };

            if (this.props.hasDividers) {
                return (
                    <div>
                        <hr className="list-view-divider"/>
                        <div className="list-item-transition" style={itemStyle}>
                            <span className="name">{this.props.data.name}</span>
                            <img className="gradient" src={this.props.gradientURL}/>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="list-item-transition" style={itemStyle}>
                        <span className="name">{this.props.data.name}</span>
                        <img className="gradient" src={this.props.gradientURL}/>
                    </div>
                );
            }
        }

        componentDidMount() {
            this.domNode = Hammer(ReactDOM.findDOMNode(this));
            this.domNode.on('tap', function() {
                this.props.router.loadViewById(this.props.data.nextPageGUID, {
                    place: this.domNode.element.innerText,
                    listItems: this.props.data.content
                });
            }.bind(this));

        }

        componentWillUnmount() {
            this.domNode.off('tap');
        }


    }

    TransitionListItem.propTypes = {
        data: React.PropTypes.object.isRequired,
        gradientURL: React.PropTypes.string,
        hasDividers: React.PropTypes.bool,
        router: React.PropTypes.object.isRequired
    };

    return TransitionListItem;

});