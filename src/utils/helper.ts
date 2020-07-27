import fs from 'fs';
import { ROOT_DIR } from '../_root';
import {
  FAST_SPEED_LIMIT_MB,
  MAX_SIZE_IN_MB,
  MIN_SIZE_IN_MB,
  SPEED_FRACTION_FAST,
  SPEED_FRACTION_NORMAL,
  START_ITERATION,
} from '../config';
import { bytesToMb, getNanoTime, log, runGarbageCollection, secondsFromNanoTime, sleep } from './utils';

const PLOT_FILE_PATH = `${ROOT_DIR}/tmp/plot.json`;


export async function runTest(label: string, fn: (payload) => Promise<BenchmarkResult>, limit: number) {
  console.log(`TEST ${label}`);
  const start = getNanoTime();
  const xValues: number[] = [];
  const results: BenchmarkResult[] = [];
  let unmappedData = [
    [1, 4.1040000000000004, 1.1009999999999994],
    [2, 4.371033333333333, 0.36703333333333266],
    [3, 5.171833333333334, 0.4337666666666671],
    [4, 6.473133333333333, 0.36703333333333354],
  ];
  let data: any = null;
  let sizeInMb = 0;
  let i = 0;
  while (true) {
    let fractionIncrement = sizeInMb > FAST_SPEED_LIMIT_MB ? SPEED_FRACTION_FAST : SPEED_FRACTION_NORMAL;
    const dataIncrement = unmappedData
    // Increase size by fraction limit
    .slice(0, Math.round(unmappedData.length / fractionIncrement))
    // Slightly alter data to make sure each value is unique
    .map(value => [value[0] + 1, value[1] + 1 / 3, value[2] + 1 / 3]);
    unmappedData = [...unmappedData, ...dataIncrement];
    // Ugly performance optimization to avoid calculating object size
    // on large payloads (which can be slow)
    if (sizeInMb < FAST_SPEED_LIMIT_MB * 1.5) {
      data = mapTestData(unmappedData);
      sizeInMb = bytesToMb(JSON.stringify(data).length);
    } else {
      sizeInMb += sizeInMb / fractionIncrement;
    }
    i += 1;
    // Allows skipping to larger payloads without having to calculate
    // object (which can be slow on large payloads)
    if (i < START_ITERATION) {
      continue;
    }
    if (sizeInMb > MAX_SIZE_IN_MB || sizeInMb > limit) {
      break;
    }
    if (sizeInMb >= FAST_SPEED_LIMIT_MB * 1.5) {
      data = mapTestData(unmappedData);
    }
    if (sizeInMb >= MIN_SIZE_IN_MB) {
      log(`\n${i} DATA SIZE: ${sizeInMb}`);
      results.push(await fn({ unmappedData, mappedData: data }));
      xValues.push(sizeInMb);
    } else {
      log(`# ${i} DATA SIZE: ${sizeInMb}`);
    }
  }
  console.log(`TOTAL TIME: ${secondsFromNanoTime(start).toFixed(2)} s`);
  savePlotData(results, xValues, label);
}

function mapTestData(unmappedData: number[][]) {
  return {
    items: unmappedData.map(([x, y, z]) => ({ x, y, z })),
  };
}

export interface BenchmarkArgs {
  encode: (data) => any;
  data: any;
  sampleDecoded: (data) => any;
  decode: (data) => any;
  baseline?: BenchmarkResult,
  encoding?: BufferEncoding;
}

export interface BenchmarkResult {
  decodedTime: number;
  encodedSize: number;
  encodedTime: number;
}

export async function benchmark(args: BenchmarkArgs): Promise<BenchmarkResult> {
  runGarbageCollection();
  await sleep(5);
  let start = getNanoTime();
  const encoded = args.encode(args.data);
  const encodedTime = secondsFromNanoTime(start);

  const encodedSize: number = bytesToMb(encoded.length);

  // // Saving and loading data from disk does not seem to affect performance much
  // fs.writeFileSync(`${ROOT_DIR}/tmp/tmp`, encoded);
  // const loaded = fs.readFileSync(`${ROOT_DIR}/tmp/tmp`, args.encoding ? args.encoding : undefined);
  // const decoded = args.decode(loaded);

  runGarbageCollection();
  await sleep(5);
  start = getNanoTime();
  const decoded = args.decode(encoded);
  const decodedTime = secondsFromNanoTime(start);

  const sample = args.sampleDecoded(decoded);

  const out = {
    encodedTime,
    decodedTime,
    encodedSize,
  };
  log(
    out.encodedTime.toFixed(2),
    out.decodedTime.toFixed(2),
    out.encodedSize.toFixed(2),
    sample,
  );
  return out;
}


export function loadPlotData(): any {
  if (!fs.existsSync(PLOT_FILE_PATH)) {
    fs.writeFileSync(PLOT_FILE_PATH, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(PLOT_FILE_PATH, 'utf8'));
}

export function savePlotData(results: BenchmarkResult[], xValues: number[], label: string) {
  const plot = loadPlotData();
  const y = {};
  results.forEach(result => {
    Object.entries(result).forEach(([k, v]) => {
      y[k] = y[k] || [];
      y[k].push(v);
    });
  });
  plot[label] = {
    label: label,
    x: xValues,
    y,
  };
  fs.writeFileSync(PLOT_FILE_PATH, JSON.stringify(plot, null, 2));
}


