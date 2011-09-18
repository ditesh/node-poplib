#!/bin/sh
#	Test script
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

print_title "apop.js"
RANDOMID=$RANDOM

print_test "Sending test message (str: $RANDOMID)"
OUTPUT=`./sendmail.sh 1 $EMAIL "subject with $RANDOMID" "body with $RANDOMID"`
print_result 0 $OUTPUT

print_test "Correct auth"
OUTPUT=`node apop.js --username $USER --password $PASS --host $HOST --port $PORT --login on`;
print_result 0 $OUTPUT

print_test "Invalid auth"
OUTPUT=`node apop.js --username $USER --password ${PASS}a --host $HOST --port $PORT --login on`;
print_result 1 $OUTPUT

print_test "Login and message download"
OUTPUT=`node apop.js --username $USER --password $PASS --host $HOST --port $PORT --login on --download on`
OUTPUT=`echo $OUTPUT | grep $RANDOMID`

if [ $? -eq 1 ]; then OUTPUT="fail"; fi

print_result 0 $OUTPUT
