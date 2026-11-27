import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const project = 'ec4206-nebo';
const base = process.env.SONAR_HOST_URL;
const token = process.env.SONAR_TOKEN;
const output = process.argv[2];
if (!base || !token || !output) throw new Error('SONAR_HOST_URL, SONAR_TOKEN and output directory are required.');

async function get(path, params = {}) {
  const url = new URL(path, base);
  url.search = new URLSearchParams(params);
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(path + ' returned HTTP ' + response.status);
  return response.json();
}

await mkdir(output, { recursive: true });
const save = async (name, content) =>
  writeFile(join(output, name + '.json'), JSON.stringify(content, null, 2) + '\n');

const taskReport = await readFile('.scannerwork/report-task.txt', 'utf8');
const taskId = taskReport.match(/^ceTaskId=(.+)$/m)?.[1].trim();
if (!taskId) throw new Error('Scanner task ID is missing.');

let task;
for (let attempt = 0; attempt < 60; attempt++) {
  ({ task } = await get('/api/ce/task', { id: taskId }));
  if (['SUCCESS', 'FAILED', 'CANCELED'].includes(task.status)) break;
  await delay(2000);
}
if (task.status !== 'SUCCESS') throw new Error('Sonar compute task ended in ' + task.status);
await save('compute-task', task);

const keys = 'ncloc,coverage,line_coverage,lines_to_cover,uncovered_lines,branch_coverage,conditions_to_cover,uncovered_conditions,code_smells,sqale_index,bugs,vulnerabilities,duplicated_lines_density,sqale_rating';
const measures = await get('/api/measures/component', { component: project, metricKeys: keys });
await save('measures', measures);
await save('quality-gate', await get('/api/qualitygates/project_status', { analysisId: task.analysisId }));

const issues = [];
for (let page = 1; ; page++) {
  const response = await get('/api/issues/search', { componentKeys: project, p: page, ps: 100 });
  issues.push(...response.issues);
  if (issues.length >= response.paging.total || !response.issues.length) break;
}
await save('issues', issues);
await save('server-status', await get('/api/system/status'));
console.log(measures.component.measures);
