import { readFileSync } from 'node:fs';

function fields(line) {
  return Array.from(line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g),
    ([, quoted, plain]) => quoted?.replaceAll('""', '"') ?? plain);
}

function summarize(file, users) {
  const [header, ...data] = readFileSync(file, 'utf8').trim().split(/\r?\n/).map(fields);
  const samples = data.map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index]]))
  );
  if (samples.length === 0 || samples.some((sample) => !Number.isFinite(Number(sample.elapsed)))) {
    throw new Error('No valid JMeter sample rows in ' + file);
  }

  const times = samples.map(({ elapsed }) => Number(elapsed)).sort((a, b) => a - b);
  const start = Math.min(...samples.map(({ timeStamp }) => Number(timeStamp)));
  const end = Math.max(...samples.map(({ timeStamp, elapsed }) => Number(timeStamp) + Number(elapsed)));
  const failed = samples.filter(({ success }) => success !== 'true').length;
  const percentile = (percentage) => times[Math.ceil(percentage / 100 * times.length) - 1];
  const round = (number) => Math.round(number * 100) / 100;

  return {
    users,
    samples: samples.length,
    failed,
    errorPercent: round(failed / samples.length * 100),
    averageMs: round(times.reduce((sum, value) => sum + value, 0) / times.length),
    p50Ms: percentile(50),
    p95Ms: percentile(95),
    p99Ms: percentile(99),
    maxMs: times.at(-1),
    requestsPerSecond: round(samples.length / ((end - start) / 1000)),
    thresholdPassed: samples.length === users * 50 && failed === 0 && percentile(95) <= 250
  };
}

const [baseline, load] = process.argv.slice(2);
console.log(JSON.stringify([summarize(baseline, 1), summarize(load, 10)], null, 2));
