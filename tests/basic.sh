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

print_title "basic.js"
RANDOMID=$RANDOM

print_test "Sending test message to $EMAIL (str: $RANDOMID)"
OUTPUT=`./sendmail.sh -q 1 $EMAIL "subject with $RANDOMID" "body with $RANDOMID"`
print_result 0 $OUTPUT

print_test "Sleeping 5 seconds"
OUTPUT=`sleep 5`
print_result 0 $OUTPUT

print_test "CAPA test"
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT`;
print_result 0 $OUTPUT

print_test "RETR test"
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT --download on`;
OUTPUT=`echo $OUTPUT | grep $RANDOMID`
if [ $? -eq 1 ]; then OUTPUT="fail"; fi
print_result 0 $OUTPUT

print_test "RETR, DELE test"
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT --download on --dele on`;
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT --download on`;
OUTPUT=`echo $OUTPUT | grep $RANDOMID`
if [ $? -eq 0 ]; then OUTPUT="fail"; fi
print_result 0 $OUTPUT

RANDOMID=$RANDOM
print_test "Sending test message to $EMAIL (str: $RANDOMID)"
OUTPUT=`./sendmail.sh -q 1 $EMAIL "subject with $RANDOMID" "body with $RANDOMID"`
print_result 0 $OUTPUT

print_test "Sleeping 5 seconds"
OUTPUT=`sleep 5`
print_result 0 $OUTPUT

print_test "DELE test"
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT --dele on`;
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT --download on`;
OUTPUT=`echo $OUTPUT | grep $RANDOMID`
if [ $? -eq 0 ]; then OUTPUT="fail"; fi
print_result 0 $OUTPUT

RANDOMID=$RANDOM
print_test "Sending test message to $EMAIL (str: $RANDOMID)"
OUTPUT=`./sendmail.sh -q 1 $EMAIL "subject with $RANDOMID" "body with $RANDOMID"`
print_result 0 $OUTPUT

print_test "Sleeping 5 seconds"
OUTPUT=`sleep 5`
print_result 0 $OUTPUT

print_test "DELE, RSET, RETR test"
OUTPUT=`node basic.js --username $USER --password $PASS --host $HOST --port $PORT --dele on --rset on --download on`;
OUTPUT=`echo $OUTPUT | grep $RANDOMID`
if [ $? -eq 1 ]; then OUTPUT="fail"; fi
print_result 0 $OUTPUT
