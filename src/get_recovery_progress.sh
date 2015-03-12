#!/bin/bash

# to check the mds log to see if codsfs has finished the recovery
# $1 MDS process name
# $2 MDS log path
# $3 MDS last recovery log path -> to tell when is the last recovery

# check if the mds process is running
# if the web server and MDS is in same machine, will grep the ssh command
proc=`ps aux | grep $1 | grep -Ev "(bash|grep)"`
if [ -z "$proc" ]; then
	echo -101; exit -1
fi

# check if the log file exist or not
if [ ! -e $2 ]; then
	echo -102; exit -2
fi

# check for the last recovery
if [ -e $3 ]; then
	last_rec=`cat $3`
else
	# since cannot find the last record file
	# so by default we set it as 0
	last_rec=0
fi

# to find the line number of the last recovery
# || part in case the 1st time top do recovery
line=`sed -n '/\[RECOVER\]/=' $2 | tail -n 1`

# cannot find any recovered word, so it is not finished
if [ -z $line ]; then
	echo -3
	exit 0
fi

#debug
# echo "=========== in mds log ===========" >&2
# echo "debug: line: $line | last_rec: $last_rec" >&2

if [ $line -le $last_rec ]; then
	# not yet recovered as no new record appear
	echo -3
	exit 0
fi

# to get the time used in the recovery, $1 is the log location
time=`sed -n "${line}p" $2 | grep -oE '[0-9]+.?[0-9]+'`

# debug
# echo "Finish recovery with the time $time" >&2

# update record
echo $line > $3

# print back the result
echo $time

