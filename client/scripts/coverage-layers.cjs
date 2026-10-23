// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const fs = require('node:fs');
const { createCoverageMap } = require('istanbul-lib-coverage');
const results = {};
for (const kind of ['unit', 'integration', 'combined']) {
  const data = JSON.parse(fs.readFileSync(`coverage/${kind}/coverage-final.json`, 'utf8'));
  const groups = {};
  for (const [file, coverage] of Object.entries(data)) {
    const relative = file.split('/src/')[1];
    const group = relative.startsWith('data/') ? 'Data'
      : relative.startsWith('app/') || relative.startsWith('components/') || /\/(screens|components)\//.test(relative) ? 'UI and routes'
        : relative.startsWith('providers/') || /\/hooks\//.test(relative) || /Provider\.tsx$/.test(relative) ? 'Hooks and Providers'
          : 'Rules, utilities and other runtime modules';
    (groups[group] ??= createCoverageMap({})).addFileCoverage(coverage);
  }
  results[kind] = Object.fromEntries(Object.entries(groups).map(([name, map]) => [name, map.getCoverageSummary().toJSON()]));
}
fs.writeFileSync('coverage/layers.json', `${JSON.stringify(results, null, 2)}\n`);
for (const [name, metrics] of Object.entries(results.combined)) {
  console.log(`${name}: lines ${metrics.lines.pct}%, branches ${metrics.branches.pct}%, functions ${metrics.functions.pct}%`);
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const tables = Object.entries(results).map(([kind, layers]) => `
  <h2>${escapeHtml(kind === 'combined' ? 'Combined (Unit + Integration)' : kind === 'unit' ? 'Unit' : 'Integration')}</h2>
  <table><thead><tr><th>Layer</th><th>Lines</th><th>Branches</th><th>Functions</th></tr></thead><tbody>
  ${Object.entries(layers).map(([name, metrics]) => `<tr><td>${escapeHtml(name)}</td>${['lines', 'branches', 'functions'].map(metric => `<td><strong>${metrics[metric].pct}%</strong><small>${metrics[metric].covered} / ${metrics[metric].total}</small></td>`).join('')}</tr>`).join('')}
  </tbody></table>`).join('');
fs.writeFileSync('coverage/combined/layers.html', `<!doctype html>
<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->
<html lang="en"><meta charset="utf-8"><title>Frontend coverage by layer</title>
<style>body{font:16px system-ui,sans-serif;color:#172033;background:#fff;max-width:1050px;margin:36px auto;padding:0 24px}h1{font-size:28px;margin-bottom:8px}h2{font-size:20px;margin:28px 0 10px}p{color:#526074}table{border-collapse:collapse;width:100%}th,td{padding:12px 16px;border:1px solid #d9e0e8;text-align:right}th:first-child,td:first-child{text-align:left;width:52%}th{background:#eff3f8}small{display:block;color:#637087;font-size:12px;margin-top:4px}code{background:#eff3f8;padding:4px 8px}</style>
<h1>Frontend test coverage by layer</h1>
<p>Generated from c8 reports. Values show covered / total. Combined coverage runs both suites together.</p>
<p>Command: <code>node scripts/coverage-layers.cjs</code></p>
${tables}
<p>Includes unimported runtime source files. Layer definitions follow scripts/coverage-layers.cjs. Branch/function denominators may differ across runs because c8 uses synthetic entries for unloaded files.</p>
</html>`);
