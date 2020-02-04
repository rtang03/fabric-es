#!/bin/sh
node ./dist/enrollAdmin.js
sleep 1
node ./dist/enrollCaAdmin.js
sleep 1
ls -Rt ./assets

node node ./dist/app.js && tail -f /dev/null
