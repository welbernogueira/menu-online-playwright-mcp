#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { readXlsxTable } = require('./lib/read-xlsx-table.cjs');
const {
  EXPECTED_HEADERS,
  assertJiraTableMatchesSource,
  assertOfficialHeaders,
  escapeHtml,
  extractJiraTableValues,
  htmlText,
  renderJiraTable,
  splitRowsByRenderedTableSize,
} = require('./lib/jira-comment-table.cjs');
const { decodeUtf8Buffer, encodeUtf8Base64 } = require('./lib/jira-comment-encoding.cjs');
const { assertCompleteBlockPlan, assertScenarioMediaReferences } = require('./lib/jira-publication-blocks.cjs');

const projectRoot = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(projectRoot, 'qa', 'reports');
const expectedHeaders = EXPECTED_HEADERS;
const jiraCommentHardLimit = 32767;
const defaultCommentLimit = 24000;

function usage() {
  return [
    'Uso:',
    '  npm run qa:jira:prepare -- --preview-table --execution=<executionId>',
    '  npm run qa:jira:prepare -- --issue=QA-12 --issue-title="Título conferido no Jira" --execution=<executionId> [--dry-run]',
    '  npm run qa:jira:prepare -- --issue=QA-12 --issue-title="Título conferido no Jira" --execution=<executionId> --media-map=qa/reports/<executionId>/jira-publication/media-map.json [--media-mode=inline|link]',
    '  npm run qa:jira:prepare -- --execution=<executionId> --comment-base64=comment-01-of-03.html',
    '',
    'A prévia de tabela lê apenas o XLSX, valida cabeçalhos/células e grava HTML local; não acessa o Jira.',
    'O XLSX é a fonte da tabela e não é anexado. O primeiro modo prepara imagens e modelos pendentes.',
    'O segundo valida o mapeamento de mídia inline ou por link e produz comentários HTML prontos para revisão, sem publicar no Jira.',
    'O modo --comment-base64 valida um bloco pronto e o emite em Base64 ASCII, preservando UTF-8 ao transferi-lo pelo terminal para o Atlassian MCP.',
  ].join('\n');
}

function parseArgs(argv) {
  const parsed = { dryRun: false, previewTable: false, maxCommentChars: defaultCommentLimit, mediaMode: 'inline' };
  for (const arg of argv) {
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--preview-table') {
      parsed.previewTable = true;
      continue;
    }
    const match = arg.match(/^--(issue|issue-title|execution|media-map|media-mode|max-comment-chars|comment-base64)=(.*)$/s);
    if (!match) throw new Error(`Argumento não reconhecido: ${arg}\n\n${usage()}`);
    const key = {
      'issue-title': 'issueTitle',
      'media-map': 'mediaMap',
      'media-mode': 'mediaMode',
      'max-comment-chars': 'maxCommentChars',
      'comment-base64': 'commentBase64',
    }[match[1]] || match[1];
    parsed[key] = match[2];
  }
  if (typeof parsed.maxCommentChars === 'string') parsed.maxCommentChars = Number(parsed.maxCommentChars);
  return parsed;
}

function assertInside(parent, candidate, label) {
  const base = path.resolve(parent);
  const resolved = path.resolve(candidate);
  const relative = path.relative(base, resolved);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} precisa ficar dentro de ${base}.`);
  }
  return resolved;
}

function readRequiredJson(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`Arquivo ausente (${label}): ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`JSON inválido (${label}): ${error.message}`);
  }
}

