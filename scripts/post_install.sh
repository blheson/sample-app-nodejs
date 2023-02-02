#!/bin/bash
set -e -x

cd ~/$APPLICATION_NAME

[ -d "node_modules" ] && echo "Directory node_modules exists so cleaning up the directory"; rm -rf node_modules

yarn install typescript
yarn install
yarn test
yarn run build
