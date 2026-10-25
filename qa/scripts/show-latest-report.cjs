const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(root, 'qa', 'reports');
const latest = fs.readdirSync(reportsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(reportsRoot, entry.name, 'playwright-report', 'index.html')))
  .filter((entry) => {
    const rawPath = path.join(reportsRoot, entry.name, 'raw.json');
    if (!fs.existsSync(rawPath)) return false;
    const stats = JSON.parse(fs.readFileSync(rawPath, 'utf8')).stats;
    return stats.expected + stats.unexpected > 0;
  })
  .map((entry) => ({ id: entry.name, mtime: fs.statSync(path.join(reportsRoot, entry.name, 'raw.json')).mtimeMs }))
  .sort((left, right) => right.mtime - left.mtime)[0];

if (!latest) {
  console.error('Nenhum relatório HTML do Playwright foi encontrado em qa/reports/. Execute npm test primeiro.');
  process.exit(1);
}

const cli = require.resolve('@playwright/test/cli');
const result = spawnSync(process.execPath, [cli, 'show-report', path.join(reportsRoot, latest.id, 'playwright-report')], {
  cwd: root,
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
