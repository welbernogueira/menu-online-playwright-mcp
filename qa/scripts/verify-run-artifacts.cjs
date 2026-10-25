const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { readXlsxTable } = require('./lib/read-xlsx-table.cjs');

const root = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(root, 'qa', 'reports');
const executionId = process.argv[2];
if (!executionId) throw new Error('Uso: node qa/scripts/verify-run-artifacts.cjs <executionId>');
const runDir = path.resolve(reportsRoot, executionId);
if (path.dirname(runDir) !== reportsRoot) throw new Error('executionId deve identificar somente uma pasta dentro de qa/reports/.');
const report = JSON.parse(fs.readFileSync(path.join(runDir, 'report.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(runDir, 'raw.json'), 'utf8'));
const issues = [];
const counts = { passed: 0, failed: 0, pending: 0 };
const ids = new Set();

for (const item of report.cases) {
  if (ids.has(item.id)) issues.push(`ID duplicado: ${item.id}`);
  ids.add(item.id);
  if (item.verdict === 'PASSOU') counts.passed += 1;
  else if (item.verdict === 'FALHOU') counts.failed += 1;
  else counts.pending += 1;
  for (const relative of [item.evidence.cardHtml, item.evidence.cardJpeg]) {
    const target = path.join(runDir, relative);
    if (!fs.existsSync(target)) issues.push(`${item.id}: falta ${relative}`);
  }
  const jpeg = fs.readFileSync(path.join(runDir, item.evidence.cardJpeg));
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8 || jpeg[2] !== 0xff) issues.push(`${item.id}: assinatura JPEG inválida`);
  if (item.evidence.sourceScreenshot && !fs.existsSync(path.join(runDir, item.evidence.sourceScreenshot))) issues.push(`${item.id}: screenshot original ausente`);
}

if (report.summary.total !== report.cases.length || report.summary.passed !== counts.passed || report.summary.failed !== counts.failed || report.summary.pending !== counts.pending) issues.push('report.json contém totais inconsistentes');
if (report.summary.total !== raw.stats.expected + raw.stats.unexpected + raw.stats.skipped) issues.push('report.json e raw.json divergem nos totais');
for (const relative of ['report.html', 'playwright-report/index.html', 'report.xlsx', 'execution-metadata.txt']) {
  if (!fs.existsSync(path.join(runDir, relative))) issues.push(`Falta artefato ${relative}`);
}

const archive = process.platform === 'win32' ? 'tar.exe' : 'tar';
const list = execFileSync(archive, ['-tf', path.join(runDir, 'report.xlsx')], { encoding: 'utf8' });
if (!list.includes('[Content_Types].xml') || !list.includes('xl/worksheets/sheet1.xml')) issues.push('report.xlsx não é um pacote XLSX válido');
const sheet = execFileSync(archive, ['-xOf', path.join(runDir, 'report.xlsx'), 'xl/worksheets/sheet1.xml'], { encoding: 'utf8' });
try {
  const workbook = readXlsxTable(path.join(runDir, 'report.xlsx'));
  const expectedHeaders = ['Cenário', 'Pré-requisito', 'Passos', 'Prioridade', 'Severidade', 'Tipo', 'Veredito', 'Resultado Esperado', 'Resultado Obtido', 'Descrição', 'Evidências'];
  if (JSON.stringify(workbook.headers) !== JSON.stringify(expectedHeaders)) issues.push('report.xlsx diverge das 11 colunas obrigatórias');
  if (workbook.rows.length !== report.cases.length) issues.push(`report.xlsx possui ${workbook.rows.length} cenários; report.json possui ${report.cases.length}`);
  const workbookCases = new Map(workbook.rows.map((row) => {
    const id = (row.values[0].match(/CT-\d{3}/) || [])[0];
    return [id, row.values];
  }));
  for (const item of report.cases) {
    const row = workbookCases.get(item.id);
    if (!row) issues.push(`report.xlsx não contém ${item.id}`);
    else if (row[6] !== item.verdict) issues.push(`${item.id}: veredito no report.xlsx diverge do report.json`);
  }
  if ([...workbookCases.keys()].some((id) => !report.cases.some((item) => item.id === id))) issues.push('report.xlsx contém cenário que não pertence a report.json');
} catch (error) {
  issues.push(`Não foi possível validar as linhas do report.xlsx: ${error.message}`);
}

for (const relative of ['docs/testes/suites-automatizadas.md', 'docs/testes/cenarios-complementares.md', 'docs/testes/cenarios-iniciais.md']) {
  if (!fs.readFileSync(path.join(root, relative), 'utf8').includes(executionId)) issues.push(`${relative}: não aponta para a execução`);
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ executionId, total: report.summary.total, passed: counts.passed, failed: counts.failed, pending: counts.pending, evidenceCards: report.cases.length, jpegValid: report.cases.length, originalScreenshots: report.cases.filter((item) => item.evidence.sourceScreenshot).length, reportJson: true, rawJson: true, nativeHtml: true, workbook: true, documentationLinks: true }, null, 2));
}
