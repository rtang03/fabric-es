#!/bin/sh

if [ $# -ne 2 ]; then
    echo [`date +"%Y-%m-%d %H:%M:%S"`] "Usage: parse.sh [folder] [view]" \
         "(e.g. : ./parse.sh fabric prod-like)"
    exit 1
fi

folder="$1"
view="./${folder}/_views/$2.json"

# Handle '*.mustaches' files - which split the file into few files
files="find ${folder} -name '*.mustaches' -print"
for infile in `eval ${files}`; do

    # Mustache the file
    echo "Processing ${infile}..."
    outfile=$(echo ${infile} | sed 's/'${folder}'/../' | sed 's/\(.*\)\.mustaches/\1/')
    mustache ${view} ${infile} > ${outfile}

    # Split the file name with '.'
    filnam=$(echo ${outfile} | sed 's/\.[^.]*$//')
    filext=$(echo ${outfile} | sed 's/.*\.//')

    # Split the file into multiple files
    awk -v filnam=${filnam} -v filext=${filext} '/-- SPLIT WITH AWK --/ {x = sprintf(filnam"%s%s", ++i, "."filext); next} {print > x}' ${outfile}

    # Remove the intermediate out file
    rm ${outfile}
done

# Handle '*.mustache' files
# Note: mustache files have to be processed second to allow some files
# (e.g. join_channel_org1.sh is different from other join channel scripts) to be overwritten.
files="find ${folder} -name '*.mustache' -print"
for infile in `eval ${files}`; do
    echo "Processing ${infile}..."
    outfile=$(echo ${infile} | sed 's/'${folder}'/../' | sed 's/\(.*\)\.mustache/\1/')
    mustache ${view} ${infile} > ${outfile}
done

echo "Done!"
