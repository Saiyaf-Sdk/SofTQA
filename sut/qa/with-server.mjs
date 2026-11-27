import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const [suite, ...args] = process.argv.slice(2);
const tools = {
  bdd: ['node_modules/@cucumber/cucumber/bin/cucumber.js', '--import', 'features/steps/*.mjs'],
  postman: ['node_modules/newman/bin/newman.js', 'run', 'qa/nebo.postman_collection.json']
};
if (!Object.hasOwn(tools, suite)) throw new Error('Choose bdd or postman.');

const listener = createServer();
listener.listen(0, '127.0.0.1');
await once(listener, 'listening');
const port = listener.address().port;
await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
const base = 'http://127.0.0.1:' + port;
const service = spawn(process.execPath, ['server/index.mjs', '--port', String(port)], {
  env: { ...process.env, HOST: '127.0.0.1', DATABASE_PATH: ':memory:', COOKIE_SECURE: 'false' },
  stdio: 'inherit'
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 100 && service.exitCode === null; attempt++) {
    ready = await fetch(base + '/api/products', { signal: AbortSignal.timeout(750) })
      .then((response) => response.ok, () => false);
    if (ready) break;
    await delay(100);
  }
  if (!ready) throw new Error('QA server did not start.');
  const options = suite === 'postman' ? ['--env-var', 'baseUrl=' + base] : [];
  const runner = spawn(process.execPath, [...tools[suite], ...options, ...args], {
    stdio: 'inherit',
    env: { ...process.env, QA_BASE_URL: base }
  });
  const [status] = await once(runner, 'exit');
  process.exitCode = status ?? 1;
} finally {
  service.kill();
}
