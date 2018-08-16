// NativeBridge.js
define([], function(){
    return {
        callNative: function (message) {
            console.log('Called NativeBridge with message ' + message);

            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.microHTMLMessageHandler) {
                window.webkit.messageHandlers.microHTMLMessageHandler.postMessage(message);
            } else if (window.microHTMLInterface) {
                window.microHTMLInterface.postMessage(message);
            }
        },
        AppVisible: function () {
            this.callNative('AppVisible');
        },
        AppShutdown: function () {
            this.callNative('AppShutdown');
        }
    };
});