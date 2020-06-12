#!/bin/sh
set -e

export PGPASSWORD=$TYPEORM_PASSWORD

i=0;
while ! psql -h postgres01 -U postgres -lqt | cut -d \| -f 1 | grep -qw auth_db; do

  echo "Checking Postgres DB readiness...";
  i=`expr $i + 1`;
  sleep 1;

  if test $i -ge 30; then
    echo "Postgres DB is not ready!";
    exit 1;
  fi

done

echo "Starting Auth Server.";
exec pm2-runtime start ./processes.yaml
