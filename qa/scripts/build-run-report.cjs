const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(root, 'qa', 'reports');
const requestedExecutionId = process.argv[2];
const latestRun = fs.readdirSync(reportsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(reportsRoot, entry.name, 'raw.json')))
  .filter((entry) => {
    const stats = JSON.parse(fs.readFileSync(path.join(reportsRoot, entry.name, 'raw.json'), 'utf8')).stats;
    return stats.expected + stats.unexpected > 0;
  })
  .map((entry) => ({ id: entry.name, mtime: fs.statSync(path.join(reportsRoot, entry.name, 'raw.json')).mtimeMs }))
  .sort((left, right) => right.mtime - left.mtime)[0];
const executionId = requestedExecutionId || latestRun?.id;
if (!executionId) throw new Error('Nenhuma execução com raw.json foi encontrada em qa/reports/.');
const runDir = path.resolve(reportsRoot, executionId);
if (path.dirname(runDir) !== reportsRoot) throw new Error('executionId deve identificar somente uma pasta dentro de qa/reports/.');
const raw = JSON.parse(fs.readFileSync(path.join(runDir, 'raw.json'), 'utf8').replace(/^\uFEFF/, ''));
if (raw.stats.expected + raw.stats.unexpected === 0) throw new Error('Esse raw.json não contém testes efetivamente executados.');
const complementaryPath = path.join(root, 'docs', 'testes', 'cenarios-complementares.md');
const initialPath = path.join(root, 'docs', 'testes', 'cenarios-iniciais.md');
const complementaryText = fs.readFileSync(complementaryPath, 'utf8');
const initialText = fs.readFileSync(initialPath, 'utf8');
const baselineText = fs.readFileSync(path.join(root, 'docs', 'testes', 'criterios-padrao-execucao.md'), 'utf8');
const reportStart = new Date(raw.stats.startTime).toISOString();
const reportEnd = new Date(new Date(raw.stats.startTime).getTime() + raw.stats.duration).toISOString();
fs.writeFileSync(path.join(runDir, 'started-at.txt'), reportStart + '\n', 'utf8');
fs.writeFileSync(path.join(runDir, 'finished-at.txt'), reportEnd + '\n', 'utf8');
const metadata = fs.readFileSync(path.join(runDir, 'execution-metadata.txt'), 'utf8');
const baseUrl = (metadata.match(/^base_url=(.+)$/m) || [])[1] || 'NÃO DISPONÍVEL';
const targetLabel = (metadata.match(/^target=(.+)$/m) || [])[1] || 'NÃO DISPONÍVEL';
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const evidenceDir = path.join(runDir, 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

function parseCell(line) {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}
function cleanTemplate(value) {
  return (value || '').split('<br><br>Testes passaram conforme o resultado esperado')[0].trim();
}
const scenarioDocs = new Map();
for (const line of complementaryText.split(/\r?\n/)) {
  if (!/^\|\s*CT-\d+/.test(line)) continue;
  const cells = parseCell(line);
  const id = (cells[0].match(/CT-\d+/) || [])[0];
  if (id) scenarioDocs.set(id, { actions: cells[2], priority: cells[3], severity: cells[4], type: cells[5], expected: cleanTemplate(cells[7]), description: cells[9] });
}
for (const line of baselineText.split(/\r?\n/)) {
  if (!/^\| CT-\d+ \|/.test(line)) continue;
  const cells = parseCell(line);
  const id = (cells[0].match(/CT-\d+/) || [])[0];
  if (id && scenarioDocs.has(id)) scenarioDocs.get(id).expected = cells[1];
}
for (const section of initialText.split(/(?=^## CT-\d+)/m)) {
  const id = (section.match(/^## (CT-\d+)/m) || [])[1];
  if (!id) continue;
  const actions = (section.match(/^- \*\*Passos:\*\*\s*\n([\s\S]*?)(?=\n- \*\*|\n## |$)/m) || [])[1] || '';
  const expectedMatches = [...section.matchAll(/^- \*\*Resultado esperado[^:]*:\*\*\s*([\s\S]*?)(?=\n- \*\*|\n## |$)/gm)];
  scenarioDocs.set(id, { actions: actions.trim(), expected: expectedMatches.map((match) => match[1].trim()).join('\n\n') });
}

const cases = [];
function visitSuite(suite, pointer) {
  for (let specIndex = 0; specIndex < (suite.specs || []).length; specIndex += 1) {
    const spec = suite.specs[specIndex];
    for (let testIndex = 0; testIndex < (spec.tests || []).length; testIndex += 1) {
      const test = spec.tests[testIndex];
      const result = (test.results || []).at(-1) || {};
      const id = (spec.title.match(/CT-\d+/) || [])[0];
      if (!id) continue;
      const passed = result.status === 'passed' && test.status === 'expected';
      const pending = test.status === 'skipped' || result.status === 'skipped';
      const verdict = passed ? 'PASSOU' : pending ? 'PENDENTE' : 'FALHOU';
      const screenshot = (result.attachments || []).find((attachment) => attachment.contentType === 'image/png' && attachment.path);
      const sourceScreenshot = screenshot ? path.relative(runDir, screenshot.path).split(path.sep).join('/') : null;
      const noteAttachments = (result.attachments || []).filter((attachment) => attachment.name !== 'screenshot').map((attachment) => ({ name: attachment.name, path: attachment.path ? path.relative(runDir, attachment.path).split(path.sep).join('/') : null }));
      const annotation = (test.annotations || []).find((item) => item.type === 'fixme');
      const details = scenarioDocs.get(id) || {};
      const idNumber = Number(id.slice(3));
      const cardHtml = `evidence/${id}.html`;
      const cardJpeg = `evidence/${id}.jpg`;
      const rawPointer = `${pointer}/specs/${specIndex}/tests/${testIndex}`;
      const durationMs = result.duration ?? null;
      const actions = details.actions || `Consultar o caso automatizado em ${spec.file}:${spec.line}.`;
      const expected = details.expected || `Critério verificável definido pelas assertions do caso em ${spec.file}:${spec.line}.`;
      const failureDetails = (result.errors || []).map((error) => (error.message || '').split('\n').find((line) => line.trim() && !/^\s*at /.test(line))?.trim().replace(/\u001b\[[0-9;]*m/g, '')).filter(Boolean);
      const actual = passed
        ? `Todas as assertions do caso foram satisfeitas. Playwright Test registrou status passed em ${durationMs} ms, sem retry.`
        : pending
          ? `Não executado. ${annotation?.description || 'O caso está marcado como test.fixme por depender de critério ainda pendente.'}`
          : `Falhou: ${failureDetails.join(' | ') || `Playwright registrou status ${result.status || test.status}`}.`;
      const assertionsSummary = passed
        ? `Executadas conforme ${spec.file}:${spec.line}; o reporter confirma status passed. O JSON bruto não discrimina o resultado assertion por assertion.`
        : pending
          ? 'Nenhuma assertion funcional foi executada; o caso foi pulado por test.fixme.'
          : `${failureDetails.length} mensagem(ns) de falha do runner estão disponíveis em ${rawPointer} no arquivo raw.json.`;
      const source = { file: `tests/${spec.file}`, line: spec.line };
      const screenshotExists = sourceScreenshot && fs.existsSync(path.join(runDir, sourceScreenshot));
      const statusClass = verdict === 'PASSOU' ? 'passed' : verdict === 'PENDENTE' ? 'pending' : 'failed';
      const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
      const formatted = (value) => escape(value).replaceAll('\r\n', '\n').replaceAll('\n', '<br>').replaceAll('&lt;br&gt;', '<br>');
      const appScreenshotHtml = screenshotExists
        ? `<figure><img alt="Screenshot original gerado durante a execução do cenário" src="../${escape(sourceScreenshot)}"><figcaption>Screenshot original do teste (PNG anexado pelo runner). A captura JPEG deste card mantém o registro original sem edição.</figcaption></figure>`
        : pending
          ? '<p class="notice">Screenshot da interface não disponível: o cenário não foi executado.</p>'
          : '<p class="notice">Captura da interface não aplicável: validação estrutural de dados locais, sem página de navegador.</p>';
      const annotationHtml = annotation ? `<p class="notice">Bloqueio registrado pelo teste: ${formatted(annotation.description)}</p>` : '';
      const cardHtmlText = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(id)} — ${escape(spec.title)}</title>
<style>
:root{color-scheme:dark;--canvas:#161616;--card:#262626;--surface:#393939;--text:#f4f4f4;--muted:#c6c6c6;--border:#525252;--blue:#0f62fe;--green:#42be65;--yellow:#f1c21b;--red:#fa4d56}*{box-sizing:border-box}body{margin:0;padding:32px;background:var(--canvas);color:var(--text);font:16px/1.5 Arial,Helvetica,sans-serif}#evidence-card{width:1080px;max-width:100%;margin:0 auto;background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden}.top{padding:28px 32px;background:var(--surface);border-bottom:1px solid var(--border)}.eyebrow{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.title{margin:8px 0 16px;font-size:25px}.verdict{display:inline-block;padding:7px 14px;border:2px solid currentColor;border-radius:6px;font-size:21px;font-weight:700}.passed .verdict{color:var(--green)}.pending .verdict{color:var(--yellow)}.failed .verdict{color:var(--red)}main{padding:28px 32px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.field{padding:16px;background:#202020;border:1px solid var(--border);border-radius:6px;overflow-wrap:anywhere}.field h2{margin:0 0 8px;color:#78a9ff;font-size:15px}.field p{margin:0}.wide{grid-column:1/-1}.muted{color:var(--muted)}.notice{padding:12px 14px;background:#393939;border-left:4px solid var(--yellow);border-radius:3px}figure{margin:0}figure img{display:block;width:100%;height:auto;border:1px solid var(--border);border-radius:4px}figcaption{padding-top:8px;color:var(--muted);font-size:13px}.foot{padding:18px 32px;border-top:1px solid var(--border);color:var(--muted);font-size:13px}.foot a{color:#78a9ff}
</style></head><body><article id="evidence-card" class="${statusClass}"><header class="top"><div class="eyebrow">Menu On-Line · QA · ${escape(executionId)}</div><h1 class="title">${escape(id)} — ${escape(spec.title.replace(/^CT-\d+\s*:?\s*/, ''))}</h1><div class="verdict">${escape(verdict)}</div></header><main><div class="grid">
<section class="field"><h2>Funcionalidade</h2><p>${escape(details.description || spec.file)}</p></section><section class="field"><h2>Identificação da execução</h2><p>${escape(executionId)}<br>Chromium · ambiente local<br>Início: ${escape(reportStart)}</p></section>
<section class="field wide"><h2>Ações / passos relevantes</h2><p>${formatted(actions)}</p></section><section class="field wide"><h2>Resultado esperado</h2><p>${formatted(expected || 'Não disponível na evidência.')}</p></section>
<section class="field wide"><h2>Resultado obtido</h2><p>${formatted(actual)}</p>${annotationHtml}</section><section class="field wide"><h2>Assertions</h2><p>${formatted(assertionsSummary)}</p></section>
<section class="field wide"><h2>Screenshot da aplicação</h2>${appScreenshotHtml}</section>
</div></main><footer class="foot">Origem: <a href="../raw.json#${escape(rawPointer)}">raw.json ${escape(rawPointer)}</a> · Teste: ${escape(source.file)}:${escape(source.line)} · BASE_URL: ${escape(baseUrl)} · ${escape(pending ? 'Limitado por critério de aceite não aprovado.' : 'Relatório técnico da execução local; não representa validação em produção.')}</footer></article></body></html>`;
      fs.writeFileSync(path.join(runDir, cardHtml), cardHtmlText, 'utf8');
      cases.push({ id, number: idNumber, title: spec.title, verdict, status: test.status, playwrightStatus: result.status || null, durationMs, source, priority: details.priority || null, severity: details.severity || null, type: details.type || null, actions, expected, actual, assertionsSummary, annotation: annotation?.description || null, rawPointer, rawAttachments: noteAttachments, evidence: { sourceScreenshot: screenshotExists ? sourceScreenshot : null, sourceScreenshotFormat: screenshotExists ? 'PNG' : null, sourceScreenshotTool: screenshotExists ? 'Playwright Test runner' : null, cardHtml, cardJpeg, cardJpegTool: 'Playwright MCP', screenshotNote: screenshotExists ? 'PNG original da execução está embutido no card sem edição.' : pending ? 'Caso não executado; nenhuma captura de interface associada.' : 'Caso estático sem interface de navegador.' } });
    }
  }
  for (let childIndex = 0; childIndex < (suite.suites || []).length; childIndex += 1) visitSuite(suite.suites[childIndex], `${pointer}/suites/${childIndex}`);
}
for (let index = 0; index < (raw.suites || []).length; index += 1) visitSuite(raw.suites[index], `/suites/${index}`);
cases.sort((a, b) => a.number - b.number);
const counts = { total: cases.length, executed: cases.filter((item) => item.verdict !== 'PENDENTE').length, passed: cases.filter((item) => item.verdict === 'PASSOU').length, failed: cases.filter((item) => item.verdict === 'FALHOU').length, pending: cases.filter((item) => item.verdict === 'PENDENTE').length };
const report = { schemaVersion: '1.0', executionId, project: 'Menu On-Line', execution: { runner: 'Playwright Test CLI', command: 'npm test', browser: 'Chromium', baseUrl, target: targetLabel, gitHead, startedAt: reportStart, finishedAt: reportEnd, rawStartedAt: raw.stats.startTime, durationMs: raw.stats.duration, exitCode: counts.failed ? 1 : 0, mcpLimitation: 'A suíte completa foi executada pelo Playwright Test CLI. O Playwright MCP renderiza os cards HTML e captura o JPEG correspondente a cada cenário.' }, summary: counts, cases };
fs.writeFileSync(path.join(runDir, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
execFileSync(process.execPath, [path.join(__dirname, 'update-run-docs.cjs'), executionId], { cwd: root, stdio: 'inherit' });
const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const rows = cases.map((item) => {
  const jpegExists = fs.existsSync(path.join(runDir, item.evidence.cardJpeg));
  const jpegLink = jpegExists ? `<a href="${esc(item.evidence.cardJpeg)}">JPEG</a>` : '<span class="meta">JPEG aguarda captura via Playwright MCP</span>';
  return `<tr><td>${esc(item.id)}</td><td>${esc(item.title.replace(/^CT-\d+\s*:?\s*/, ''))}</td><td><strong class="${item.verdict === 'PASSOU' ? 'green' : item.verdict === 'PENDENTE' ? 'yellow' : 'red'}">${esc(item.verdict)}</strong></td><td>${item.durationMs == null ? '—' : `${item.durationMs} ms`}</td><td><a href="${esc(item.evidence.cardHtml)}">HTML</a> · ${jpegLink}</td></tr>`;
}).join('\n');
const allJpegsPresent = cases.every((item) => fs.existsSync(path.join(runDir, item.evidence.cardJpeg)));
const evidenceStatus = allJpegsPresent ? 'Cards HTML e JPEG disponíveis para todos os cenários.' : 'Os cards HTML estão prontos; faça e valide as capturas JPEG via Playwright MCP para concluir as evidências visuais.';
const dashboard = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório QA — ${esc(executionId)}</title><style>:root{color-scheme:dark;--canvas:#161616;--card:#262626;--surface:#393939;--text:#f4f4f4;--muted:#c6c6c6;--border:#525252;--blue:#0f62fe;--green:#42be65;--yellow:#f1c21b;--red:#fa4d56}*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--text);font:16px/1.5 Arial,Helvetica,sans-serif}main{max-width:1200px;margin:0 auto;padding:32px}.summary{display:flex;gap:16px;flex-wrap:wrap;margin:22px 0}.stat{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px 22px;min-width:150px}.stat b{display:block;font-size:26px}.stat span{color:var(--muted)}table{width:100%;border-collapse:collapse;background:var(--card)}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--border)}th{background:var(--surface)}a{color:#78a9ff}.green{color:var(--green)}.yellow{color:var(--yellow)}.red{color:var(--red)}.meta{color:var(--muted)}.banner{padding:18px 20px;background:#262626;border-left:4px solid var(--blue)}</style></head><body><main><h1>Execução completa — Menu On-Line</h1><p class="meta">${esc(executionId)} · Chromium · ${esc(baseUrl)} · ${esc(reportStart)} a ${esc(reportEnd)}</p><section class="summary"><div class="stat"><b>${counts.total}</b><span>cenários descobertos e executados</span></div><div class="stat"><b class="green">${counts.passed}</b><span>passaram</span></div><div class="stat"><b class="red">${counts.failed}</b><span>falharam</span></div><div class="stat"><b class="yellow">${counts.pending}</b><span>pendentes</span></div></section><p class="banner">Resultado: ${counts.total} cenários executados, ${counts.passed} passaram e ${counts.failed} falharam. ${evidenceStatus} Divergências detalhadas nos cards e no relatório nativo.</p><p><a href="playwright-report/index.html">Relatório HTML nativo do Playwright</a> · <a href="report.json">report.json</a> · <a href="raw.json">raw.json</a></p><table><thead><tr><th>ID</th><th>Cenário</th><th>Veredito</th><th>Duração</th><th>Card</th></tr></thead><tbody>${rows}</tbody></table></main></body></html>`;
fs.writeFileSync(path.join(runDir, 'report.html'), dashboard, 'utf8');
execFileSync(process.execPath, [path.join(__dirname, 'update-scenario-workbook.cjs'), executionId], { cwd: root, stdio: 'inherit' });
console.log(JSON.stringify({ executionId, counts, cardHtml: cases.length, cardJpegPresent: cases.filter((item) => fs.existsSync(path.join(runDir, item.evidence.cardJpeg))).length, cardJpegPendingCapture: cases.filter((item) => !fs.existsSync(path.join(runDir, item.evidence.cardJpeg))).length }, null, 2));
