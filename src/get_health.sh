#!/bin/bash
# to check if the osd the is under recovery or not
# $1 -> monitor process name
# $2 -> log file path
# $3 -> last recover log file

# check if the monitor process is running
# if the web server and MONTIOR is in same machine, will grep the ssh command
proc=`ps aux | grep $1 | grep -Ev "(bash|grep)"`
if [ -z "$proc" ]; then
	echo -1; exit -1
fi

# check if the log file exist or not
if [ ! -e $2 ]; then
	echo -2; exit -2
fi

# check for the last recovery
if [ -e $3 ]; then
	last_rec=`cat $3`
else
	# since cannot find the last record file
	# so by default we set it as 0
	last_rec=0
fi

# to check if there is recovery record
rec_start=`sed -n '/recover failure/=' $2 | tail -n 1`

# cannot find any recovery record, since we cannot find the matched word
if [ -z "$rec_start" ]; then
	echo 0
	exit 0
fi

# debug
#echo ------------- in monitor.log ---------- >&2
#echo "debug: rec_start: $rec_start | last_rec: $last_rec" >&2

if [ $rec_start -le $last_rec ]; then
	# no NEW recovery had found
	echo 0
	exit 0
fi

# update the record
echo $rec_start > $3

echo 1

