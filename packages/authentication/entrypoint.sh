#!/bin/sh

# Read in the file of environment settings
export $(grep -v '^#' .env | xargs)

# Then run the CMD
exec "$@"
