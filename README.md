# node-poplib

node-poplib offers an MIT-licensed client library for the POP3 protocol. It is currently provides the following capabilities:

* USER, PASS, APOP
* LIST, TOP, RETR, DELE
* UIDL, NOOP, CAPA
* RSET, QUIT
* Plaintext and encrypted TLS support
* STLS
* SASL PLAIN CRAM-MD5

It complies to:

* RFC 1939 (POP3)
* RFC 2595 (STLS);
* RFC 5034 (SASL AUTH)
* RFC 2195 (CRAM-MD5)

## Installation

You have two installation options:

0. Via npm: `npm install poplib`

1. Download the source and install it yourself

## Quick demo

Connect to GMail's POP3 servers using the provided demo script as follows:

````bash
$ node demos/demo.js --host pop.gmail.com --port 995 --username user@gmail.com --password potato --tls on --debug on --networkdebug on
Server: '+OK Gpop ready for requests from 1.2.3.4 bh7pf61475604pab.24\r\n'
CONNECT success
Client: 'USER user@gmail.com\r\n'
Server: '+OK send PASS\r\n'
Client: 'PASS potato\r\n'
Server: '-ERR [AUTH] Username and password not accepted.\r\n'
LOGIN/PASS failed
Client: 'QUIT\r\n'
Server: '+OK Farewell.\r\n'
QUIT success
````

## Detailed Usage

node-poplib is event based. It is best to illustrate via examples:

Here we initialize the client (for plain text transmission):

````javascript
var POP3Client = require("poplib");
var client = new POP3Client(port, host, {

		tlserrs: false,
		enabletls: true,
		debug: false

	});
````

The third parameter, `options`, takes three options. If `enabletls` is true, the library will use a TLS connection. Note that you will have to set the correct port (generally 995). If `tlserrs` is true, then TLS errors will be ignored. Finally, the `debug` parameter prints out requests and responses.

Next, we trap several common states:

````javascript
client.on("error", function(err) {

        if (err.errno === 111) console.log("Unable to connect to server");
        else console.log("Server error occurred");

        console.log(err);

});

client.on("connect", function() {

        console.log("CONNECT success");
        client.login(username, password);

});

client.on("invalid-state", function(cmd) {
        console.log("Invalid state. You tried calling " + cmd);
});

client.on("locked", function(cmd) {
        console.log("Current command has not finished yet. You tried calling " + cmd);
});
````

The `error` event is emitted when there is a network error. The underlying error object is passed back to user-code.

The `connect` event is emitted when the connection to the remote server is successful.

The `invalid-state` event is emitted when you try to carry out an action not allowed within your current state (eg, attempting to `RETR`-ieve a message when authentication has not been completed).

The `locked` event is emitted when you try to execute another command while the current command has not finished executing successfully (eg, attempting to `RETR`-ieve a message while the remote server has not finished sending `LIST` data).

On a successful connect, we try authenticating:

````javascript
client.on("connect", function() {

        console.log("CONNECT success");
        client.login(username, password);

});
````

Note that on successful login, we try listing. For all events, the first received argument is always a boolean indicating whether the command succeeded. The last received argument is always the raw unparsed data received from the remote server. The intermediate arguments contain parsed data.

