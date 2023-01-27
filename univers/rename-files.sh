#!/usr/bin/env bash

OUTPUT_HASH=$(sha256sum output.json | cut -c1-8)
mv output.json output.${OUTPUT_HASH}.json
sed -i "s/output.json/output.${OUTPUT_HASH}.json/g" src/App.js

INDEX_HASH=$(sha256sum index.json | cut -c1-8)
mv index.json index.${INDEX_HASH}.json
sed -i "s/index.json/index.${INDEX_HASH}.json/g" src/App.js
