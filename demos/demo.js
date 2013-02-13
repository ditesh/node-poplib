/*

	Node.js POP3 client demo

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

var util = require("util");
var POP3Client = require("../main.js");
var     argv = require('optimist')
                .usage("Usage: $0 --host [host] --port [port] --username [username] --password [password] --tls [on/off] --debug [on/off] --networkdebug [on/off] --msgnumber [number]")
                .demand(['username', 'password'])
                .argv;

var host = argv.host || "localhost";
var port = argv.port || 110;
var debug = argv.debug === "on" ? true : false;
var enabletls = argv.tls === "on" ? true : false;
var msgnumber = argv.msgnumber;
var username = argv.username;
var password = argv.password;

var client = new POP3Client(port, host, {
        debug: debug,
        enabletls: enabletls
    });

client.on("error", function(err) {

	if (err.errno === 111) console.log("Unable to connect to server");
	else console.log("Server error occurred");

	console.log(err);

});

client.on("connect", function(rawdata) {

	console.log("CONNECT success");
	client.login(username, password);

});

client.on("invalid-state", function(cmd) {
	console.log("Invalid state. You tried calling " + cmd);
});

client.on("locked", function(cmd) {
	console.log("Current command has not finished yet. You tried calling " + cmd);
});

client.on("login", function(status, rawdata) {

	if (status) {

		console.log("LOGIN/PASS success");
		client.capa();

	} else {

		console.log("LOGIN/PASS failed");
		client.quit();

	}

});

client.on("capa", function(status, data, rawdata) {

	if (status) {

		console.log("CAPA success");
		if (debug) console.log("Parsed data: " + util.inspect(data));
		client.noop();

	} else {

		console.log("CAPA failed");
		client.quit();

	}

});


client.on("noop", function(status, rawdata) {

	if (status) {

		console.log("NOOP success");
		client.stat();

	} else {

		console.log("NOOP failed");
		client.quit();

	}

});


client.on("stat", function(status, data, rawdata) {

	if (status === true) {

		console.log("STAT success");
		if (debug) console.log("Parsed data: " + util.inspect(data));
		client.list();

	} else {

		console.log("STAT failed");
		client.quit();

	}
});

client.on("list", function(status, msgcount, msgnumber, data, rawdata) {

	if (status === false) {

		if (msgnumber !== undefined) console.log("LIST failed for msgnumber " + msgnumber);
		else console.log("LIST failed");

		client.quit();

	} else if (msgcount === 0) {

		console.log("LIST success with 0 elements");
		client.quit();

	} else {

		console.log("LIST success with " + msgcount + " element(s)");
		client.uidl();

	}
});

client.on("uidl", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("UIDL success");
		if (debug) console.log("Parsed data: " + data);
		client.top(123123, 10);

	} else {

		console.log("UIDL failed for msgnumber " + msgnumber);
		client.quit();

	}
});


client.on("top", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("TOP success for msgnumber " + msgnumber);
		if (debug) console.log("Parsed data: " + data);
		client.retr(msgnumber);

	} else {

		console.log("TOP failed for msgnumber " + msgnumber);
		client.quit();

	}
});

client.on("retr", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("RETR success for msgnumber " + msgnumber);
		if (debug) console.log("Parsed data: " + data);

        if (msgnumber !== undefined) client.dele(msgnumber);
        else client.quit();

	} else {

		console.log("RETR failed for msgnumber " + msgnumber);
		client.quit();

	}
});

client.on("dele", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("DELE success for msgnumber " + msgnumber);
		client.rset();

	} else {

		console.log("DELE failed for msgnumber " + msgnumber);
		client.quit();

	}
});

client.on("rset", function(status, rawdata) {

	if (status === true) console.log("RSET success");
	else console.log("RSET failed");

	client.quit();

});

client.on("quit", function(status, rawdata) {

	if (status === true) console.log("QUIT success");
	else console.log("QUIT failed");

});
