import * as bench from './benchmarks';
import { runTest } from './utils/helper';


const TESTS = {
  testJson: () => runTest('JSON', ({ data }) => bench.testJson(data), 298),

  testBson: () => runTest('BSON', ({ data }) => bench.testBson(data), 21),

  testAvroJs: () => runTest('AVRO JS', ({ data }) => bench.testAvroJs(data), 372),
  testAvroAvsc: () => runTest('AVRO Avsc', ({ data }) => bench.testAvroAvsc(data), 372),
  testAvroAvscOptional: () => runTest('AVRO Avsc (optional)', ({ data }) => bench.testAvroAvscOptional(data), 372),


  testProtoJs: () => runTest('PROTOBUF JS', ({ data }) => bench.testProtoJs(data), 153),
  testProtoPbf: () => runTest('PROTOBUF Pbf', ({ data }) => bench.testProtoPbf(data), 372),
  testProtoGoogle: () => runTest('PROTOBUF Google', ({ data }) => bench.testProtoGoogle(data), 98),
  testProtoProtons: () => runTest('PROTOBUF Protons', ({ data }) => bench.testProtoProtons(data), 40),
  testProtoMixed: () => runTest('PROTOBUF mixed', ({ data }) => bench.testProtoMixed(data), 372),

  testJsBin: () => runTest('JSBIN', ({ data }) => bench.testJsBin(data), 372),
  testJsBinOptional: () => runTest('JSBIN (optional)', ({ data }) => bench.testJsBinOptional(data), 372),

  testBser: () => runTest('BSER', ({ data }) => bench.testBser(data), 372),

  testJsonUnmapped: () => runTest('JSON (unmapped)', ({ unmappedData }) => bench.testJsonUnmapped(unmappedData), 298),
  testAvroAvscUnmapped: () => runTest('AVRO Avsc (unmapped)', ({ unmappedData }) => bench.testAvroAvscUnmapped(unmappedData), 237),
  testJsBinUnmapped: () => runTest('JSBIN (unmapped)', ({ unmappedData }) => bench.testJsBinUnmapped(unmappedData), 372),
  testJsBinJsonUnmapped: () => runTest('JSBIN JSON (unmapped)', ({ unmappedData }) => bench.testJsBinJsonUnmapped(unmappedData), 372),
  testBsonUnmapped: () => runTest('BSON (unmapped)', ({ unmappedData }) => bench.testBsonUnmapped(unmappedData), 21),
};


(async () => {
  const args = process.argv.slice(3);
  console.log('Arguments', args);
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

  await TESTS.testAvroJs();
  await TESTS.testAvroAvsc();
  await TESTS.testAvroAvscOptional();

  await TESTS.testProtoJs();
  await TESTS.testProtoPbf();
  await TESTS.testProtoGoogle();
  await TESTS.testProtoProtons();
  await TESTS.testProtoMixed();

  await TESTS.testJsBin();
  await TESTS.testJsBinOptional();

  await TESTS.testBser();

  await TESTS.testJsonUnmapped();
  await TESTS.testAvroAvscUnmapped();
  await TESTS.testJsBinUnmapped();
  await TESTS.testJsBinJsonUnmapped();
  await TESTS.testBsonUnmapped();
}