function verifyFile(filePath, label, signature) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Arquivo ausente (${label}): ${filePath}`);
  }
  if (signature) {
    const handle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(signature.length);
    const bytesRead = fs.readSync(handle, buffer, 0, buffer.length, 0);
    fs.closeSync(handle);
    if (bytesRead !== signature.length || !buffer.equals(signature)) {
      throw new Error(`Assinatura inválida para ${label}: ${filePath}`);
    }
  }
}

function verdictBucket(verdict) {
  switch (String(verdict).trim().toUpperCase()) {
    case 'PASSOU': return 'passed';
    case 'FALHOU':
    case 'NÃO PASSOU':
    case 'NAO PASSOU': return 'failed';
    case 'IMPEDIDO': return 'blocked';
    case 'INCONCLUSIVO': return 'inconclusive';
    case 'PENDENTE': return 'pending';
    default: throw new Error(`Veredito não reconhecido: ${verdict}`);
  }
}

function scenarioId(value, rowNumber) {
  const matches = [...String(value ?? '').matchAll(/CT-\d{3}/g)];
  if (matches.length !== 1) throw new Error(`A linha ${rowNumber} da planilha deve conter exatamente um ID CT-xxx na coluna Cenário.`);
  return matches[0][0];
}

function readExecutionTable(workbookPath, report, runDir) {
  verifyFile(workbookPath, 'report.xlsx da execução', Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const workbook = readXlsxTable(workbookPath);
  if (JSON.stringify(workbook.headers) !== JSON.stringify(expectedHeaders)) {
    throw new Error(`Cabeçalhos do XLSX divergentes. Esperado: ${expectedHeaders.join(' | ')}; encontrado: ${workbook.headers.join(' | ')}.`);
  }
  if (!Array.isArray(report.cases) || !report.cases.length) throw new Error('report.json não contém cenários.');

  const reportById = new Map();
  for (const testCase of report.cases) {
    if (!testCase.id || reportById.has(testCase.id)) throw new Error(`ID vazio ou duplicado em report.json: ${testCase.id}`);
    reportById.set(testCase.id, testCase);
  }

  const seenIds = new Set();
  const rows = workbook.rows.map((row) => {
    if (row.extraValues.length) throw new Error(`A linha ${row.rowNumber} possui valores além das 11 colunas obrigatórias.`);
    const id = scenarioId(row.values[0], row.rowNumber);
    if (seenIds.has(id)) throw new Error(`ID duplicado na planilha: ${id}`);
    seenIds.add(id);
    const testCase = reportById.get(id);
    if (!testCase) throw new Error(`${id} aparece na planilha, mas não pertence à execução ${report.executionId}.`);
    if (row.values[6] !== testCase.verdict) throw new Error(`${id}: o veredito da planilha diverge de report.json.`);

    const relativeJpeg = testCase.evidence?.cardJpeg;
    let sourceJpeg = null;
    if (relativeJpeg) {
      sourceJpeg = assertInside(runDir, path.join(runDir, relativeJpeg), `JPEG de ${id}`);
      verifyFile(sourceJpeg, `JPEG de ${id}`, Buffer.from([0xff, 0xd8, 0xff]));
    } else if (/\b(jpeg|screenshot|captura)\b/i.test(row.values[10])) {
      throw new Error(`${id}: a planilha referencia uma captura, mas report.json não aponta para um JPEG desta execução.`);
    }

    return {
      id,
      rowNumber: row.rowNumber,
      values: row.values,
      sourceJpeg,
      attachmentName: sourceJpeg ? `${report.executionId}-${id}.jpg` : null,
    };
  });

  const missingRows = [...reportById.keys()].filter((id) => !seenIds.has(id));
  if (missingRows.length) {
    throw new Error(`report.xlsx está incompleto para esta execução. Linhas ausentes: ${missingRows.join(', ')}. Regenere o relatório pela rotina QA antes da publicação.`);
  }
  if (rows.length !== report.cases.length) throw new Error('Quantidade de linhas da planilha diverge dos cenários executados.');

  const summary = { total: rows.length, executed: 0, passed: 0, failed: 0, blocked: 0, inconclusive: 0, pending: 0 };
  for (const row of rows) {
    const bucket = verdictBucket(row.values[6]);
    summary[bucket] += 1;
    if (bucket !== 'pending') summary.executed += 1;
  }
  for (const key of ['total', 'passed', 'failed', 'pending']) {
    if (Number(report.summary?.[key]) !== summary[key]) {
      throw new Error(`Contagem ${key} inconsistente: report.json=${report.summary?.[key]}, planilha=${summary[key]}.`);
    }
  }
  if (report.summary.executed !== undefined && Number(report.summary.executed) !== summary.executed) {
    throw new Error(`Contagem executed inconsistente: report.json=${report.summary.executed}, planilha=${summary.executed}.`);
  }
  return { workbook, rows, summary };
}

function readMediaMap(filePath, issue, executionId, rows, expectedMode) {
  const mediaMap = readRequiredJson(filePath, 'media-map.json');
  if (mediaMap.schemaVersion !== '1.0' || mediaMap.issueKey !== issue || mediaMap.executionId !== executionId) {
    throw new Error('media-map.json precisa identificar esta issue e esta execução no schemaVersion 1.0.');
  }
  if (!['inline', 'link'].includes(mediaMap.mode) || mediaMap.mode !== expectedMode) {
    throw new Error(`media-map.json deve usar mode=${expectedMode}.`);
  }
  if (!Array.isArray(mediaMap.media)) throw new Error('media-map.json precisa conter o array media.');

  const expected = new Map(rows.filter((row) => row.sourceJpeg).map((row) => [row.id, row.attachmentName]));
  const found = new Map();
  const references = new Set();
  for (const item of mediaMap.media) {
    if (!item || typeof item.scenarioId !== 'string' || typeof item.fileName !== 'string') {
      throw new Error('Cada item media precisa ter scenarioId e fileName retornados pelo upload oficial.');
    }
    if (!expected.has(item.scenarioId)) throw new Error(`Mídia sem cenário JPEG correspondente: ${item.scenarioId}.`);
    if (found.has(item.scenarioId)) throw new Error(`Mais de uma mídia foi mapeada para ${item.scenarioId}.`);
    if (item.fileName !== expected.get(item.scenarioId)) throw new Error(`${item.scenarioId}: fileName retornado não corresponde à imagem preparada para a execução.`);

    if (expectedMode === 'inline') {
      if (typeof item.fileId !== 'string' || typeof item.collection !== 'string' || !item.fileId.trim() || !item.collection.trim() || /[\r\n\u0000]/.test(item.fileId + item.collection)) {
        throw new Error(`${item.scenarioId}: fileId ou collection inválido para mídia inline.`);
      }
      if (references.has(item.fileId)) throw new Error(`fileId duplicado na mídia: ${item.fileId}`);
      references.add(item.fileId);
    } else {
      if (!['string', 'number'].includes(typeof item.attachmentId) || (typeof item.attachmentId === 'number' && !Number.isSafeInteger(item.attachmentId))) {
        throw new Error(`${item.scenarioId}: attachmentId deve ser o identificador retornado pelo Jira.`);
      }
      const attachmentId = String(item.attachmentId ?? '');
      if (!attachmentId.trim() || /[\r\n\u0000]/.test(attachmentId)) {
        throw new Error(`${item.scenarioId}: attachmentId inválido para link de evidência.`);
      }
      let directUrl;
      try { directUrl = new URL(item.url); } catch { throw new Error(`${item.scenarioId}: informe a URL content retornada pelos metadados oficiais do anexo.`); }
      if (directUrl.protocol !== 'https:' || directUrl.username || directUrl.password || directUrl.search || directUrl.hash) {
        throw new Error(`${item.scenarioId}: o link deve ser uma URL HTTPS direta de anexo, sem credenciais, query string ou expiração.`);
      }
      if (references.has(attachmentId)) throw new Error(`attachmentId duplicado na mídia: ${attachmentId}`);
      references.add(attachmentId);
    }
    found.set(item.scenarioId, item);
  }
  const missing = [...expected.keys()].filter((id) => !found.has(id));
  if (missing.length) throw new Error(`Mídias ausentes para: ${missing.join(', ')}.`);
  if (found.size !== expected.size) throw new Error('A quantidade de mídias não corresponde às imagens da planilha.');
  assertScenarioMediaReferences([...expected.keys()], [...found.values()]);
  return found;
}

function mediaFigure(row, media, estimate = false, mediaMode = 'inline') {
  const source = media || (estimate
    ? mediaMode === 'link'
      ? { url: `https://jira.example.invalid/${'x'.repeat(512)}` }
      : { fileId: 'x'.repeat(256), collection: 'x'.repeat(256) }
    : null);
  if (!source) return `<p>[UPLOAD INLINE PENDENTE: ${escapeHtml(row.id)}]</p>`;
  if (mediaMode === 'link') {
    const href = escapeHtml(source.url);
    return `<p><a href="${href}">Abrir imagem real — ${escapeHtml(row.id)}</a></p><p>${htmlText(row.values[10])}</p>`;
  }
  const fileId = escapeHtml(source.fileId);
  const collection = escapeHtml(source.collection);
  const alt = escapeHtml(row.attachmentName);
  const workbookValue = row.values[10] ? `<figcaption>${htmlText(row.values[10])}</figcaption>` : '';
  return `<figure data-type="media-single" data-layout="center" data-width="60" data-width-type="percentage"><div data-type="media" data-media-type="file" data-id="${fileId}" data-collection="${collection}" data-alt="${alt}"></div>${workbookValue}</figure>`;
}

