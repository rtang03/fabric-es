#!/usr/bin/env bash

# $1 - ecosystem file
# $2 - gateway to start last
# $3 - services to start first

COUNT=0
GLST=
PLST=
for APP in $3; do
  GLST="$GLST|$APP"
  PLST="$PLST,$APP"
  COUNT=$(( COUNT + 1 ))
done

pm2Wait() {
  CNT1=$1
  LIST=$2

  if [ $CNT1 -lt 1 ]; then
    echo "Nothing to wait"
    exit -1
  fi

  STARTED=false
  COUNT=60
  while [[ ("$STARTED"=false) && (COUNT -gt 0) ]]; do
    CNT2=0
    while read -r LINE; do
      RESULT=$(echo $LINE | grep -E "($LIST)" | grep online)
      if [ ! -z "$RESULT" ]; then
        CNT2=$(( CNT2 + 1 ))
      fi
    done < <(pm2 list)

    echo -n "."
    if [ $CNT2 -ge $CNT1 ]; then
      STARTED=true
      echo "$CNT2 started"
      break;
    fi
    COUNT=$(( COUNT - 1 ))
    sleep 1
  done
  if [ $COUNT -le 0 ]; then
    printf "Timed out\n"
    exit -1
  fi
}

echo "Starting $1 --only \"${PLST:1}\""
pm2 start $1 --only "${PLST:1}"

echo "Wait for ${GLST:1}"
pm2Wait $COUNT ${GLST:1}

echo "Starting $1 --only \"$2\""
pm2 start $1 --only "$2"
