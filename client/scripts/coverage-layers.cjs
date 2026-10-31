// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { Report } = require('c8');
const { createCoverageMap } = require('istanbul-lib-coverage');

const root = path.resolve(__dirname, '..');
const config = require('../.c8rc.json');
const metrics = ['lines', 'branches', 'functions'];
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function layerFor(file) {
  const relative = path.relative(path.join(root, 'src'), file).split(path.sep).join('/');
  if (relative.startsWith('../') || path.isAbsolute(relative)) {
    throw new Error(`Coverage outside src: ${file}`);
  }
  if (relative.startsWith('data/')) return 'Data';
  if (relative.startsWith('providers/') || /\/hooks\//.test(relative)
      || /(?:Provider|Context)\.tsx?$/.test(relative)) return 'Hooks and Providers';
  if (relative.startsWith('app/') || relative.startsWith('components/')
      || /\/(screens|components)\//.test(relative)) return 'UI and routes';
  if (relative.startsWith('util/')) return 'Utilities';
  if (relative.startsWith('rules/') || /\/rules\.tsx?$/.test(relative)
      || ['features/onboarding/draftSaveGate.ts', 'features/onboarding/navigation.ts'].includes(relative)) return 'Rules';
  throw new Error(`Unclassified coverage source: ${relative}; update layerFor before generating the report`);
}

function aggregate(map) {
  const groups = new Map();
  for (const file of map.files()) {
    const name = layerFor(file);
    if (!groups.has(name)) groups.set(name, createCoverageMap({}));
    groups.get(name).addFileCoverage(map.fileCoverageFor(file));
  }
  const rows = [...groups].map(([name, group]) => ({
    name, files: group.files().length, summary: group.getCoverageSummary().toJSON(),
  }));
  const total = map.getCoverageSummary().toJSON();
  for (const metric of metrics) {
    for (const count of ['covered', 'total']) {
      if (rows.reduce((sum, row) => sum + row.summary[metric][count], 0) !== total[metric][count]) {
        throw new Error(`Layer total mismatch: ${metric}.${count}`);
      }
    }
  }
  return [...rows, { name: 'Total', files: map.files().length, summary: total }];
}

async function runTests(args, temporary, logPath, header) {
  const log = fs.createWriteStream(logPath);
  log.write(header);
  let output = '';
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: { ...process.env, NODE_V8_COVERAGE: temporary },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const forward = (data, stream) => { log.write(data); stream.write(data); };
  child.stdout.on('data', data => { output += data.toString(); forward(data, process.stdout); });
  child.stderr.on('data', data => forward(data, process.stderr));
  try {
    const exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    });
    return { output, exitCode };
  } finally {
    await new Promise((resolve, reject) => {
      log.once('error', reject);
      log.end(resolve);
    });
  }
}

