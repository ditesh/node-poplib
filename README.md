# node-poplib

node-poplib offers an MIT-licensed client library for the POP3 protocol. It is currently RFC1939 compliant and offers the following capabilities:

* USER, PASS, APOP
* LIST, TOP, RETR, DELE
* UIDL, NOOP, CAPA
* RSET, QUIT
* Plaintext and TLS support

## Installation

You have two installation options:

0. Via npm: `npm install poplib`

1. Download the source and install it yourself

## Usage

node-poplib is event based. It is best to illustrate via examples:

Here we initialize the client (for plain text transmission):

````javascript
var POP3Client = require("node-poplib");
var client = new POP3Client(port, host, tls);
````

If the tls parameter is true, the library will use a TLS connection. Note that you will have to set the correct port (generally 995).

Next, we trap several common states:

````javascript
client.on("error", function(err) {

        if (err.errno === 111) console.log("Unable to connect to server");
        else console.log("Server error occurred");

        console.log(err);

});

client.on("connect", function() {

        console.log("CONNECT success");
        client.auth(username, password);

});

client.on("invalid-state", function(cmd) {
        console.log("Invalid state. You tried calling " + cmd);
});

client.on("locked", function(cmd) {
        console.log("Current command has not finished yet. You tried calling " + cmd);
});
````

The error event is emitted when there is a network error. The Node.js error object is passed back to user-code.

The connect event is emitted when the connection to the remote server is successful.

The invalid-state event is emitted when you try to carry out an action not allowed within your current state (eg, attempting to RETR-ieve a message when authentication has not been completed).

The locked event is emitted when you try to execute another command while the current command has not finished executing successfully (eg, attempting to RETR-ieve a message while the remote server has not finished sending LIST data).

On a successful connect, we try authenticating:

````javascript
client.on("connect", function() {

        console.log("CONNECT success");
        client.auth(username, password);

});
````

Note that on successful auth, we try listing. For all events, the first received argument is always a boolean indicating whether the command succeeded. The last received argument is always the raw unparsed data received from the remote server. The intermediate arguments contain parsed data.

````javascript
client.on("auth", function(status, rawdata) {

	if (status) {

		console.log("LOGIN/PASS success");
		client.list();

	} else {

		console.log("LOGIN/PASS failed");
		client.quit();

	}
});

// Data is a 1-based index of messages, if there are any messages
client.on("list", function(status, msgcount, msgnumber, data, rawdata) {

	if (status === false) {

		console.log("LIST failed");
		client.quit();

	} else {

		console.log("LIST success with " + msgcount + " element(s)");

		if (msgcount > 0)
			client.retr(1);
		else
			client.quit();

	}
});

client.on("retr", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("RETR success for msgnumber " + msgnumber);
		client.dele(msgnumber);
		client.quit();

	} else {

		console.log("RETR failed for msgnumber " + msgnumber);
		client.quit();

	}
});

client.on("dele", function(status, msgnumber, data, rawdata) {

	if (status === true) {

		console.log("DELE success for msgnumber " + msgnumber);
		client.quit();

	} else {

		console.log("DELE failed for msgnumber " + msgnumber);
		client.quit();

	}
});

client.on("quit", function(status, rawdata) {

	if (status === true) console.log("QUIT success");
	else console.log("QUIT failed");

});

````

See tests and demos for more examples.

## Tests & Demos

For test purposes, you can use the following sendmail.sh script to pump email into your SMTP server for retrieval via POP3:

````bash
./sendmail.sh 10 "user@example.com" "this is my subject" "this is my body"
````

There is a full-featured POP3 client example in `tests/demo.js`.

There is also a simple example of downloading all emails in a POP3 server and saving it locally in an mbox formatted file in `tests/retrieve-all.js`.

There is a TLS example in `tests/tls.js`.

If you want to try APOP support, see `tests/apop.js`.
