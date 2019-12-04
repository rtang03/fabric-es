#!/bin/sh

view="./views/v1.json"

# If view is inputed, use the inputted view, otherwise use the default one.
if [ $# -eq 1 ]; then
    view="./views/$1.json"
fi

files="find . -name '*.mustache' -print"
for infile in `eval ${files}`; do
    echo "Processing ${infile}..."
    outfile=$(echo .${infile} | sed 's/\(.*\)\.mustache/\1/')
    mustache ${view} ${infile} > ${outfile}
done

echo "Done!"