function render(rows, run, metadata) {
  const counts = ['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map(name => {
    const match = run.output.match(new RegExp(`^# ${name} (\\d+)\\s*$`, 'm'));
    return `<dt>${name}</dt><dd>${match ? match[1] : 'Unavailable'}</dd>`;
  }).join('');
  const table = rows.map(row => `<tr><th scope="row">${escapeHtml(row.name)}</th><td>${row.files}</td>${metrics.map(metric => {
    const value = row.summary[metric];
    return `<td>${value.total ? `${value.pct}%` : 'N/A'}<small>${value.covered} / ${value.total}</small></td>`;
  }).join('')}</tr>`).join('');
  const notes = run.output.split('\n').filter(line => /^\s*not ok\b|^\s*ok\b.*# (?:SKIP|TODO)\b/i.test(line));
  return `<!doctype html>
<!-- AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Frontend test coverage</title><style>
body{font:16px/1.5 system-ui,sans-serif;color:#172033;max-width:1100px;margin:32px auto;padding:0 24px}
h1{margin-bottom:4px}h2{margin-top:28px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e0e8;padding:10px 14px;text-align:right}th:first-child{text-align:left}thead{background:#eff3f8}small{display:block;color:#526074}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f8;padding:16px}dl{display:grid;grid-template-columns:130px 1fr;gap:4px}dd{margin:0}code{overflow-wrap:anywhere}.status{font-weight:700}
</style></head><body><h1>Frontend test coverage</h1>
<p>All client tests, including tests in the tests/ root. Counts show covered / total.</p>
<p class="status">Test process: ${run.exitCode === 0 ? 'PASSED' : 'FAILED'} (exit ${run.exitCode})</p>
<h2>Run information</h2><pre>${escapeHtml(metadata)}</pre>
<h2>Coverage by architectural layer</h2>
<table><thead><tr><th>Layer</th><th>Files</th><th>Lines</th><th>Branches</th><th>Functions</th></tr></thead><tbody>${table}</tbody></table>
<h2>How to read Branches</h2>
<p>Branches measures the share of recorded code paths that ran. c8 derives these entries from V8 execution ranges, rather than assigning exactly two entries to each <code>if</code>.</p>
<pre><code>function label(name?: string) {
  return name ?? 'Anonymous';
}

label('Minsu');   // Uses the supplied name.
label(undefined); // Uses the fallback.</code></pre>
<p>This example has no <code>if</code>, but the two calls exercise different behavior: using a supplied name or evaluating the fallback. Expressions such as <code>??</code>, <code>&amp;&amp;</code>, and the conditional operator can also introduce conditional execution.</p>
<p>The Branches denominator is the number of entries produced from the recorded ranges, not twice the number of <code>if</code> statements. The example illustrates the paths to exercise; it does not prescribe an exact number of entries in the report.</p>
<h2>Test results</h2><dl>${counts}</dl>
<p><a href="tests.log">Full test output, including failures and skips</a></p>
<pre>${escapeHtml(notes.join('\n') || 'No failed or skipped test entries reported.')}</pre>
<p>Failure and skip reasons appear in the log when supplied by the tests. Investigation and justification are recorded in the iteration results.</p>
</body></html>\n`;
}

async function main() {
  process.chdir(root);
  const directory = path.resolve(root, config['reports-dir']);
  if (directory !== path.join(root, 'coverage')) throw new Error('reports-dir must be coverage');
  // Only generated files under the dedicated coverage directory are replaced.
  fs.mkdirSync(directory, { recursive: true });
  for (const name of ['unit', 'integration', 'combined', 'tmp', 'layers.json', 'coverage-final.json',
    'coverage-summary.json', 'layers.html', 'tests.log']) {
    fs.rmSync(path.join(directory, name), { recursive: true, force: true });
  }
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'client-c8-'));
  const args = ['--test', '--test-reporter=tap', 'tests/*.test.cjs', 'tests/unit/*.test.cjs', 'tests/integration/*.test.cjs'];
  const metadata = [
    `Date (Asia/Seoul): ${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })}`,
    `Commit: ${git('rev-parse', 'HEAD')}`,
    `Working tree: ${git('status', '--porcelain') ? 'modified (commit alone does not reproduce this run)' : 'clean'}`,
    `Node: ${process.version}; c8: ${require('c8/package.json').version}; TypeScript: ${require('typescript/package.json').version}`,
    `Command: npm run test:coverage`,
    `Test command: node ${args.join(' ')}`,
    `API_URL: ${process.env.API_URL || '(unset; live API test probes localhost:8000)'}`,
    `EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || '(unset)'}`,
  ].join('\n');
  try {
    const run = await runTests(args, temporary, path.join(directory, 'tests.log'), `${metadata}\n\n`);
    const report = Report({
      ...config,
      excludeAfterRemap: config['exclude-after-remap'],
      reportsDirectory: directory,
      tempDirectory: temporary,
      resolve: root,
      excludeNodeModules: true,
    });
    const map = await report.getCoverageMapFromAllCoverageFiles();
    if (!map.files().length) throw new Error('No source coverage was collected');
    const rows = aggregate(map);
    fs.writeFileSync(path.join(directory, 'layers.html'), render(rows, run, metadata));
    for (const row of rows) {
      console.log(`${row.name}: ${metrics.map(metric => `${metric} ${row.summary[metric].pct}%`).join(', ')}`);
    }
    console.log('Reports: coverage/layers.html, coverage/tests.log');
    process.exitCode = run.exitCode;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
