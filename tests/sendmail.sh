#!/bin/bash

#	Email pumper helper script
#
#	Copyright (C) 2011 by Ditesh Shashikant Gathani <ditesh@gathani.org>
#
#	Permission is hereby granted, free of charge, to any person obtaining a copy
#	of this software and associated documentation files (the "Software"), to deal
#	in the Software without restriction, including without limitation the rights
#	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#	copies of the Software, and to permit persons to whom the Software is
#	furnished to do so, subject to the following conditions:
#
#	The above copyright notice and this permission notice shall be included in
#	all copies or substantial portions of the Software.
#
#	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#	THE SOFTWARE.

echo "sendmail.sh v0.1 - a utility to pump email into an SMTP server"
echo "Copyright (c) 2011 Ditesh Shashikant Gathani <ditesh@gathani.org>"
echo

if [ $# -ne 4 ]; then

	echo "Usage:"
	echo "	sendmail.sh <number of emails> <to> <subject> <body>"
	exit 1

fi

echo "Sending $1 email(s)"
echo "	to: 		$2"
echo "	subject: 	\"$3\""
echo "	body: 		\"$4\""
echo

for i in `seq 1 $1`; do
	echo -n "."
	echo "$4" | mail -s "$3" "$2";
done

echo " done."
echo
