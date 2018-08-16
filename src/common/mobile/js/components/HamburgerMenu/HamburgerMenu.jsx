define([
    'reactDOM',
    'jquery',
    'underscore',
    'react',
    'hammer',
    'common/mobile/js/components/HamburgerMenu/HAMBURGER_MENU_STATE_CONSTANTS'
], function (ReactDOM, $, _, React, Hammer, STATE_CONSTANT) {
    class HamburgerMenu extends React.Component {
        constructor(props) {
            super(props);
            this.router = props.router;
            this.state = {
                menuItems: props.menuItems,
                iconState: "",
                titlePanelState: STATE_CONSTANT.TITLE_PANEL_STATE.TRANSPARENT,
                menuState: "",
                returnText: "",
                title: ""
            };
        }

        addToMenuItems (item) {
            if (item instanceof Array) {
                this.state.menuItems = this.state.menuItems.concat(item);
            } else {
                this.state.menuItems.push(item);
            }

            this.setState();
        }

        setTitle (title) {
            this.state.title = title;
            this.setState();
        }

        setSelectedItem (selectedItem) {
            let menuItem = _.findWhere(this.state.menuItems, { id: selectedItem });

            if (menuItem) {
                menuItem.selected = true;
                this.setState();
            }
        }

        setReturnNavigation (returnText) {
            this.state.returnText = returnText;
            this.state.iconState = STATE_CONSTANT.ICON_STATE.BACK;
            this.setState();
        }

        resetReturnNavigation () {
            this.state.returnText = "";
            this.state.iconState = STATE_CONSTANT.ICON_STATE.HAMBURGER;
            this.setState();
        }

        setTitlePanelTransparency (transparency) {
            this.state.titlePanelState = transparency;
            this.setState();
        }

        open () {
            this.state.menuState = STATE_CONSTANT.MENU_STATE.EXPANDED;
            $(ReactDOM.findDOMNode(this)).find('.menu-items').removeClass('closed').on('animationened webkitAnimationEnd', function(){
                $(this).addClass('open');
                $(this).removeClass('expanded');
                $(this).off('animationened webkitAnimationEnd');
            });
            this.state.iconState = STATE_CONSTANT.ICON_STATE.CLOSE + " spin";
            $(ReactDOM.findDOMNode(this)).find('.hamburger-menu .icon').on('animationened webkitAnimationEnd', function(){
                $(this).removeClass('spin');
                $(this).off('animationened webkitAnimationEnd');
            });
            this.setState();
        }

        close () {
            this.state.menuState = STATE_CONSTANT.MENU_STATE.COLLAPSED;
            $(ReactDOM.findDOMNode(this)).find('.menu-items').removeClass('open').on('animationened webkitAnimationEnd', function(){
                $(this).addClass('closed');
                $(this).removeClass('collapsed');
                $(this).off('animationened webkitAnimationEnd');
            });
            this.state.iconState = STATE_CONSTANT.ICON_STATE.HAMBURGER + " spin";
            $(ReactDOM.findDOMNode(this)).find('.hamburger-menu .icon').on('animationened webkitAnimationEnd', function(){
                $(this).removeClass('spin');
                $(this).off('animationened webkitAnimationEnd');
            });
            this.setState();
        }

        render() {
            return (
                <div className="hamburger-menu">
                    <div className="icon-hit-box"/>
                    <div className={"icon " + this.state.iconState}/>
                    <div className={"title-panel " + this.state.titlePanelState}>
                        <div className={"return-text " + this.state.iconState}>{this.state.returnText}</div>
                        <div className="title">{this.state.title}</div>
                    </div>
                    <div className={"menu-items " + this.state.menuState}>
                        <div className="logo"/>
                        {
                            this.state.menuItems.map(function(menuItem){
                                return <div
                                    id={menuItem.id}
                                    className={menuItem.selected ? "menu-item selected" : "menu-item"}>
                                        <img
                                            name={menuItem.id}
                                            src={menuItem.icon}
                                            style={{
                                                top: "calc((100% - " + menuItem.dimensions[1] + "px)/2)"
                                            }}
                                        />
                                </div>
                            })
                        }
                    </div>
                </div>
            );
        }

        toggleHamburgerMenuState () {
            if (this.state.menuState === STATE_CONSTANT.MENU_STATE.EXPANDED) {
                this.close();
            } else {
                this.open();
            }
        }

        resetViewToTarget (target) {
            const targetMenuItem = _.find(this.state.menuItems, function(menuItem){
                return menuItem.id === target;
            });
            const targetId = targetMenuItem ? targetMenuItem.target : "";

            this.router.resetToViewId(targetId);
        }

        componentDidMount() {
            this.hammerHamburgerMenuIcon = Hammer($(ReactDOM.findDOMNode(this)).find('.icon-hit-box')[0]);
            this.hammerHamburgerMenuIcon.on('tap', function () {
                if (this.state.iconState === STATE_CONSTANT.ICON_STATE.BACK) {
                    this.router.popView();
                } else {
                    this.toggleHamburgerMenuState.call(this);
                }
            }.bind(this));

            this.hammerLogo = Hammer($(ReactDOM.findDOMNode(this)).find('.logo')[0]);
            this.hammerLogo.on('tap', function(){
                this.router.resetToViewId();
            }.bind(this));

            this.hammerBack = Hammer($(ReactDOM.findDOMNode(this)).find('.return-text')[0]);
            this.hammerBack.on('tap', function(){
                this.router.popView();
            }.bind(this));

            this.hammerMenuItems = [];
            let $menuItems = $(ReactDOM.findDOMNode(this)).find('.menu-item');
            $.each($menuItems, function(index, menuItem){
                this.hammerMenuItems.push(Hammer(menuItem));
                this.hammerMenuItems[this.hammerMenuItems.length - 1].on('tap press', function(event){
                    let $el = event.target instanceof HTMLImageElement ? $(event.target).parent() : $(event.target);

                    if (!$el.hasClass('selected')) {
                        _.each(this.state.menuItems, function(item){
                            item.selected = false;
                        });
                    }

                    this.resetViewToTarget($el[0].id);
                }.bind(this));
            }.bind(this));
        }

        componentWillUnmount() {
            this.hammerHamburgerMenuIcon.off('tap');
            this.hammerLogo.off('tap');
            this.hammerBack.off('tap');
            _.each(this.hammerMenuItems, function (hammerMenuItem) {
                hammerMenuItem.off('tap press');
            });
        }
    }

    return HamburgerMenu;
});