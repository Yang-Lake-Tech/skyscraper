define([
    'jquery',
    'underscore',
    'react',
    'reactDOM',
    'hammer',
    'text!experience/global.json'
], function ($, _, React, ReactDOM, Hammer, GlobalAssets) {

    class AccordionListItem extends React.Component {

        render() {

            let itemStyle = {};

            if (this.props.data.thumbnail) {
                itemStyle = {
                    backgroundImage: 'url(' + this.props.data.thumbnail + ')',
                    repeat: 'norepeat'
                };
            }

            //TODO: Look into whether or not we can transition the accordion arrow
            //or if we need to do two images and swap their visibility

            if (this.props.hasDividers) {
                return (
                    <div>
                        <hr className="list-view-divider"/>
                        <div className="list-item-accordion" style={itemStyle}>
                            <div className="accordion-header">
                                <span className="accordion-header-name">{this.props.data.name}</span>
                                <img className="accordion-arrow" src={this.props.accordionArrowDownURL}/>
                            </div>
                            <div className="accordion-body" ref={body => this.accordionBody = body }>
                                <span className="accordion-body-name">{this.props.data.text}</span>
                            </div>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="list-item-accordion" style={itemStyle}>
                        <div className="accordion-header accordion-header-selected">
                            <span className="accordion-header-name">{this.props.data.name}</span>
                            <img className="accordion-arrow" src={this.props.accordionArrowDownURL}/>
                        </div>
                        <div className="accordion-body">
                            <span className="accordion-body-name">{this.props.data.text}</span>
                        </div>
                    </div>
                );
            }

        }

        componentDidMount() {
            let self = this;

            const selfIndex = this.props.data.index;

            const eventBus = this.props.router.eventBus;
            const coordinates = this.props.data.coordinates;

            this.domNode = Hammer(ReactDOM.findDOMNode(this));
            this.domNode.on('tap', function () {
                let self = this;

                $('.accordion-body').each(function(index) {
                    // TODO: On tap, show selected glow on tapped item
                    $(this).parent().find('.accordion-arrow')[0].src = self.props.accordionArrowDownURL;
                    $(this).parent().find('.accordion-header').removeClass('selected');
                    $(this).hide();
                    if (index === selfIndex){
                        $(this).show();
                        $(this).parent().find('.accordion-arrow')[0].src = self.props.accordionArrowUpURL;
                        $(this).parent().find('.accordion-header').addClass('selected');
                        eventBus.trigger('onMapLocationChanged', coordinates);
                    }
                });
            }.bind(this));

        }

        componentWillUnmount() {
            this.domNode.off('tap');
        }

    }

    AccordionListItem.propTypes = {
        data: React.PropTypes.object.isRequired,
        accordionArrowDownURL: React.PropTypes.string.isRequired,
        accordionArrowUpURL: React.PropTypes.string.isRequired,
        gradientURL: React.PropTypes.string,
        hasDividers: React.PropTypes.bool
    };

    return AccordionListItem;

});