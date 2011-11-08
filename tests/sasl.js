/*

	Node.js POP3 client test file

	Copyright (C) 2011 by Ditesh Shashikant Gathani <ditesh@gathani.org>

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

var POP3Client = require("../main.js");
var     argv = require('optimist')
                .usage("Usage: $0 --host [host] --port [port] --username [username] --password [password] --debug [on/off] --networkdebug [on/off] --auth [plain/cram-md5] --tls [on/off] --download [on/off]")
                .demand(['username', 'password', 'auth'])
		.describe('auth', 'Valid AUTH types: plain, cram-md5')
                .argv;

var host = argv.host || "localhost";
var port = argv.port || 110;
var debug = argv.debug === "on" ? true : false;
var tls = argv.tls === "on" ? true : false;
var auth = argv.auth;
var download = argv.download === "on" ? true : false;

var username = argv.username;
var password = argv.password;
var totalmsgcount = 0;
var currentmsg = 0;

// We carefully ignore self signed cert errors (bad practice!)
var client = new POP3Client(port, host, {

		enabletls: tls,
		ignoretlserrs: true,
		debug: (argv.networkdebug === "on" ? true: false)

	});

client.on("tls-error", function(err) {

	console.log("TLS error occurred, failed");
	console.log(err);

});

client.on("close", function() {
	console.log("close event unexpectedly received, failed");
});

client.on("error", function(err) {
	console.log("Server error occurred, failed, " + err);
});

client.on("connect", function(status, rawdata) {

        if (status) {

		console.log("CONNECT success");
		client.auth(auth, username, password);

        } else {

		console.log("CONNECT failed because " + rawdata);
                return;

        }
});

client.on("invalid-state", function(cmd) {
	console.log("Invalid state. You tried calling " + cmd);
	client.quit();
});

client.on("locked", function(cmd) {
	console.log("Current command has not finished yet. You tried calling " + cmd);
	client.quit();
});

client.on("auth", function(status, errmsg, rawdata) {

	if (status) {

		console.log("AUTH success");
		if (download) client.list();
		else client.quit();

	} else {

		console.log("AUTH failed (" + errmsg + ")");
		client.quit();

	}

});

client.on("list", function(status, msgcount, msgnumber, data, rawdata) {

	if (status === false) {

		console.log("LIST failed");
		client.quit();

	} else if (msgcount > 0) {

		totalmsgcount = msgcount;
		currentmsg = 1;
		console.log("LIST success with " + msgcount + " message(s)");
		client.retr(1);

	} else {

		console.log("LIST success with 0 message(s)");
		client.quit();

	}
});

client.on("retr", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("RETR success " + msgnumber + " with data " + data);
		client.dele(msgnumber);

	} else {

		console.log("RETR failed for msgnumber " + msgnumber + " because " + rawdata);
		client.quit();

	}
});

client.on("dele", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("DELE success for msgnumber " + msgnumber);

		if (currentmsg < totalmsgcount) {

			currentmsg += 1;
			client.retr(currentmsg);

		} else  client.quit();

	} else {

		console.log("DELE failed for msgnumber " + msgnumber);
		client.quit();

	}
});


client.on("quit", function(status, rawdata) {

	client.removeAllListeners("close");
	if (status === true) console.log("QUIT success");
	else console.log("QUIT failed");

});
