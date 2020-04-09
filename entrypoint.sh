#!/bin/sh

# $1 - gateway to start last
# $2 - services to start first

COUNT=0
PLST=
DLIM=
for APP in $2; do
  PLST="$PLST$DLIM$APP"
  COUNT=$(( COUNT + 1 ))
  DLIM=","
done

pm2Wait() {
  EXPECTED=$1
  if [ $EXPECTED -lt 1 ]; then
    echo "Nothing to wait for"
    exit 1
  fi

  STARTED=0
  TIMEOUT=60
  while [ $STARTED -eq 0 -a $TIMEOUT -gt 0 ]; do
    COUNT=0
    for SERVICE in $2; do
      RESULT=`pm2 logs --nostream | grep $SERVICE | grep "ready at\|available at"`
      if [ ! -z "$RESULT" ]; then
        COUNT=$(( COUNT + 1 ))
      fi
    done

    if [ $COUNT -ge $EXPECTED ]; then
      STARTED=1
      echo " $COUNT started"
      break;
    fi
    TIMEOUT=$(( TIMEOUT - 1 ))
    sleep 1
  done

  if [ $TIMEOUT -le 0 ]; then
    echo "Timed out"
    exit 1
  fi
}

node ./dist/enrollAdmin.js
sleep 1

node ./dist/enrollCaAdmin.js
sleep 1

pm2 flush

echo "Starting \"$PLST\""
pm2 start ./processes.yaml --only "$PLST"

echo "Wait for $COUNT services"
pm2Wait $COUNT "$2"

echo "Starting \"$1\""
exec pm2-runtime start ./processes.yaml --only "$1"
