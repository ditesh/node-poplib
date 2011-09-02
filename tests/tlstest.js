var fs = require("fs");
var tls = require("tls");

var conn = tls.connect(995, "pop.gmail.com", function() {

		console.log("in callback", conn.authorized, conn.authorizationError);

	});

conn.on("data", function(data) {

	console.log(conn.authorized, conn.authorizationError);

	if (conn.authorized)
		console.log(data.toString());

});

conn.on("error", function(err) {

	console.log(err);

});
