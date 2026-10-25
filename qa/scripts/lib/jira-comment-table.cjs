'use strict';

const EXPECTED_HEADERS = Object.freeze([
  'Cenário',
  'Pré-requisito',
  'Passos',
  'Prioridade',
  'Severidade',
  'Tipo',
  'Veredito',
  'Resultado Esperado',
  'Resultado Obtido',
  'Descrição',
  'Evidências',
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function htmlText(value) {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>');
}

function assertOfficialHeaders(headers) {
  if (JSON.stringify(headers) !== JSON.stringify(EXPECTED_HEADERS)) {
    throw new Error(`Cabeçalhos do XLSX divergentes. Esperado: ${EXPECTED_HEADERS.join(' | ')}; encontrado: ${headers.join(' | ')}.`);
  }
}

function renderJiraTable(headers, rows, renderCell = htmlText) {
  assertOfficialHeaders(headers);
  if (!Array.isArray(rows)) throw new Error('As linhas da tabela Jira devem ser um array.');

  const header = `<thead><tr>${headers.map((value) => `<th>${escapeHtml(value)}</th>`).join('')}</tr></thead>`;
  const body = rows.map((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== headers.length) {
      throw new Error(`A linha ${rowIndex + 1} precisa conter exatamente ${headers.length} células.`);
    }
    return `<tr>${row.map((value, columnIndex) => `<td>${renderCell(value, rowIndex, columnIndex)}</td>`).join('')}</tr>`;
  }).join('');

  return `<table>${header}<tbody>${body}</tbody></table>`;
}

function splitRowsByRenderedTableSize(headers, rows, maxChars, getValues = (row) => row) {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new Error('O limite da tabela precisa ser um inteiro positivo.');
  const groups = [];
  let current = [];
  for (const row of rows) {
    const candidate = [...current, row];
    if (renderJiraTable(headers, candidate.map(getValues)).length > maxChars && current.length) {
      groups.push(current);
      current = [row];
    } else {
      current = candidate;
    }
    if (renderJiraTable(headers, current.map(getValues)).length > maxChars) {
      throw new Error('Uma linha excede o limite de caracteres da tabela e não pode ser dividida sem perder células.');
    }
  }
  if (current.length || !groups.length) groups.push(current);
  return groups;
}

function decodeCellHtml(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractJiraTableValues(html) {
  const tables = [...String(html).matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  if (tables.length !== 1) throw new Error(`Esperada uma tabela Jira na representação, encontradas ${tables.length}.`);

  const table = tables[0][1];
  const head = table.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i)?.[1];
  const body = table.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i)?.[1];
  if (head === undefined || body === undefined) throw new Error('A tabela Jira precisa conter thead e tbody.');

  const headerRow = head.match(/<tr\b[^>]*>([\s\S]*?)<\/tr>/i)?.[1];
  if (headerRow === undefined) throw new Error('A tabela Jira não contém uma linha de cabeçalho.');
  const headers = [...headerRow.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)]
    .map((match) => decodeCellHtml(match[1]));
  const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((rowMatch) =>
    [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((cellMatch) => decodeCellHtml(cellMatch[1])));

  return { headers, rows };
}

function normalizeLineBreaks(value) {
  return String(value ?? '').replace(/\r\n|\r/g, '\n');
}

function assertJiraTableMatchesSource(html, headers, rows) {
  const parsed = extractJiraTableValues(html);
  if (JSON.stringify(parsed.headers) !== JSON.stringify(headers)) {
    throw new Error('Os cabeçalhos renderizados divergem da planilha de origem.');
  }
  if (parsed.rows.length !== rows.length) {
    throw new Error(`A tabela renderizada contém ${parsed.rows.length} linhas; a planilha contém ${rows.length}.`);
  }

  rows.forEach((row, rowIndex) => {
    if (parsed.rows[rowIndex].length !== row.length) {
      throw new Error(`A linha renderizada ${rowIndex + 1} contém ${parsed.rows[rowIndex].length} colunas; esperado ${row.length}.`);
    }
    row.forEach((value, columnIndex) => {
      if (normalizeLineBreaks(parsed.rows[rowIndex][columnIndex]) !== normalizeLineBreaks(value)) {
        throw new Error(`O conteúdo renderizado diverge da planilha na linha ${rowIndex + 1}, coluna ${columnIndex + 1}.`);
      }
    });
  });

  return { columns: parsed.headers.length, rows: parsed.rows.length, valuesVerified: true };
}

module.exports = {
  EXPECTED_HEADERS,
  assertJiraTableMatchesSource,
  assertOfficialHeaders,
  escapeHtml,
  extractJiraTableValues,
  htmlText,
  renderJiraTable,
  splitRowsByRenderedTableSize,
};
