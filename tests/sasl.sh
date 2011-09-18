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

print_title "sasl.js"
RANDOMID=$RANDOM

print_test "Sending test message to $EMAIL (str: $RANDOMID)"
OUTPUT=`./sendmail.sh -q 1 $EMAIL "subject with $RANDOMID" "body with $RANDOMID"`
print_result 0 $OUTPUT

print_test "Valid PLAIN login without TLS"
OUTPUT=`node sasl.js --username $USER --password $PASS --host $HOST --port $PORT --auth plain`;
print_result 0 $OUTPUT

print_test "Valid CRAM-MD5 login without TLS"
OUTPUT=`node sasl.js --username $USER --password $PASS --host $HOST --port $PORT --auth "cram-md5"`;
print_result 0 $OUTPUT

print_test "Invalid PLAIN login without TLS"
OUTPUT=`node sasl.js --username $USER --password ${PASS}a --host $HOST --port $PORT --auth plain`;
print_result 1 $OUTPUT

print_test "Invalid CRAM-MD5 login without TLS"
OUTPUT=`node sasl.js --username $USER --password ${PASS}a --host $HOST --port $PORT --auth "cram-md5"`;
print_result 1 $OUTPUT

print_test "Valid PLAIN login with TLS"
OUTPUT=`node sasl.js --username $USER --password $PASS --host $HOST --port $TLSPORT --auth plain --tls on`;
print_result 0 $OUTPUT

print_test "Valid CRAM-MD5 login with TLS"
OUTPUT=`node sasl.js --username $USER --password $PASS --host $HOST --port $TLSPORT --auth "cram-md5" --tls on`;
print_result 0 $OUTPUT

print_test "Invalid PLAIN login with TLS"
OUTPUT=`node sasl.js --username $USER --password ${PASS}a --host $HOST --port $TLSPORT --auth plain --tls on`;
print_result 1 $OUTPUT

print_test "Invalid CRAM-MD5 login with TLS"
OUTPUT=`node sasl.js --username $USER --password ${PASS}a --host $HOST --port $TLSPORT --auth "cram-md5" --tls on`;
print_result 1 $OUTPUT

print_test "PLAIN login and message download"
OUTPUT=`node sasl.js --username $USER --password $PASS --host $HOST --port $PORT --auth plain --download on`
OUTPUT=`echo $OUTPUT | grep $RANDOMID`

if [ $? -eq 1 ]; then OUTPUT="fail"; fi

print_result 0 $OUTPUT

print_test "Sending another test message to $EMAIL (str: $RANDOMID)"
OUTPUT=`./sendmail.sh -q 1 $EMAIL "subject with $RANDOMID" "body with $RANDOMID"`
print_result 0 $OUTPUT

print_test "Sleeping 5 seconds"
OUTPUT=`sleep 5`
print_result 0 $OUTPUT

print_test "CRAM-MD5 login and message download"
OUTPUT=`node sasl.js --username $USER --password $PASS --host $HOST --port $PORT --auth "cram-md5" --download on`
OUTPUT=`echo $OUTPUT | grep $RANDOMID`

if [ $? -eq 1 ]; then OUTPUT="fail"; fi

print_result 0 $OUTPUT
