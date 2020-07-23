import { LOGGING } from '../config';

export function secondsFrom(startTime: number): number {
  const now = Date.now();
  return (now - startTime) / 1000;
}

export function getNanoTime(): number {
  const time = process.hrtime();
  return time[0] + time[1] / 1e9;
}

export function secondsFromNanoTime(startTime: number): number {
  const now = getNanoTime();
  return now - startTime;
}

export function bytesToHumanReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const num = (bytes / Math.pow(1024, i));
  return `${num.toFixed(2)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
}

export function bytesToMb(bytes: number): number {
  return bytes / (1024 * 1024);
}


export function log(...args) {
  if (LOGGING) {
    console.log(...args);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

export function runGarbageCollection(): void {
  if (global.gc) {
    global.gc();
  }
}



