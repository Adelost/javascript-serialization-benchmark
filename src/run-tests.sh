#!/bin/bash

npm run benchmark 'testJson'

npm run benchmark 'testBson'

npm run benchmark 'testAvro'

npm run benchmark 'testProtoJs'
npm run benchmark 'testProtoGoogle'
npm run benchmark 'testProtoProtons'
npm run benchmark 'testProtoMixed'

npm run benchmark 'testJsBin'
npm run benchmark 'testJsBinOptional'

npm run benchmark 'testJsonUnmapped'
npm run benchmark 'testJsBinUnmapped'
npm run benchmark 'testJsBinJsonUnmapped'
npm run benchmark 'testBsonUnmapped'
