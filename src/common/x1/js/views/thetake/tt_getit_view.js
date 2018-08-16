/**
 * Created by Diana Fisher on 5/30/15.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'platform/views/interactiveComp',
    'text!platformTemplate/templates/thetake/TTGetItView.html'
], function($, _, Backbone, InteractiveComp, template){

    var TTGetItView = InteractiveComp.View.extend({

        className: 'tt_get_it_view',

        initialize: function(options) {

//            console.log(options);
            this.headers = options.headers;
            this.phoneNumber = '';
            this.data = options;
            this.showMoreInfo = options.showMoreInfo;

            InteractiveComp.View.prototype.initialize.call(this);

            var self = this;
            setTimeout(function() {
                self.listenTo(self.fm, "enterPressed", self.onEnterPressed);
            }, 0);

            this.listenTo(this.fm, 'backPressed', this.onClose);
        },

        render: function() {

            var self = this;

            $(self.el).html(_.template( template, this.data.model ));

            self.delegateEvents();
            self.initFocusManager();

            self.fm.initFocus('2,0', true, true, true, true);

            return this;
        },

        // handle keystrokes from widget or keyboard
        onKeyDown: function(keyCode) {
            if(keyCode == 8)
                this.onKeyTyped({charValue: '\b'});
        },

        onKeyPress: function(keyCode) {
            if(keyCode != 13)
                this.onKeyTyped({charValue: String.fromCharCode(keyCode)});
        },

        onEnterPressed: function() {
            var active = $(this.fm.active);
            var ch = active.data('char-value') || active.text();
//            console.log('ch ' + ch);
            if (ch.indexOf('SEND') >= 0) return;
            if(ch === '\u232b') {
                // backspace
//                console.log('backspace');
                ch = '\b';
            } else if (ch === '\u23b5') {
                ch = ' ';
            } else if (ch === '\u23ce') {
                ch = '\n';
            } else if (ch === '\u21e7') {
                $('#share-keyboard1').toggleClass('shift');
                return;
            } else if (ch >= 'A' && ch <= 'Z' && $('#share-keyboard1').hasClass('shift')) {
                ch = ch.toLowerCase();
            }

//            this.trigger("keyTyped", {charValue: ch});
            this.onKeyTyped({charValue: ch});
        },

        onKeyTyped: function(options) {
//            console.log('typed ' + options.charValue);
            if (options.charValue.indexOf('SEND') >= 0) return;

            if(options.charValue == '\b') {
//                console.log('listen : backspace');
                this.phoneNumber = this.phoneNumber.substring(0, this.phoneNumber.length - 1);
//                console.log()
            } else {
                if (this.phoneNumber.length < 11) {
                    this.phoneNumber += options.charValue;
                }
            }
//            console.log(this.phoneNumber);
            this.updateTextField();
        },

        updateTextField: function() {
            var formatted = '';
            if (this.phoneNumber.charAt(0) == '1') {
                formatted = '1 (' + this.phoneNumber.substr(1, 3) + ') ' + this.phoneNumber.substr(4, 3) + '-' + this.phoneNumber.substr(7,4);
            } else {
                formatted = '(' + this.phoneNumber.substr(0, 3) + ') ' + this.phoneNumber.substr(3, 3) + '-' + this.phoneNumber.substr(6,4);
            }
//            console.log(formatted);
            if (this.phoneNumber.length == 0) {
                formatted = '';
            }
            $('.tt_typed').text(formatted);  // find all elements with class 'typed' and set their text

        },

        onClose: function() {
            // Kill any existing timeout.
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.app.popView();
        },

        onSend: function() {
            // send text message to phone number supplied.
            // E.164 number formatting required
            var phoneNumber = this.phoneNumber;
            if (this.phoneNumber.length == 11) {
                // append just the plus sign
                phoneNumber = '+' + this.phoneNumber;
            } else {
                // otherwise, append both the 1 and the plus sign.
                phoneNumber = '+1' + this.phoneNumber;
            }
            var productId = this.data.model.productId;
//            console.log('send product id ' + productId);
            var self = this;
            $.ajax({
                url: 'https://jaredbrowarnik-thetake-v1.p.mashape.com/messages/sendText?number=' + phoneNumber + '&product=' + productId,
                type: 'POST',
                beforeSend: function (request)
                {
                    request.setRequestHeader("X-Mashape-Key", "zxuiCsa0SemshSHgCQUEbm709nd2p1976vkjsnIrqB4WOE2Pne");
                },
                data: '',
                success: function(data) {
//                    console.log('ajax post success');
                    console.log(data);
                },
                error:function(shr,status,data){
                    console.log("error " + data + " Status " + shr.status);
                },
                complete:function(){
//                    console.log("Ajax Complete");
                    // Disable send button.
                    $('.tt_send_button').attr("data-disabled", 'true');
                    // Hide text_me_container and and show message sent message.
                    $('.text_me_container').hide();

                    $('.text_results').show();

                    // Set the focus on the close button.
                    self.fm.initFocus('0,0', true, true, true);

                    // Auto-close after three seconds.
                    self.timer = setTimeout(function(){
                        self.onClose();
                        self.timer = undefined;
                    }, 3000);
                }
            });
        },

        onBackButtonPressed: null
    });

    return TTGetItView
});

/*
* curl -X POST --include 'https://jaredbrowarnik-thetake-v1.p.mashape.com/messages/sendText?number=<required>&product=<required>' \
 -H 'X-Mashape-Key: zxuiCsa0SemshSHgCQUEbm709nd2p1976vkjsnIrqB4WOE2Pne' \
 -H 'Content-Type: application/x-www-form-urlencoded' \
 -H 'Accept: application/json'
* */
