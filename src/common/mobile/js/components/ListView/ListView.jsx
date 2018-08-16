define([
    'jquery',
    'underscore',
    'react',
    'hammer',
    'text!experience/global.json',
    'components/ListView/TransitionListItem',
    'components/ListView/VideoListItem',
    'components/ListView/ThreeSixtyListItem',
    'components/ListView/LocationListItem',
    'components/ListView/AccordionListItem'
], function ($, _, React, Hammer, GlobalAssets,
             TransitionListItem, VideoListItem, ThreeSixtyListItem, LocationListItem, AccordionListItem) {

    class ListView extends React.Component {

        constructor(props) {
            super(props);
            this.state = {
                items: props.items,
                options: props.options
            };
        }

        setHamburgerMenuTitle (place) {
            if (place) {
                this.state.place = place;
            }
        }

        setData(items) {
            if (items) {
                this.state.items = items;
            }
        }

        render() {
            const place = this.state.place;
            const globalAssets = JSON.parse(GlobalAssets);
            const options = this.state.options;
            const className = getClassName(options);
            const backgroundImage = getBackgroundImage(options);
            const hasDividers = getDividers(options);
            const router = options.router;

            if (!this.state.items){
                return null;
            }

            return (
                <div className={className} style={backgroundImage}>
                    {
                        this.state.items.map(function (listItem) {

                            listItem.name = returnTextCase(options, listItem.name);

                            switch (listItem.contentType.toLowerCase()) {
                                case "video":
                                    return <VideoListItem
                                        data={listItem}
                                        playIconURL={globalAssets.videoPlayIconAsset}
                                        gradientURL={globalAssets.gradientAsset}
                                        hasDividers={hasDividers}
                                        router={router}
                                    />;
                                    break;
                                case "360":
                                    return <ThreeSixtyListItem
                                        data={listItem}
                                        threeSixtyIconURL={globalAssets.threeSixtyIconAsset}
                                        gradientURL={globalAssets.gradientAsset}
                                        hasDividers={hasDividers}
                                        router={router}
                                    />;
                                    break;
                                case "google_map":
                                    return <LocationListItem
                                        place={place}
                                        data={listItem}
                                        gradientURL={globalAssets.gradientAsset}
                                        hasDividers={hasDividers}
                                        router={router}
                                    />;
                                    break;
                                case "accordion":
                                    return <AccordionListItem
                                        data={listItem}
                                        accordionArrowDownURL={globalAssets.accordionArrowDownAsset}
                                        accordionArrowUpURL={globalAssets.accordionArrowUpAsset}
                                        gradientURL={globalAssets.gradientAsset}
                                        hasDividers={hasDividers}
                                        router={router}
                                    />;
                                    break;
                                default:
                                    return <TransitionListItem
                                        data={listItem}
                                        gradientURL={globalAssets.gradientAsset}
                                        hasDividers={hasDividers}
                                        router={router}
                                    />;
                                    break;
                            }
                        })
                    }
                </div>
            );
        }
    }

    function returnTextCase(options, text) {
        let transformedText = text;
        if (options && options.textCase) {
            transformedText = (options.textCase.toLowerCase() === "upper")
                ? text.toUpperCase()
                : (options.textCase.toLowerCase() === "lower")
                    ? text.toLowerCase()
                    : text;
        }

        return transformedText;
    }

    function getClassName(options) {
        let className = "vanilla-list-view";
        if (options && options.className) {
            className = options.className;
        }
        return className;
    }

    function getBackgroundImage(options) {
        let style = {};
        if (options && options.backgroundImage) {
            style = {
                backgroundImage: 'url(' + options.backgroundImage + ')',
                repeat: 'norepeat'
            };
        }
        return style;
    }

    function getDividers(options){
        return (options && options.hasDividers);
    }


    ListView.propTypes = {
        items: React.PropTypes.array.isRequired
    };

    return ListView;

});