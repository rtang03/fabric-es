#!/bin/sh

# $1 - ref-impl | relay-pboc
# $2 - host#1 port#1 host#2 port#2 host#3 port#3 | mock-url (e.g. https://localhost:9999)

case $1 in
  relay-pboc)
    echo "Starting 3 orgs relay test..."
    exec node ./dist/relay/mockServer.js &

    TIMEOUT=80
    while [ $TIMEOUT -gt 0 ]; do
      RESULT=`curl -k $2/ready | grep "Ready"`
      if [ ! -z "$RESULT" ]; then
        echo "Mock server found"
        break;
      fi
      TIMEOUT=$(( TIMEOUT - 1 ))
      echo "$TIMEOUT - waiting for mock server..."
      sleep 1
    done

    if [ $TIMEOUT -le 0 ]; then
      echo "Timed out"
      exit 1
    fi

    exec node ./dist/relay/relay.rtest.js
    ;;

  ref-impl)
    COUNT=0
    HOSTS=
    DELIM=
    STATE=0
    for VAL in $2; do
      HOSTS=$HOSTS$DELIM$VAL
      if [ $STATE -eq 0 ]; then
        DELIM=":"
        STATE=1
      else
        DELIM=" "
        STATE=0
      fi
    done

    for VAL in $HOSTS; do
      COUNT=$(( COUNT + 1 ))
    done

    if [ $COUNT -lt 1 ]; then
      echo "No gateway given"
      exit 1
    fi
    echo "Waiting for $COUNT gateways before runing tests: $HOSTS"

    FOUND=0
    TIMEOUT=80
    while [ $FOUND -lt $COUNT -a $TIMEOUT -gt 0 ]; do
      FOUND=0
      for HOST in $HOSTS; do
        RESULT=`curl -s -o /dev/null -w "%{http_code}" $HOST/.well-known/apollo/server-health | grep "200"`
        if [ ! -z "$RESULT" ]; then
          FOUND=$(( FOUND + 1 ))
        fi
      done

      if [ $FOUND -ge $COUNT ]; then
        echo "$FOUND gateways found"
        break;
      fi
      TIMEOUT=$(( TIMEOUT - 1 ))
      echo "$TIMEOUT - waiting for $(( COUNT - FOUND )) gateway(s)..."
      sleep 1
    done

    if [ $TIMEOUT -le 0 ]; then
      echo "Timed out"
      exit 1
    fi

    if [ $FOUND -eq 3 ]; then
      echo "3 orgs robustness test not yet supported..."
      exec node ./dist/ref-impl/ri.2org.rtest.js
    else
      echo "Starting 2 orgs robustness test..."
      exec node ./dist/ref-impl/ri.2org.rtest.js
    fi
    ;;

  jest)
    COUNT=0
    HOSTS=
    DELIM=
    STATE=0
    for VAL in $2; do
      HOSTS=$HOSTS$DELIM$VAL
      if [ $STATE -eq 0 ]; then
        DELIM=":"
        STATE=1
      else
        DELIM=" "
        STATE=0
      fi
    done

    for VAL in $HOSTS; do
      COUNT=$(( COUNT + 1 ))
    done

    if [ $COUNT -lt 1 ]; then
      echo "No gateway given"
      exit 1
    fi
    echo "Waiting for $COUNT gateways before runing tests: $HOSTS"

    FOUND=0
    TIMEOUT=80
    while [ $FOUND -lt $COUNT -a $TIMEOUT -gt 0 ]; do
      FOUND=0
      for HOST in $HOSTS; do
        RESULT=`curl -s -o /dev/null -w "%{http_code}" $HOST/.well-known/apollo/server-health | grep "200"`
        if [ ! -z "$RESULT" ]; then
          FOUND=$(( FOUND + 1 ))
        fi
      done

      if [ $FOUND -ge $COUNT ]; then
        echo "$FOUND gateways found"
        break;
      fi
      TIMEOUT=$(( TIMEOUT - 1 ))
      echo "$TIMEOUT - waiting for $(( COUNT - FOUND )) gateway(s)..."
      sleep 1
    done

    if [ $TIMEOUT -le 0 ]; then
      echo "Timed out"
      exit 1
    fi

    if [ $FOUND -eq 3 ]; then
      echo "Starting 3 orgs integration test..."
      exec yarn test:3org
    else
      echo "Starting 2 orgs integration test..."
      exec yarn test:2org --verbose
    fi
    ;;
  *)
    echo "Unknown test options $1"
    exit 1
    ;;
esac
