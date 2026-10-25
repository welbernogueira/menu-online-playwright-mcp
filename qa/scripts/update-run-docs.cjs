const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(root, 'qa', 'reports');
const runId = process.argv[2];
if (!runId) throw new Error('Informe executionId para atualizar a documentação.');
const runDir = path.resolve(reportsRoot, runId);
if (path.dirname(runDir) !== reportsRoot) throw new Error('executionId deve identificar somente uma pasta dentro de qa/reports/.');
const report = JSON.parse(fs.readFileSync(path.join(runDir, 'report.json'), 'utf8'));
const cases = new Map(report.cases.map((item) => [item.id, item]));
const finishedDate = report.execution.finishedAt.slice(0, 10).split('-').reverse().join('/');
const failedIds = report.cases.filter((item) => item.verdict === 'FALHOU').map((item) => item.id);
const esc = (value) => String(value ?? '').replaceAll('|', '/').replaceAll('\r\n', '<br>').replaceAll('\n', '<br>');

const matrixPath = path.join(root, 'docs', 'testes', 'cenarios-complementares.md');
let matrix = fs.readFileSync(matrixPath, 'utf8');
matrix = matrix.split(/\r?\n/).map((line) => {
  if (!/^\| CT-\d{3}\s+—/.test(line)) return line;
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  const id = (cells[0].match(/CT-\d{3}/) || [])[0];
  const item = cases.get(id);
  if (!item) return line;
  const base = `../../qa/reports/${runId}/evidence/${id}`;
  const screenshotNote = item.evidence.sourceScreenshot ? 'PNG original do runner incorporado no card.' : 'Verificação estática; screenshot da aplicação não aplicável.';
  cells[6] = item.verdict;
  cells[7] = esc(item.expected);
  cells[8] = esc(item.actual);
  cells[10] = `[Card HTML](${base}.html) · [JPEG](${base}.jpg) · ${screenshotNote}`;
  return `| ${cells.join(' | ')} |`;
}).join('\n');
const intro = `A execução completa mais recente, em ${finishedDate}, foi ${runId}; alvo ${report.execution.target}, Chromium, BASE_URL=${report.execution.baseUrl}. Os critérios para os antigos casos pendentes estão definidos como linha de base de QA em [critérios padrão de execução](criterios-padrao-execucao.md); as decisões de produto permanecem abertas. Resultado: ${report.summary.total} cenários executados, ${report.summary.passed} passaram, ${report.summary.failed} falharam e ${report.summary.pending} ficaram pendentes. Consulte [relatório visual](../../qa/reports/${runId}/report.html), [report.json](../../qa/reports/${runId}/report.json), [report.xlsx](../../qa/reports/${runId}/report.xlsx), [raw.json](../../qa/reports/${runId}/raw.json) e os cards em ../../qa/reports/${runId}/evidence/. Esta rodada local não valida a aplicação publicada. A execução histórica de 22/10 permanece preservada em \`qa/reports/2026-10-22-full-suite-local-05/\`.\n\nQuando a regra de produto depender das decisões de \`docs/auditoria/perguntas-pendentes.md\`, o veredito desta suíte se aplica somente à linha de base de QA; mantenha a decisão de produto como aberta e não apresente o resultado como aprovação comercial.`;
matrix = matrix.replace(/A execução completa mais recente,[\s\S]*?Após uma execução, os registros possíveis são:/,
  `${intro}\n\nApós uma execução, os registros possíveis são:`);
matrix = matrix.replace(/## Execução, cobertura e pendências[\s\S]*$/m,
  `## Execução, cobertura e pendências\n\n- Execução ${runId}: ${report.summary.total} cenários descobertos e executados; esta matriz contém CT-006 a CT-${String(report.summary.total).padStart(3, '0')}.\n- Resultado da matriz: ${report.cases.filter((item) => item.number >= 6 && item.verdict === 'PASSOU').length} passaram, ${report.cases.filter((item) => item.number >= 6 && item.verdict === 'FALHOU').length} falharam e ${report.cases.filter((item) => item.number >= 6 && item.verdict === 'PENDENTE').length} pendentes.\n- CTs reprovados: ${failedIds.join(', ') || 'nenhum'}. Consulte os cards e o relatório nativo para detalhes.\n- Cada cenário contém links para o card HTML e o JPEG; o screenshot original do runner fica incorporado no card quando existe interface.\n- A linha de base permite executar os cenários, mas não encerra decisões de produto em \`docs/auditoria/perguntas-pendentes.md\`.\n- A execução local não valida a aplicação publicada.`);
fs.writeFileSync(matrixPath, matrix, 'utf8');

const suitePath = path.join(root, 'docs', 'testes', 'suites-automatizadas.md');
let suite = fs.readFileSync(suitePath, 'utf8');
suite = suite.replace(/^\*\*Estado da execução[^\n]*$/m,
  `**Estado da execução (${runId}):** ${report.summary.total} cenários executados; ${report.summary.passed} passaram, ${report.summary.failed} falharam e ${report.summary.pending} ficaram pendentes. CTs reprovados: ${failedIds.join(', ') || 'nenhum'}. Veja [relatório completo](../../qa/reports/${runId}/report.html).`);
