// wenWidget.js
define([
	'jquery',
	'underscore',
	'backbone'
], function($, _, Backbone){
	
	function WebWidget ( URL, token ) {
		this.init = function() {
			socket = io("http://localhost:3000/");
	  				// send the token to server so server will be aware of that and accept pairing devices
	   		socket.emit("init", token);
	   }

	}

	return WebWidget;


});