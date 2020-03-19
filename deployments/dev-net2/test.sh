#!/usr/bin/env bash

. ./scripts/setup.sh

containerWait "postgres01" "psql -h localhost -U postgres -d auth_db -lqt" "auth_dc"

echo "DONE!"