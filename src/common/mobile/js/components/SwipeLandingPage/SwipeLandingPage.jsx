define([
    'reactDOM',
    'jquery',
    'underscore',
    'react',
    'hammer'
], function (ReactDOM, $, _, React, Hammer) {
    class SwipeLandingPage extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                backgroundUrl: props.backgroundUrl
            }
        }

        setBackgroundUrl(url) {
            if (this.state && url) {
                this.state.backgroundUrl = url;
            }
        }

        render() {
            return (
                <div className="swipe-landing-page">
                    <img className="background" src={this.state.backgroundUrl}/>
                    <div className="arrow left-arrow"/>
                    <div className="arrow right-arrow"/>
                    <div className="section-title">{this.props.sectionTitle}</div>
                    <div className="section-subtitle">{this.props.sectionSubtitle}</div>
                    <div className="swipe-text-bottom">{this.props.bottomText}</div>
                    <div className="down-arrow-bottom"/>
                </div>
            );
        }

        navigateToTarget (target, reset) {
            reset ? this.props.router.resetToViewId(target) : this.props.router.loadViewById(target);
        }

        componentDidMount() {
            this.hammerBackground = new Hammer($(ReactDOM.findDOMNode(this)).find('.background')[0]);
            this.hammerBackground.get('swipe').set({
                direction: Hammer.DIRECTION_ALL,
                threshold: 1,
                velocity:0.1
            });
            this.hammerBackground.on('swipeleft', this.navigateToTarget.bind(this, this.props.rightTarget, true));
            this.hammerBackground.on('swiperight', this.navigateToTarget.bind(this, this.props.leftTarget, true));
            this.hammerBackground.on('swipeup', function(){
                if (this.props.router.viewStack.length < 3) {
                    this.navigateToTarget.call(this, this.props.contentTarget, false);
                }
            }.bind(this));

            this.hammerLeftArrow = Hammer($(ReactDOM.findDOMNode(this)).find('.left-arrow')[0]);
            this.hammerLeftArrow.on('tap', this.navigateToTarget.bind(this, this.props.leftTarget, true));

            this.hammerRightArrow = Hammer($(ReactDOM.findDOMNode(this)).find('.right-arrow')[0]);
            this.hammerRightArrow.on('tap', this.navigateToTarget.bind(this, this.props.rightTarget, true));

            this.contentTargetHammerSources = [
                Hammer($(ReactDOM.findDOMNode(this)).find('.down-arrow-bottom')[0]),
                Hammer($(ReactDOM.findDOMNode(this)).find('.swipe-text-bottom')[0])
            ];
            _.each(this.contentTargetHammerSources, function(hammerSource){
                hammerSource.on('tap', this.navigateToTarget.bind(this, this.props.contentTarget, false));
            }.bind(this));
        }

        componentWillUnmount() {
            this.hammerBackground.off('swipeleft swiperight');
            this.hammerLeftArrow.off('tap');
            this.hammerRightArrow.off('tap');
            _.each(this.contentTargetHammerSources, function(hammerSource){
                hammerSource.off('tap');
            }.bind(this));
        }
    }

    SwipeLandingPage.propTypes = {
        backgroundUrl: React.PropTypes.array.isRequired,
        sectionTitle: React.PropTypes.array.isRequired
    };

    return SwipeLandingPage;
});