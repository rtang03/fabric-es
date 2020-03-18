#!/usr/bin/env bash

NAME=XXXX
PEER=YYYY
DOMAIN=ZZZZ
. ./setup.sh

echo $1
echo $2
echo $3
LIST="$1 $2 $3"
echo $LIST

for ORG in $LIST
do
  getName $ORG
  echo 'HI' $ORG $NAME $PEER $DOMAIN
done
