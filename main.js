/*

	Node.js POP3 client library

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

var 	net = require("net"),
	tls = require("tls"),
	util = require("util"),
	events = require("events"),
	hashlib = require("hashlib");

// Constructor
function POP3Client(port, host, enabletls, debug) {

	// Set up EventEmitter constructor function
	events.EventEmitter.call(this);

	// Closure variables for socket.on("data")
	var self = this;
	var response = null;
	var checkResp = true;
	var bufferedData = "";

	// Variables for the object
	self.state = 0,
	self.locked = false,
	self.multiline = false,
	self.data = {

		apop: false,
		banner: "",
		username: "",
		host: host,
		port: port,
		tls: enabletls

	},
	self.callback = function(resp, data) {

		if (resp === false) {

			self.locked = false;
			self.callback = function() {};
			self.emit("connect-failure", data);

		} else {

			// Checking for APOP support
			var banner = data.trim();
			var bannerComponents = banner.split(" ");

			for(var i=0; i < bannerComponents.length; i++) {

				if (bannerComponents[i].indexOf("@") > 0) {

					self.data["apop"] = true;
					self.data["apop-timestamp"] = bannerComponents[i];
					break;

				}
			}

			self.state = 1;
			self.data["banner"] = banner;
			self.emit("connect", data);

		}
	};

	// Remote end socket

	if (enabletls === true) {

		self.conn = tls.connect(port, host, function() {

			if (self.conn.authorized === false)
				self.emit("tls-error", self.conn.authorizationError);

		});

		self.socket = self.conn;

	} else {

		self.socket = new net.createConnection(port, host);

	}

	self.socket.on("data", function(data) {

		data = data.toString("ascii");
		bufferedData += data;

		if (debug) util.log(data);

		if (checkResp === true && bufferedData.substr(0, 3) === "+OK") {

			checkResp = false;
			response = true;

		} else if (checkResp === true && bufferedData.substr(0, 4) === "-ERR") {

			checkResp = false;
			response = false;

		}

		if (checkResp === false) {

			if (self.multiline === true && bufferedData.substr(bufferedData.length-5) === "\r\n.\r\n") {

				checkResp = true;
				self.callback(response, String(bufferedData));
				self.multiline = false;
				bufferedData = "";
				response = null;

			} else if (self.multiline === false) {

				checkResp = true;
				self.callback(response, bufferedData);
				self.multiline = false;
				bufferedData = "";
				response = null;

			}
		} 
	});

	self.socket.on("error", function(err) {
		self.emit("error", err);
	});

	self.socket.on("end", function(data) {

		self.state = 0;
		self.socket = null;

	});

	// Private helper methods
	// Writes to remote server socket
	self.write = function(command, argument) {

		var text = command;

		if (argument !== undefined)
			text = text + " " + argument + "\r\n";
		else
			text = text + "\r\n";

		if (debug) util.log(text);

		self.socket.write(text);

	};
}

util.inherits(POP3Client, events.EventEmitter);

POP3Client.prototype.connect = function(port, host) {

	// XXX

};

POP3Client.prototype.auth = function (username, password) {

	var self = this;

	if (self.state !== 1) self.emit("invalid-state", "auth");
	else if (self.locked === true) self.emit("locked", "auth");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			if (resp === false) {

				self.locked = false;
				self.callback = function() {};
				self.emit("auth", false, data);

			} else {

				self.callback = function(resp, data) {

					self.locked = false;
					self.callback = function() {};

					if (resp !== false)
						self.state = 2;

					self.emit("auth", resp, data);

				};

				self.multiline = false;
				self.write("PASS", password);

			}
		};

		self.multiline = false;
		self.write("USER", username);

	}
};

POP3Client.prototype.apop = function (username, password) {

	var self = this;

	if (self.state !== 1) self.emit("invalid-state", "apop");
	else if (self.locked === true) self.emit("locked", "apop");
	else if (self.data["apop"] === false) self.emit("apop", false, "APOP support not detected on remote server");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			self.locked = false;
			self.callback = function() {};

			if (resp === true)
				self.state = 2;

			self.emit("apop", resp, data);

		};

		self.multiline = false;
		self.write("APOP", username + " " + hashlib.md5(self.data["apop-timestamp"] + password));

	}
};

POP3Client.prototype.top = function(msgnumber, lines) {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "top");
	else if (self.locked === true) self.emit("locked", "top");
	else {

		self.callback = function(resp, data) {

			var returnValue = null;
			self.locked = false;
			self.callback = function() {};

			if (resp !== false) {

				returnValue = "";
				var startOffset = data.indexOf("\r\n", 0) + 2;
				var endOffset = data.indexOf("\r\n.\r\n", 0) + 2;

				if (endOffset > startOffset)
					returnValue = data.substr(startOffset, endOffset-startOffset);

			}

			self.emit("top", resp, msgnumber, returnValue, data);

		}

		self.multiline = true;
		self.write("TOP", msgnumber + " " + lines);

	}
};

POP3Client.prototype.list = function(msgnumber) {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "list");
	else if (self.locked === true) self.emit("locked", "list");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			var returnValue = null;
			var msgcount = 0;
			self.locked = false;
			self.callback = function() {};

			if (resp !== false) {

				returnValue = [];

				if (msgnumber !== undefined) {

					msgcount = 1
					listitem = data.split(" ");
					returnValue[listitem[1]] = listitem[2];

				} else {

					var offset = 0;
					var listitem = "";
					var newoffset = 0;
					var returnValue = [];
					var startOffset = data.indexOf("\r\n", 0) + 2;
					var endOffset = data.indexOf("\r\n.\r\n", 0) + 2;

					if (endOffset > startOffset) {

						data = data.substr(startOffset, endOffset-startOffset);

						while(true) {

							if (offset > endOffset)
								break;

							newoffset = data.indexOf("\r\n", offset);

							if (newoffset < 0)
								break;

							msgcount++;
							listitem = data.substr(offset, newoffset-offset);
							listitem = listitem.split(" ");
							returnValue[listitem[0]] = listitem[1];
							offset = newoffset + 2;

						}
					}
				}
			}

			self.emit("list", resp, msgcount, msgnumber, returnValue, data);

		}

		if (msgnumber !== undefined) self.multiline = false;
		else self.multiline = true;

		self.write("LIST", msgnumber);

	}
};

POP3Client.prototype.stat = function() {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "stat");
	else if (self.locked === true) self.emit("locked", "stat");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			var returnValue = null;
			self.locked = false;
			self.callback = function() {};

			if (resp !== false) {

				listitem = data.split(" ");
				returnValue = {

					"count": listitem[1].trim(),
					"octets": listitem[2].trim(),

				};
			}

			self.emit("stat", resp, returnValue, data);

		}

		self.multiline = false;
		self.write("STAT", undefined);

	}
};

POP3Client.prototype.uidl = function(msgnumber) {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "uidl");
	else if (self.locked === true) self.emit("locked", "uidl");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			var returnValue = null;
			self.locked = false;
			self.callback = function() {};

			if (resp !== false) {

				returnValue = [];

				if (msgnumber !== undefined) {

					listitem = data.split(" ");
					returnValue[listitem[1]] = listitem[2].trim();

				} else {

					var offset = 0;
					var listitem = "";
					var newoffset = 0;
					var returnValue = [];
					var startOffset = data.indexOf("\r\n", 0) + 2;
					var endOffset = data.indexOf("\r\n.\r\n", 0) + 2;

					if (endOffset > startOffset) {

						data = data.substr(startOffset, endOffset-startOffset);

						while(true) {

							if (offset > endOffset)
								break;

							newoffset = data.indexOf("\r\n", offset);
							listitem = data.substr(offset, newoffset-offset);
							listitem = listitem.split(" ");
							returnValue[listitem[0]] = listitem[1];
							offset = newoffset + 2;

						}
					}
				}
			}

			self.emit("uidl", resp, msgnumber, returnValue, data);

		}

		if (msgnumber !== undefined) self.multiline = false;
		else self.multiline = true;

		self.write("UIDL", msgnumber);

	}
};

POP3Client.prototype.retr = function(msgnumber) {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "retr");
	else if (self.locked === true) self.emit("locked", "retr");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			var returnValue = null;
			self.locked = false;
			self.callback = function() {};

			if (resp !== false) {

				var startOffset = data.indexOf("\r\n", 0) + 2;
				var endOffset = data.indexOf("\r\n.\r\n", 0);
				returnValue = data.substr(startOffset, endOffset-startOffset);

			}

			self.emit("retr", resp, msgnumber, returnValue, data);

		}

		self.multiline = true;
		self.write("RETR", msgnumber);

	}
};

POP3Client.prototype.dele = function(msgnumber) {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "dele");
	else if (self.locked === true) self.emit("locked", "dele");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			self.locked = false;
			self.callback = function() {};
			self.emit("dele", resp, msgnumber, data);

		}

		self.multiline = false;
		self.write("DELE", msgnumber);

	}
};

POP3Client.prototype.noop = function() {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "noop");
	else if (self.locked === true) self.emit("locked", "noop");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			self.locked = false;
			self.callback = function() {};
			self.emit("noop", resp, data);

		}

		self.multiline = false;
		self.write("NOOP", undefined);

	}
};

POP3Client.prototype.rset = function() {

	var self = this;

	if (self.state !== 2) self.emit("invalid-state", "rset");
	else if (self.locked === true) self.emit("locked", "rset");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			self.locked = false;
			self.callback = function() {};
			self.emit("rset", resp, data);

		}

		self.multiline = false;
		self.write("RSET", undefined);

	}
};

POP3Client.prototype.capa = function() {

	var self = this;

	if (self.locked === true) self.emit("locked", "capa");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			var returnValue = null;
			self.locked = false;
			self.callback = function() {};

			if (resp === true) {

				var startOffset = data.indexOf("\r\n", 0) + 2;
				var endOffset = data.indexOf("\r\n.\r\n", 0);
				returnValue = data.substr(startOffset, endOffset-startOffset);
				returnValue = returnValue.split("\r\n");

			}

			self.emit("capa", resp, returnValue, data);

		}

		self.multiline = true;
		self.write("CAPA", undefined);

	}
};

POP3Client.prototype.quit = function() {

	var self = this;

	if (self.state === 0) self.emit("invalid-state", "quit");
	else if (self.locked === true) self.emit("locked", "quit");
	else {

		self.locked = true;
		self.callback = function(resp, data) {

			self.locked = false;
			self.callback = function() {};

			self.socket.end();
			self.emit("quit", resp, data);

		}

		self.multiline = false;
		self.write("QUIT", undefined);

	}
};

module.exports = POP3Client;