function buildCommentHtml({ issue, issueTitle, executionId, report, summary, rows, mediaByCase, blockIndex, blockCount, estimateMedia = false, mediaMode = 'inline' }) {
  const execution = report.execution || {};
  const heading = blockCount > 1 ? ` — bloco ${blockIndex}/${blockCount}` : '';
  const firstBlockSummary = blockIndex === 1
    ? `<h2>Resumo</h2><p>Executados: <strong>${summary.executed}</strong> de <strong>${summary.total}</strong>; passaram: <strong>${summary.passed}</strong>; falharam: <strong>${summary.failed}</strong>; impedidos: <strong>${summary.blocked}</strong>; inconclusivos: <strong>${summary.inconclusive}</strong>; pendentes: <strong>${summary.pending}</strong>.</p>`
    : '';
  const metadata = [
    `<p><strong>Card Jira:</strong> ${htmlText(issue)} — ${htmlText(issueTitle)}</p>`,
    `<p><strong>Execução:</strong> <code>${htmlText(executionId)}</code>${blockCount > 1 ? ` — <strong>bloco:</strong> ${blockIndex} de ${blockCount}` : ''}</p>`,
    `<p><strong>Data/hora de início (UTC):</strong> ${htmlText(execution.startedAt || 'Não disponível na evidência')}</p>`,
    `<p><strong>Ferramentas:</strong> ${htmlText(execution.runner || 'Playwright Test CLI')}; Playwright MCP para renderização e captura das evidências.</p>`,
    `<p><strong>Navegador:</strong> ${htmlText(execution.browser || 'Não disponível na evidência')}</p>`,
    `<p><strong>Alvo:</strong> ${htmlText(execution.target || 'Não identificado')} — <code>${htmlText(execution.baseUrl || 'Não disponível na evidência')}</code></p>`,
  ].join('');
  const mediaNotice = mediaMode === 'link'
    ? '<p><strong>Limitação de renderização:</strong> o comentário não aceitou a imagem inline; cada célula Evidências contém um link direto para o screenshot real anexado.</p>'
    : '';
  const table = renderJiraTable(expectedHeaders, rows.map((row) => row.values), (value, rowIndex, columnIndex) => {
    const row = rows[rowIndex];
    if (columnIndex === 10 && row.sourceJpeg) return mediaFigure(row, mediaByCase?.get(row.id), estimateMedia, mediaMode);
    return htmlText(value);
  });
  const footer = `<p><strong>Idempotência:</strong> <code>${htmlText(executionId)}:table:${blockIndex}</code></p>`;
  return `<h1>Execução de QA — ${htmlText(report.project || 'Menu On-Line')}${heading}</h1>${metadata}${mediaNotice}${firstBlockSummary}${table}${footer}`;
}

