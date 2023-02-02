#!/bin/bash
set -e -x

cd ~/$APPLICATION_NAME

[ -d "node_modules" ] && echo "Directory node_modules exists so cleaning up the directory"; rm -rf node_modules

npm install typescript
npm install
npm run build
