import * as bench from './benchmarks';
import { runTest } from './utils/helper';


const TESTS = {
  testJson: () => runTest('JSON', ({ mappedData }) => bench.testJson(mappedData), 298),

  testBson: () => runTest('BSON', ({ mappedData }) => bench.testBson(mappedData), 21),

  testAvro: () => runTest('AVRO', ({ mappedData }) => bench.testAvro(mappedData), 372),

  testProtoJs: () => runTest('PROTOBUF (JS)', ({ mappedData }) => bench.testProtoJs(mappedData), 153),
  testProtoGoogle: () => runTest('PROTOBUF (Google)', ({ mappedData }) => bench.testProtoGoogle(mappedData), 98),
  testProtoProtons: () => runTest('PROTOBUF (Protons)', ({ mappedData }) => bench.testProtoProtons(mappedData), 40),
  testProtoMixed: () => runTest('PROTOBUF (mixed)', ({ mappedData }) => bench.testProtoMixed(mappedData), 372),

  testJsBin: () => runTest('JSBIN', ({ mappedData }) => bench.testJsBin(mappedData), 372),
  testJsBinOptional: () => runTest('JSBIN (optional)', ({ mappedData }) => bench.testJsBinOptional(mappedData), 372),

  testJsonUnmapped: () => runTest('JSON (unmapped)', ({ unmappedData }) => bench.testJsonUnmapped(unmappedData), 298),
  testJsBinUnmapped: () => runTest('JSBIN (unmapped)', ({ unmappedData }) => bench.testJsBinUnmapped(unmappedData), 372),
  testJsBinJsonUnmapped: () => runTest('JSBIN JSON (unmapped)', ({ unmappedData }) => bench.testJsBinJsonUnmapped(unmappedData), 372),
  testBsonUnmapped: () => runTest('BSON (unmapped)', ({ unmappedData }) => bench.testBsonUnmapped(unmappedData), 21),
};


(async () => {
  const args = process.argv.slice(2);
  if (args.length) {
    for (const arg of args) {
      if (TESTS[arg]) {
        await TESTS[arg]();
      }
    }
  } else {
    await runDefault();
  }
})();

async function runDefault() {
  console.log('Running default');
  await TESTS.testJson();

  await TESTS.testBson();

  await TESTS.testAvro();

  await TESTS.testProtoJs();
  await TESTS.testProtoGoogle();
  await TESTS.testProtoProtons();
  await TESTS.testProtoMixed();

  await TESTS.testJsBin();
  await TESTS.testJsBinOptional();

  await TESTS.testJsonUnmapped();
  await TESTS.testJsBinUnmapped();
  await TESTS.testJsBinJsonUnmapped();
  await TESTS.testBsonUnmapped();
}
