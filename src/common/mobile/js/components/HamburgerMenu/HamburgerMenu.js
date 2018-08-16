'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(['reactDOM', 'jquery', 'underscore', 'react', 'hammer', 'common/mobile/js/components/HamburgerMenu/HAMBURGER_MENU_STATE_CONSTANTS'], function (ReactDOM, $, _, React, Hammer, STATE_CONSTANT) {
    var HamburgerMenu = function (_React$Component) {
        _inherits(HamburgerMenu, _React$Component);

        function HamburgerMenu(props) {
            _classCallCheck(this, HamburgerMenu);

            var _this = _possibleConstructorReturn(this, (HamburgerMenu.__proto__ || Object.getPrototypeOf(HamburgerMenu)).call(this, props));

            _this.router = props.router;
            _this.state = {
                menuItems: props.menuItems,
                iconState: "",
                titlePanelState: STATE_CONSTANT.TITLE_PANEL_STATE.TRANSPARENT,
                menuState: "",
                returnText: "",
                title: ""
            };
            return _this;
        }

        _createClass(HamburgerMenu, [{
            key: 'addToMenuItems',
            value: function addToMenuItems(item) {
                if (item instanceof Array) {
                    this.state.menuItems = this.state.menuItems.concat(item);
                } else {
                    this.state.menuItems.push(item);
                }

                this.setState();
            }
        }, {
            key: 'setTitle',
            value: function setTitle(title) {
                this.state.title = title;
                this.setState();
            }
        }, {
            key: 'setSelectedItem',
            value: function setSelectedItem(selectedItem) {
                var menuItem = _.findWhere(this.state.menuItems, { id: selectedItem });

                if (menuItem) {
                    menuItem.selected = true;
                    this.setState();
                }
            }
        }, {
            key: 'setReturnNavigation',
            value: function setReturnNavigation(returnText) {
                this.state.returnText = returnText;
                this.state.iconState = STATE_CONSTANT.ICON_STATE.BACK;
                this.setState();
            }
        }, {
            key: 'resetReturnNavigation',
            value: function resetReturnNavigation() {
                this.state.returnText = "";
                this.state.iconState = STATE_CONSTANT.ICON_STATE.HAMBURGER;
                this.setState();
            }
        }, {
            key: 'setTitlePanelTransparency',
            value: function setTitlePanelTransparency(transparency) {
                this.state.titlePanelState = transparency;
                this.setState();
            }
        }, {
            key: 'open',
            value: function open() {
                this.state.menuState = STATE_CONSTANT.MENU_STATE.EXPANDED;
                $(ReactDOM.findDOMNode(this)).find('.menu-items').removeClass('closed').on('animationened webkitAnimationEnd', function () {
                    $(this).addClass('open');
                    $(this).removeClass('expanded');
                    $(this).off('animationened webkitAnimationEnd');
                });
                this.state.iconState = STATE_CONSTANT.ICON_STATE.CLOSE + " spin";
                $(ReactDOM.findDOMNode(this)).find('.hamburger-menu .icon').on('animationened webkitAnimationEnd', function () {
                    $(this).removeClass('spin');
                    $(this).off('animationened webkitAnimationEnd');
                });
                this.setState();
            }
        }, {
            key: 'close',
            value: function close() {
                this.state.menuState = STATE_CONSTANT.MENU_STATE.COLLAPSED;
                $(ReactDOM.findDOMNode(this)).find('.menu-items').removeClass('open').on('animationened webkitAnimationEnd', function () {
                    $(this).addClass('closed');
                    $(this).removeClass('collapsed');
                    $(this).off('animationened webkitAnimationEnd');
                });
                this.state.iconState = STATE_CONSTANT.ICON_STATE.HAMBURGER + " spin";
                $(ReactDOM.findDOMNode(this)).find('.hamburger-menu .icon').on('animationened webkitAnimationEnd', function () {
                    $(this).removeClass('spin');
                    $(this).off('animationened webkitAnimationEnd');
                });
                this.setState();
            }
        }, {
            key: 'render',
            value: function render() {
                return React.createElement(
                    'div',
                    { className: 'hamburger-menu' },
                    React.createElement('div', { className: 'icon-hit-box' }),
                    React.createElement('div', { className: "icon " + this.state.iconState }),
                    React.createElement(
                        'div',
                        { className: "title-panel " + this.state.titlePanelState },
                        React.createElement(
                            'div',
                            { className: "return-text " + this.state.iconState },
                            this.state.returnText
                        ),
                        React.createElement(
                            'div',
                            { className: 'title' },
                            this.state.title
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: "menu-items " + this.state.menuState },
                        React.createElement('div', { className: 'logo' }),
                        this.state.menuItems.map(function (menuItem) {
                            return React.createElement(
                                'div',
                                {
                                    id: menuItem.id,
                                    className: menuItem.selected ? "menu-item selected" : "menu-item" },
                                React.createElement('img', {
                                    name: menuItem.id,
                                    src: menuItem.icon,
                                    style: {
                                        top: "calc((100% - " + menuItem.dimensions[1] + "px)/2)"
                                    }
                                })
                            );
                        })
                    )
                );
            }
        }, {
            key: 'toggleHamburgerMenuState',
            value: function toggleHamburgerMenuState() {
                if (this.state.menuState === STATE_CONSTANT.MENU_STATE.EXPANDED) {
                    this.close();
                } else {
                    this.open();
                }
            }
        }, {
            key: 'resetViewToTarget',
            value: function resetViewToTarget(target) {
                var targetMenuItem = _.find(this.state.menuItems, function (menuItem) {
                    return menuItem.id === target;
                });
                var targetId = targetMenuItem ? targetMenuItem.target : "";

                this.router.resetToViewId(targetId);
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                this.hammerHamburgerMenuIcon = Hammer($(ReactDOM.findDOMNode(this)).find('.icon-hit-box')[0]);
                this.hammerHamburgerMenuIcon.on('tap', function () {
                    if (this.state.iconState === STATE_CONSTANT.ICON_STATE.BACK) {
                        this.router.popView();
                    } else {
                        this.toggleHamburgerMenuState.call(this);
                    }
                }.bind(this));

                this.hammerLogo = Hammer($(ReactDOM.findDOMNode(this)).find('.logo')[0]);
                this.hammerLogo.on('tap', function () {
                    this.router.resetToViewId();
                }.bind(this));

                this.hammerBack = Hammer($(ReactDOM.findDOMNode(this)).find('.return-text')[0]);
                this.hammerBack.on('tap', function () {
                    this.router.popView();
                }.bind(this));

                this.hammerMenuItems = [];
                var $menuItems = $(ReactDOM.findDOMNode(this)).find('.menu-item');
                $.each($menuItems, function (index, menuItem) {
                    this.hammerMenuItems.push(Hammer(menuItem));
                    this.hammerMenuItems[this.hammerMenuItems.length - 1].on('tap press', function (event) {
                        var $el = event.target instanceof HTMLImageElement ? $(event.target).parent() : $(event.target);

                        if (!$el.hasClass('selected')) {
                            _.each(this.state.menuItems, function (item) {
                                item.selected = false;
                            });
                        }

                        this.resetViewToTarget($el[0].id);
                    }.bind(this));
                }.bind(this));
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                this.hammerHamburgerMenuIcon.off('tap');
                this.hammerLogo.off('tap');
                this.hammerBack.off('tap');
                _.each(this.hammerMenuItems, function (hammerMenuItem) {
                    hammerMenuItem.off('tap press');
                });
            }
        }]);

        return HamburgerMenu;
    }(React.Component);

    return HamburgerMenu;
});