````javascript
client.on("login", function(status, rawdata) {

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

## API

`login(username, password)`

Self explanatory. This executes `USER` and `PASS`. Do not use over cleartext channels. Preferably don't use it at all as `auth()` implements `AUTH` which deprecates the need for USER and PASS. Emits `login` event.

`apop(username, password)`

This executes `APOP`. Requires server side support. Preferably don't use it as `auth()` implements `AUTH` which deprecates the need for USER and PASS. Emits `apop` event.

`auth(type, username, password)`

This executes `AUTH`. Requires server side support. Currently only "PLAIN" and "CRAM-MD5" types are supported. Emits `auth` event.

`stls()`

This executes `STLS`. Requires server side support (check using `capa()` first). According to the RFC's, using `STLS` is preferable to a purely TLS connection (although some servers only support purely TLS connections). Emits `stls` event.

`capa()`

This executes `CAPA`. Requires server side support. Emits `capa` event.

`list([msgnumber])`

This executes `LIST`. If the optional `msgnumber` is provided, then `LIST msgnumber` is executed. Emits `list` event.

`top(msgnumber, lines)`

This executes `TOP`. Requires server side support. `msgnumber` and `lines` must be provided. TEmits `top` event.

`stat()`

This executes `STAT`. Emits `stat` event.

`uidl([msgnumber])`

This executes `UIDL`. If the optional `msgnumber` is provided, then `UIDL msgnumber` is executed. Emits `uidl` event.

`retr(msgnumber)`

This executes `RETR`. `msgnumber` must be provided. Emits `retr` event.

`dele(msgnumber)`

This executes `DELE`. `msgnumber` must be provided. Emits `dele` event.

`rset()`

This executes `RSET`. Emits `rset` event.

`noop()`

This executes `NOOP`. Emits `noop` event.

`quit()`

This executes `QUIT`. Emits `quit` event.


## Events 

`connect`

The `connect` event is emitted upon competion of connection attempt (initiated in the constructor). The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`login`

The `login` event is emitted upon competion of `login()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`apop`

The `apop` event is emitted upon competion of `apop()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`auth`

The `auth` event is emitted upon competion of `auth()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`stls`

The `stls` event is emitted upon competion of `stls()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`capa`

The `capa` event is emitted upon competion of `capa()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* data: if status is true, this is an array containing list of server capabilities
* rawdata: string containing success or error message from the server

`list`

The `list` event is emitted upon competion of `list()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
msgcount: this contains the number of messages return by the `list()` method. If a valid msgnumber was provided, this value will naturally be `1` (else `null`)
* msgnumber: if msgnumber was provided to the method, the provided value will be reflected here (else `undefined`)
* data: if status is true, this is an array containing list of server capabilities (else `null`)
* rawdata: string containing success or error message from the server

`top`

The `top` event is emitted upon competion of `top()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* msgnumber: if msgnumber was provided to the method, the provided value will be reflected here (else `undefined`)
* data: if status is true, this is an ASCII string containing the returnValue (else `null`)
* rawdata: string containing success or error message from the server

`stat`

The `stat` event is emitted upon competion of `stat()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* data: if status is true, an object with keys `count` and `octet` (else `null`)
* rawdata: string containing success or error message from the server

`uidl`

The `uidl` event is emitted upon competion of `uidl()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* msgnumber: if msgnumber was provided to the method, the provided value will be reflected here (else `undefined`)
* data: if status is true, this is an array containing the UIDL list (else `null`)
* rawdata: string containing success or error message from the server

`retr`

The `retr` event is emitted upon competion of `retr()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* msgnumber: the `msgnumber` provided to the method
* data: if status is `true`, the results are returned as an ASCII string (else `null`)
* rawdata: string containing success or error message from the server

`dele`

The `dele` event is emitted upon competion of the `dele()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* msgnumber: the `msgnumber` provided to the method
* rawdata: string containing success or error message from the server

`rset`

The `rset` event is emitted upon competion of the `rset()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`noop`

The `noop` event is emitted upon competion of the `noop()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* rawdata: string containing success or error message from the server

`quit`

The `quit` event is emitted upon competion of the `quit()` method. The arguments, in order, are:

* status: boolean true or false, indicating whether the execution was successful
* * rawdata: string containing success or error message from the server

`error`

The `error` event is emitted if there is an `error` event from the underlying socket. The original error object is passed as an argument.

`invalid-state`

The `invalid-state` event is emitted when an action not allowed within the current state s attmempted (eg, attempting to `RETR`-ieve a message when `AUTH`-entication has not been completed).

`locked`

The `locked` event is emitted when a method is called while existing execution has not finished executing (eg, attempting to `RETR`-ieve a message while the remote server has not finished sending `LIST` data).

## Tests & Demos

Tests are in `tests`. Demos are in `demos`.

There is a full-featured POP3 client example in `demos/demo.js`. There is also a simple example of downloading all emails in a POP3 server and saving it locally in an mbox formatted file in `demos/retrieve-all.js`.

For testing purposes, you can use the following sendmail.sh script to pump email into your SMTP server for retrieval via POP3:

````bash
./sendmail.sh 10 "user@example.com" "this is my subject" "this is my body"
````

You can execute the test-runner as follows:

````bash
./runner.sh username password pop3server pop3port pop3tlsport testemail@address.com
````
