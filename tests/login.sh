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

print_title "login.js"
print_test "Correct auth"
OUTPUT=`node login.js --username $USER --password $PASS --host $HOST --port $PORT`;
print_result 0 $OUTPUT

print_test "Invalid auth"
OUTPUT=`node login.js --username $USER --password ${PASS}a --host $HOST --port $PORT`
print_result 1 $OUTPUT

print_test "Correct host"
OUTPUT=`node login.js --username $USER --password $PASS --host $HOST --port $PORT`;
print_result 0 $OUTPUT

print_test "Invalid host"
OUTPUT=`node login.js --username $USER --password $PASS --host ${HOST}a --port $PORT`
print_result 1 $OUTPUT

print_test "Correct port"
OUTPUT=`node login.js --username $USER --password $PASS --host $HOST --port $PORT`;
print_result 0 $OUTPUT 

print_test "Invalid port"
OUTPUT=`node login.js --username $USER --password $PASS --host $HOST --port ${PORT}1`
print_result 1 $OUTPUT
