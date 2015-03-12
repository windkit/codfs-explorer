#!/bin/bash

# $1 is the path of the monitor log file

# no log file exist
if [[ ! -e "$1" ]]; then
	exit 1
fi

# cannot read the log file
if [[ ! -r $1 ]]; then
	exit 2
fi

# get the line number which has the latest word "finish"
# -1 is to ignore the 'finish' line
end=$((`grep -n "finish" $1 | tail -n 1 | cut -d ":" -f "1"` - 1))
# get the line number of word "start" which is just before the latest word "finish"
# +1 is to ignore the 'start' line
begin=$((`head -n${end} $1 | grep -n "start" | tail -n1 | cut -d ":" -f "1"` + 1))

# there is no record, no OSD, need a special handle, else
# will output everything 0
if [ $(($end - $begin)) -lt 0 ]; then
	exit 3
fi

# extract the OSD state in bewteen the "start" and "finish", only the even line is useful
# -u in sed mean --unbuffered
# the 2nd last pipe is to extrat the even numebr line
# the last time is to change all the chacarter [ , ] into space,
# so can prase it easily as shell default IFS include space and tab
content=`sed -u -n "${begin},${end}p" $1 | sed -u '1d; n; d'| sed -u "s/[][,]/ /g"`


# parsing output delimited by new line

i=0
while read line; do
	read tmp id[${i}] ip[$i] port[$i] fd[$i] cap[$i] load[$i] health[$i] <<< "$line"

	# to strip the id= / ip= part
	id[$i]=${id[$i]#*=}
	ip[$i]=${ip[$i]#*=}
	port[$i]=${port[$i]#*=}
	cap[$i]=${cap[$i]#*=}

	i=$(($i + 1))
done <<< "$content"

# output as JSON so php can parse it easily
# json need " " on the key and value if it is a string
# using "-n" in echo to ensure php only receive one array instead of multi array
end=$((${#id[@]} - 1))
echo -n "{"
for((i = 0; i < $end; i++)); do
	echo -n "\"$i\": {\"ip\": \"${ip[$i]}\", \"port\": \"${port[$i]}\", \"id\": \"${id[$i]}\", \"free\": \"${cap[$i]}\"}, "
done
# the end part of json output
echo -n "\"$i\": {\"ip\": \"${ip[$i]}\", \"port\": \"${port[$i]}\", \"id\": \"${id[$i]}\", \"free\": \"${cap[$i]}\"}}"