function splitCommentRows({ rows, maxCommentChars, common, mediaByCase, mediaMode }) {
  const groups = [];
  let current = [];
  for (const row of rows) {
    const candidate = [...current, row];
    const estimate = buildCommentHtml({
      ...common,
      rows: candidate,
      mediaByCase,
      mediaMode,
      blockIndex: 1,
      blockCount: 999,
      estimateMedia: true,
    });
    if (estimate.length > maxCommentChars && current.length) {
      groups.push(current);
      current = [row];
    } else {
      current = candidate;
    }
    const singleRow = buildCommentHtml({
      ...common,
      rows: current,
      mediaByCase,
      mediaMode,
      blockIndex: 1,
      blockCount: 999,
      estimateMedia: true,
    });
    if (singleRow.length > maxCommentChars) {
      throw new Error(`${row.id} não cabe em um comentário de ${maxCommentChars} caracteres sem dividir ou remover valores da linha.`);
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function splitTableRows(rows, maxCommentChars = defaultCommentLimit) {
  try {
    return splitRowsByRenderedTableSize(expectedHeaders, rows, maxCommentChars, (row) => row.values);
  } catch (error) {
    if (error.message.startsWith('Uma linha excede')) {
      throw new Error(`Uma linha da planilha não cabe em um comentário de ${maxCommentChars} caracteres sem dividir ou remover valores.`);
    }
    throw error;
  }
}

function previewWorkbookTable(executionId) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(executionId)) throw new Error(`executionId inválido: ${executionId}`);
  const runDir = assertInside(reportsRoot, path.join(reportsRoot, executionId), 'A execução');
  const workbookPath = path.join(runDir, 'report.xlsx');
  verifyFile(workbookPath, 'report.xlsx da execução', Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  const workbook = readXlsxTable(workbookPath);
  assertOfficialHeaders(workbook.headers);
  for (const row of workbook.rows) {
    if (row.extraValues.length || row.values.length !== expectedHeaders.length) {
      throw new Error(`A linha ${row.rowNumber} precisa conter exatamente as 11 colunas oficiais.`);
    }
  }

  const rows = workbook.rows.map((row) => ({ rowNumber: row.rowNumber, values: row.values }));
  const groups = splitTableRows(rows);
  const outputDir = path.join(runDir, 'jira-publication');
  fs.mkdirSync(outputDir, { recursive: true });
  const previews = groups.map((group, index) => {
    const values = group.map((row) => row.values);
    const html = renderJiraTable(expectedHeaders, values);
    const verification = assertJiraTableMatchesSource(html, expectedHeaders, values);
    const suffix = groups.length === 1 ? '' : `-${String(index + 1).padStart(2, '0')}-of-${String(groups.length).padStart(2, '0')}`;
    const fileName = `table-comment-preview${suffix}.html`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, `${html}\n`, 'utf8');
    return {
      fileName,
      relativePath: path.relative(projectRoot, filePath).split(path.sep).join('/'),
      rows: verification.rows,
      columns: verification.columns,
      valuesVerified: verification.valuesVerified,
      characterCount: html.length,
    };
  });

  let reportCaseCount = null;
  let reportMatchesWorkbook = null;
  const reportPath = path.join(runDir, 'report.json');
  if (fs.existsSync(reportPath)) {
    const report = readRequiredJson(reportPath, 'report.json');
    reportCaseCount = Array.isArray(report.cases) ? report.cases.length : null;
    if (Array.isArray(report.cases)) {
      const workbookIds = rows.map((row) => scenarioId(row.values[0], row.rowNumber));
      const reportIds = report.cases.map((testCase) => testCase.id);
      reportMatchesWorkbook = workbookIds.length === reportIds.length
        && workbookIds.every((id, index) => id === reportIds[index]);
    }
  }

  process.stdout.write(`${JSON.stringify({
    mode: 'table-preview-only',
    jiraAccessed: false,
    jiraWritten: false,
    executionId,
    workbook: path.relative(projectRoot, workbookPath).split(path.sep).join('/'),
    worksheet: workbook.sheetName,
    sourceRows: rows.length,
    columns: workbook.headers.length,
    headers: workbook.headers,
    allCellValuesVerified: previews.every((preview) => preview.valuesVerified),
    reportCaseCount,
    reportMatchesWorkbook,
    commentBlocks: previews,
    excelAttached: false,
  }, null, 2)}\n`);
}

function exportCommentBase64(executionId, commentFileName) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(executionId)) throw new Error(`executionId inválido: ${executionId}`);
  if (!/^comment-\d{2}-of-\d{2}\.html$/.test(commentFileName)) throw new Error('--comment-base64 deve indicar um nome comment-XX-of-YY.html.');
  const runDir = assertInside(reportsRoot, path.join(reportsRoot, executionId), 'A execução');
  const outputDir = path.join(runDir, 'jira-publication');
  const manifest = readRequiredJson(path.join(outputDir, 'manifest.json'), 'manifest.json');
  if (manifest.executionId !== executionId) throw new Error('manifest.json pertence a outra execução.');
  const block = manifest.comments?.find((comment) => path.basename(comment.localPath) === commentFileName);
  if (!block || block.readyForPublication !== true) throw new Error(`${commentFileName} não é um bloco pronto para publicação neste manifest.`);

  const commentPath = assertInside(outputDir, path.join(outputDir, commentFileName), 'O comentário');
  const html = decodeUtf8Buffer(fs.readFileSync(commentPath), commentFileName);
  if (html.includes('UPLOAD INLINE PENDENTE')) throw new Error(`${commentFileName} ainda contém placeholders de upload.`);
  if (!html.includes(`<code>${block.idempotencyMarker}</code>`)) throw new Error(`${commentFileName} não contém seu marcador de idempotência esperado.`);

  const table = extractJiraTableValues(html);
  assertOfficialHeaders(table.headers);
  const ids = table.rows.map((row, index) => scenarioId(row[0], index + 1));
  if (new Set(ids).size !== ids.length) throw new Error(`${commentFileName} contém cenários duplicados.`);
  if (JSON.stringify(ids) !== JSON.stringify(block.scenarioIds)) throw new Error(`${commentFileName} não corresponde à ordem de cenários do manifest.`);
  if (table.rows.some((row) => row.length !== expectedHeaders.length)) throw new Error(`${commentFileName} tem uma linha sem as 11 colunas oficiais.`);

  const mediaMapPath = manifest.mediaMap ? path.resolve(projectRoot, manifest.mediaMap) : null;
  if (manifest.mediaMode === 'inline') {
    if (!mediaMapPath) throw new Error('O manifest não referencia media-map.json para o comentário inline.');
    const mediaMap = readRequiredJson(mediaMapPath, 'media-map.json');
    const byScenario = new Map(mediaMap.media.map((item) => [item.scenarioId, item]));
    const bodyRows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1);
    if (bodyRows.length !== ids.length) throw new Error(`${commentFileName}: a quantidade de linhas HTML difere do manifest.`);
    bodyRows.forEach((match, index) => {
      const cells = [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cell[1]);
      const item = byScenario.get(ids[index]);
      if (cells.length !== expectedHeaders.length) throw new Error(`${ids[index]}: a linha não contém 11 células HTML.`);
      if (item && (!cells[10].includes(`data-id="${escapeHtml(item.fileId)}"`) || !cells[10].includes(`data-collection="${escapeHtml(item.collection)}"`))) {
        throw new Error(`${ids[index]}: a imagem inline não corresponde ao fileId/collection do cenário.`);
      }
    });
  }

  process.stdout.write(encodeUtf8Base64(html, commentFileName));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.commentBase64) {
    if (!args.execution) throw new Error('Informe --execution junto com --comment-base64.');
    exportCommentBase64(args.execution, args.commentBase64);
    return;
  }
  if (args.previewTable) {
    if (!args.execution) throw new Error(usage());
    previewWorkbookTable(args.execution);
    return;
  }
  if (!args.issue || !args.issueTitle || !args.execution) throw new Error(usage());
  if (!/^[A-Z][A-Z0-9]+-\d+$/.test(args.issue)) throw new Error(`Chave Jira inválida: ${args.issue}`);
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(args.execution)) throw new Error(`executionId inválido: ${args.execution}`);
  if (!args.issueTitle.trim() || /[\r\n]/.test(args.issueTitle)) throw new Error('Informe o título exato do card em uma única linha.');
  if (!['inline', 'link'].includes(args.mediaMode)) throw new Error('--media-mode deve ser inline ou link.');
  if (!Number.isInteger(args.maxCommentChars) || args.maxCommentChars < 5000 || args.maxCommentChars > 30000) {
    throw new Error('--max-comment-chars deve ser um inteiro entre 5000 e 30000, abaixo do limite do Jira.');
  }

  const runDir = assertInside(reportsRoot, path.join(reportsRoot, args.execution), 'A execução');
  const report = readRequiredJson(path.join(runDir, 'report.json'), 'report.json');
  if (report.executionId !== args.execution) throw new Error(`O report.json pertence a ${report.executionId}, não a ${args.execution}.`);
  if (!report.summary || !report.execution) throw new Error('report.json está sem resumo ou metadados da execução.');

  const productionHost = 'menu-online-project.vercel.app';
  if (report.execution.baseUrl) {
    const targetUrl = new URL(report.execution.baseUrl);
    if (targetUrl.hostname.toLowerCase() === productionHost) throw new Error('A publicação foi bloqueada: o relatório aponta para o host de produção.');
  }

  verifyFile(path.join(runDir, 'raw.json'), 'raw.json');
  verifyFile(path.join(runDir, 'playwright-report', 'index.html'), 'relatório nativo do Playwright');
  const workbookPath = path.join(runDir, 'report.xlsx');
  const { workbook, rows, summary } = readExecutionTable(workbookPath, report, runDir);
  const outputDir = path.join(runDir, 'jira-publication');
  const attachmentsDir = path.join(outputDir, 'attachments');
  const mediaMapPath = args.mediaMap ? assertInside(outputDir, path.resolve(projectRoot, args.mediaMap), 'media-map.json') : null;
  const mediaByCase = mediaMapPath ? readMediaMap(mediaMapPath, args.issue, args.execution, rows, args.mediaMode) : null;
  const common = { issue: args.issue, issueTitle: args.issueTitle, executionId: args.execution, report, summary };
  const groups = splitCommentRows({ rows, maxCommentChars: args.maxCommentChars, common, mediaByCase, mediaMode: args.mediaMode });
  const commentFiles = groups.map((group, index) => {
    const blockIndex = index + 1;
    const html = buildCommentHtml({
      ...common,
      rows: group,
      mediaByCase,
      mediaMode: args.mediaMode,
      blockIndex,
      blockCount: groups.length,
    });
    if (html.length > args.maxCommentChars || html.length > jiraCommentHardLimit) {
      throw new Error(`Bloco ${blockIndex}/${groups.length} excede o limite de comentário: ${html.length} caracteres.`);
    }
    return {
      fileName: `${mediaByCase ? 'comment' : 'comment-template'}-${String(blockIndex).padStart(2, '0')}-of-${String(groups.length).padStart(2, '0')}.html`,
      html,
      chars: html.length,
      scenarioIds: group.map((row) => row.id),
      readyForPublication: Boolean(mediaByCase),
    };
  });
  assertCompleteBlockPlan(
    commentFiles.map((comment, index) => ({ scenarioIds: comment.scenarioIds, idempotencyMarker: `${args.execution}:table:${index + 1}` })),
    rows.map((row) => row.id),
  );

  const screenshotRows = rows.filter((row) => row.sourceJpeg);
  const attachmentManifest = screenshotRows.map((row) => ({
    kind: 'scenario-evidence',
    scenarioId: row.id,
    sourceWorkbookRow: row.rowNumber,
    sourceFile: path.relative(projectRoot, row.sourceJpeg).split(path.sep).join('/'),
    attachmentName: row.attachmentName,
    localPath: path.join(attachmentsDir, row.attachmentName),
    relativePath: path.relative(projectRoot, path.join(attachmentsDir, row.attachmentName)).split(path.sep).join('/'),
    mediaId: mediaByCase?.get(row.id)?.fileId || null,
    mediaCollection: mediaByCase?.get(row.id)?.collection || null,
    uploadedFileName: mediaByCase?.get(row.id)?.fileName || null,
    attachmentId: mediaByCase?.get(row.id)?.attachmentId || null,
    directUrl: mediaByCase?.get(row.id)?.url || null,
    mediaMode: mediaByCase ? args.mediaMode : null,
    embeddedInScenarioRow: Boolean(mediaByCase?.has(row.id) && args.mediaMode === 'inline'),
    linkedInScenarioRow: Boolean(mediaByCase?.has(row.id) && args.mediaMode === 'link'),
  }));

  if (args.dryRun) {
    process.stdout.write(`${JSON.stringify({
      mode: 'dry-run',
      issue: args.issue,
      executionId: args.execution,
      workbookSheet: workbook.sheetName,
      tableColumns: workbook.headers.length,
      tableRows: rows.length,
      scenarioIds: rows.map((row) => row.id),
      summary,
      screenshots: attachmentManifest.length,
      excelAttached: false,
      mediaMode: args.mediaMode,
      commentBlocks: commentFiles.map(({ fileName, chars, scenarioIds, readyForPublication }) => ({ fileName, chars, scenarioIds, readyForPublication })),
      commentLimit: args.maxCommentChars,
      mediaMapRequired: screenshotRows.length > 0 && !mediaByCase,
    }, null, 2)}\n`);
    return;
  }

  fs.mkdirSync(attachmentsDir, { recursive: true });
  const legacyWorkbook = path.join(attachmentsDir, `${args.execution}-report.xlsx`);
  if (fs.existsSync(legacyWorkbook)) fs.rmSync(legacyWorkbook, { force: true });
  const unexpectedXlsx = fs.readdirSync(attachmentsDir).filter((name) => name.toLowerCase().endsWith('.xlsx'));
  if (unexpectedXlsx.length) throw new Error(`A pasta de anexos não pode conter Excel: ${unexpectedXlsx.join(', ')}.`);

  for (const row of screenshotRows) fs.copyFileSync(row.sourceJpeg, path.join(attachmentsDir, row.attachmentName));
  for (const file of fs.readdirSync(attachmentsDir)) {
    if (file.toLowerCase().endsWith('.xlsx')) throw new Error(`Excel proibido na pasta de anexos: ${file}.`);
  }

  for (const comment of commentFiles) {
    fs.writeFileSync(path.join(outputDir, comment.fileName), `${comment.html}\n`, 'utf8');
  }
  const manifestPath = path.join(outputDir, 'manifest.json');
  const manifest = {
    schemaVersion: '2.0',
    issue: { key: args.issue, title: args.issueTitle },
    executionId: args.execution,
    summary,
    sourceWorkbook: {
      localPath: workbookPath,
      relativePath: path.relative(projectRoot, workbookPath).split(path.sep).join('/'),
      sheetName: workbook.sheetName,
      headers: workbook.headers,
      rowCount: rows.length,
      scenarioIds: rows.map((row) => row.id),
      attached: false,
    },
    comments: commentFiles.map((comment) => ({
      localPath: path.join(outputDir, comment.fileName),
      relativePath: path.relative(projectRoot, path.join(outputDir, comment.fileName)).split(path.sep).join('/'),
      characterCount: comment.chars,
      scenarioIds: comment.scenarioIds,
      readyForPublication: comment.readyForPublication,
      idempotencyMarker: `${args.execution}:table:${commentFiles.indexOf(comment) + 1}`,
    })),
    attachments: attachmentManifest,
    mediaMap: mediaMapPath ? path.relative(projectRoot, mediaMapPath).split(path.sep).join('/') : null,
    mediaMode: mediaByCase ? args.mediaMode : null,
    publicationStatus: mediaByCase ? 'prepared-ready-for-jira-review' : 'prepared-awaiting-inline-media',
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  process.stdout.write(`${JSON.stringify({
    mode: manifest.publicationStatus,
    issue: args.issue,
    executionId: args.execution,
    summary,
    tableColumns: workbook.headers.length,
    tableRows: rows.length,
    screenshots: attachmentManifest.length,
    excelAttached: false,
    commentBlocks: commentFiles.map(({ fileName, chars, scenarioIds, readyForPublication }) => ({ fileName, chars, scenarioIds, readyForPublication })),
    commentsDir: path.relative(projectRoot, outputDir).split(path.sep).join('/'),
    attachmentsDir: path.relative(projectRoot, attachmentsDir).split(path.sep).join('/'),
    manifest: path.relative(projectRoot, manifestPath).split(path.sep).join('/'),
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
