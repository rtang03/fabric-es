#!/bin/sh
set -e

export PGPASSWORD=$TYPEORM_PASSWORD
export HOST=$TYPEORM_HOST
export USER=$TYPEORM_USERNAME
export DB=$TYPEORM_DATABASE

i=0;
while ! psql -h $HOST -U $USER -lqt | cut -d \| -f 1 | grep -qw $DB; do

  echo "Checking DB readiness for host $HOST user $USER db $DB ...";
  i=`expr $i + 1`;
  sleep 1;

  if test $i -ge 30; then
    echo "DB for host $HOST user $USER db $DB is not ready!!";
    exit 1;
  fi

done

echo "Starting Auth Server for host $HOST user $USER db $DB.";
exec pm2-runtime start ./processes.yaml