suite = suite.replace(/\*\*Resultado da execução mais recente:\*\*[\s\S]*?(?=\n\n## Ambiente e artefatos)/,
  `**Resultado da execução mais recente:** ${report.summary.total} cenários executados; ${report.summary.passed} passaram, ${report.summary.failed} falharam e ${report.summary.pending} ficaram pendentes. CTs reprovados: ${failedIds.join(', ') || 'nenhum'}. O veredito usa a linha de base de QA e não confirma decisões comerciais.`);
suite = suite.replace(/^As suítes de interface[^\n]*$/m,
  `As suítes de interface usam a cópia local de app/ por padrão: npm test inicia um servidor isolado em loopback e grava os artefatos em qa/reports/${runId}/. Um preview alternativo só é usado quando BASE_URL é informado explicitamente; o host de produção é bloqueado.`);
suite = suite.replace(/Artefatos:[\s\S]*$/m,
  `Artefatos: [relatório visual](../../qa/reports/${runId}/report.html), [report.json](../../qa/reports/${runId}/report.json), [raw.json](../../qa/reports/${runId}/raw.json), [report.xlsx](../../qa/reports/${runId}/report.xlsx), [relatório nativo do Playwright](../../qa/reports/${runId}/playwright-report/index.html) e cards em qa/reports/${runId}/evidence/.\n\nOs cenários aprovados, reprovados e pendentes constam no relatório; nenhum resultado é inferido por ausência de erro. A rodada local não confirma comportamento em produção.`);
fs.writeFileSync(suitePath, suite, 'utf8');

const initialPath = path.join(root, 'docs', 'testes', 'cenarios-iniciais.md');
let initial = fs.readFileSync(initialPath, 'utf8');
initial = initial.replace(/^\*\*Estado da execução:\*\*[^\n]*/m,
  `**Estado da execução:** última suíte completa ${runId}, com alvo ${report.execution.baseUrl} e Chromium. Os resultados dos CTs iniciais estão na tabela mais recente.`);
const initialRows = [1, 2, 3, 4, 5].map((number) => {
  const id = `CT-${String(number).padStart(3, '0')}`;
  const item = cases.get(id);
  return `| ${id} | ${item.verdict} | [Card HTML](../../qa/reports/${runId}/evidence/${id}.html) · [JPEG](../../qa/reports/${runId}/evidence/${id}.jpg) |`;
}).join('\n');
const latestInitial = `## Execução completa mais recente — ${finishedDate}\n\n| Cenário | Veredito | Evidência |\n|---|---|---|\n${initialRows}\n\nA execução completa teve ${report.summary.total} cenários: ${report.summary.passed} passaram, ${report.summary.failed} falharam e ${report.summary.pending} ficaram pendentes. Consulte o [relatório geral](../../qa/reports/${runId}/report.html). A execução local não valida produção.\n\n`;
initial = initial.replace(/## Execução completa mais recente[\s\S]*?(?=## Execução completa anterior)/, latestInitial);
fs.writeFileSync(initialPath, initial, 'utf8');

const questionsPath = path.join(root, 'docs', 'auditoria', 'perguntas-pendentes.md');
let questions = fs.readFileSync(questionsPath, 'utf8');
questions = questions.replace(/A execução local de \d{2}\/\d{2}\/\d{4} teve[\s\S]*?report\.html\)\./,
  `A execução local de ${finishedDate} teve ${report.summary.failed} divergências da linha de base, detalhadas no [relatório de evidências](../../qa/reports/${runId}/report.html).`);
fs.writeFileSync(questionsPath, questions, 'utf8');

const coveragePath = path.join(root, 'docs', 'auditoria', 'matriz-de-cobertura.md');
let coverage = fs.readFileSync(coveragePath, 'utf8');
coverage = coverage.replace(/^## Execução automatizada \([^\n]+\)$/m, `## Execução automatizada (${runId})`);
const coverageNote = `Em ${finishedDate}, a suíte local descobriu e executou ${report.summary.total} cenários: ${report.summary.passed} passaram, ${report.summary.failed} falharam e ${report.summary.pending} ficaram pendentes. A linha de base automatizável está em \`docs/testes/criterios-padrao-execucao.md\`. CTs reprovados: ${failedIds.join(', ') || 'nenhum'}. Resultados e evidências: [report.html](../../qa/reports/${runId}/report.html), [report.json](../../qa/reports/${runId}/report.json), [report.xlsx](../../qa/reports/${runId}/report.xlsx). A execução local não valida a versão publicada nem encerra decisões de negócio.`;
coverage = coverage.replace(/Em \d{2}\/\d{2}\/\d{4}, a suíte local descobriu[\s\S]*$/m, coverageNote);
fs.writeFileSync(coveragePath, coverage, 'utf8');

const regressionPath = path.join(root, 'tests', '11-integrated-regression', 'README.md');
let regression = fs.readFileSync(regressionPath, 'utf8');
regression = regression.replace(/A execução [^\n]+ descobriu os CTs[\s\S]*?\./,
  `A execução ${runId} descobriu e executou ${report.summary.total} cenários: ${report.summary.passed} passaram, ${report.summary.failed} falharam e ${report.summary.pending} ficaram pendentes. Os critérios estão em \`docs/testes/criterios-padrao-execucao.md\`; resultados em \`docs/testes/suites-automatizadas.md\`.`);
fs.writeFileSync(regressionPath, regression, 'utf8');

console.log(JSON.stringify({ runId, summary: report.summary, failedIds }, null, 2));
