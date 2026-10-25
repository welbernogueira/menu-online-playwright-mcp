const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const reportsRoot = path.join(root, 'qa', 'reports');
const executionId = process.argv[2];
if (!executionId) throw new Error('Informe executionId para atualizar a planilha de evidências.');
const runDir = path.resolve(reportsRoot, executionId);
if (path.dirname(runDir) !== reportsRoot) throw new Error('executionId deve identificar somente uma pasta dentro de qa/reports/.');

const report = JSON.parse(fs.readFileSync(path.join(runDir, 'report.json'), 'utf8'));
const cases = new Map(report.cases.map((item) => [item.id, item]));
const matrixText = fs.readFileSync(path.join(root, 'docs', 'testes', 'cenarios-complementares.md'), 'utf8');
const matrixCases = new Map(matrixText.split(/\r?\n/).filter((line) => /^\| CT-\d{3}\s+—/.test(line)).map((line) => {
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  return [(cells[0].match(/CT-\d{3}/) || [])[0], { prerequisite: cells[1], steps: cells[2] }];
}));
const unpacked = path.join(runDir, 'workbook-unpacked');
const sourceUnpacked = path.join(runDir, 'workbook-source-unpacked');
const sourceWorkbook = path.join(root, 'docs', 'testes', 'cenarios-complementares.xlsx');
const backupWorkbook = path.join(runDir, 'cenarios-complementares.before-execution.xlsx');
if (!fs.existsSync(backupWorkbook)) fs.copyFileSync(sourceWorkbook, backupWorkbook);
if (!fs.existsSync(path.join(unpacked, 'xl', 'worksheets', 'sheet1.xml'))) {
  fs.mkdirSync(unpacked, { recursive: true });
  if (process.platform === 'win32') execFileSync('tar.exe', ['-xf', sourceWorkbook, '-C', unpacked], { stdio: 'inherit' });
  else execFileSync('unzip', ['-q', sourceWorkbook, '-d', unpacked], { stdio: 'inherit' });
}
fs.cpSync(unpacked, sourceUnpacked, { recursive: true });
const escapeXml = (text) => String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function updatePackage(directory, linkRoot) {
  const sheetPath = path.join(directory, 'xl', 'worksheets', 'sheet1.xml');
  let sheet = fs.readFileSync(sheetPath, 'utf8');
  const links = [];
  for (let row = 2; row <= 32; row += 1) {
    const match = sheet.match(new RegExp(`<c r="A${row}"[^>]*>[\\s\\S]*?<t(?: [^>]*)?>(CT-\\d{3})`));
    if (!match) continue;
    const id = match[1];
    const item = cases.get(id);
    if (!item) continue;
    const matrixItem = matrixCases.get(id);
    const values = {
      [`B${row}`]: (matrixItem?.prerequisite || '').replaceAll('<br>', '\n'),
      [`C${row}`]: (matrixItem?.steps || item.actions).replaceAll('<br>', '\n'),
      [`G${row}`]: item.verdict,
      [`H${row}`]: item.expected.replaceAll('<br>', '\n'),
      [`I${row}`]: item.actual,
      [`K${row}`]: `Card JPEG — ${id} (${item.verdict}); HTML fonte e detalhes no report.html`,
    };
    for (const [reference, value] of Object.entries(values)) {
      const cell = new RegExp(`(<c r="${reference}"[^>]*>)[\\s\\S]*?(</c>)`);
      if (!cell.test(sheet)) throw new Error(`Célula não encontrada: ${reference}`);
      sheet = sheet.replace(cell, (_whole, prefix, suffix) => `${prefix}<is><t xml:space="preserve">${escapeXml(value)}</t></is>${suffix}`);
    }
    links.push(`<hyperlink ref="K${row}" r:id="rId${row + 1}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" />`);
  }
  if (links.length !== 31) throw new Error(`Linhas atualizadas: ${links.length}; esperado 31.`);
  sheet = sheet.replace(/<hyperlinks>[\s\S]*?<\/hyperlinks>/, `<hyperlinks>${links.join('')}</hyperlinks>`);
  fs.writeFileSync(sheetPath, sheet, 'utf8');

  const relsPath = path.join(directory, 'xl', 'worksheets', '_rels', 'sheet1.xml.rels');
  let rels = fs.readFileSync(relsPath, 'utf8');
  rels = rels.replace(/<Relationship Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/hyperlink"[\s\S]*?\/>/g, '');
  const relationships = [...cases.values()].filter((item) => item.number >= 6).map((item) =>
    `<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${linkRoot}${item.id}.jpg" TargetMode="External" Id="rId${item.number - 3}" />`,
  ).join('');
  rels = rels.replace('</Relationships>', `${relationships}</Relationships>`);
  fs.writeFileSync(relsPath, rels, 'utf8');
  return links.length;
}

function rowScenarioId(rowXml) {
  const firstCell = rowXml.match(/<c\b[^>]*\br="A\d+"[^>]*>([\s\S]*?)<\/c>/);
  const text = firstCell?.[1].match(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/)?.[1] || '';
  return text.replace(/&amp;/g, '&').match(/CT-\d{3}/)?.[0] || null;
}

function reindexRow(rowXml, oldIndex, newIndex) {
  const result = rowXml.replace(new RegExp(`(<row\\b[^>]*\\br=")${oldIndex}("(?=[ >]))`), `$1${newIndex}$2`);
  return result.replace(new RegExp(`(\\br="[A-Z]+)${oldIndex}("(?=[ >]))`, 'g'), `$1${newIndex}$2`);
}

function setCellText(rowXml, reference, value) {
  const cell = new RegExp(`(<c\\b[^>]*\\br="${reference}"[^>]*>)[\\s\\S]*?(<\\/c>)`);
  if (!cell.test(rowXml)) throw new Error(`Célula não encontrada ao criar linha da planilha: ${reference}`);
  return rowXml.replace(cell, (_match, open, close) => `${open}<is><t xml:space="preserve">${escapeXml(value)}</t></is>${close}`);
}

function includeEveryReportCase(directory, linkRoot) {
  const sheetPath = path.join(directory, 'xl', 'worksheets', 'sheet1.xml');
  let sheet = fs.readFileSync(sheetPath, 'utf8');
  const sheetData = sheet.match(/<sheetData>([\s\S]*?)<\/sheetData>/);
  if (!sheetData) throw new Error('sheet1.xml não contém sheetData.');

  const existingRows = [...sheetData[1].matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)].map((match) => {
    const xml = match[0];
    const rowIndex = Number((xml.match(/<row\b[^>]*\br="(\d+)"/) || [])[1]);
    return { rowIndex, id: rowScenarioId(xml), xml };
  });
  const headerRow = existingRows.find((row) => row.rowIndex === 1);
  const rowsById = new Map(existingRows.filter((row) => row.id).map((row) => [row.id, row]));
  const template = existingRows.find((row) => row.rowIndex === 2);
  if (!headerRow || !template || !template.id) throw new Error('Cabeçalho ou linha modelo de cenário não encontrado no XLSX.');
  if (rowsById.size !== existingRows.filter((row) => row.rowIndex > 1).length) {
    throw new Error('A planilha possui cenário sem identificador ou ID duplicado.');
  }

  const expectedIds = new Set(report.cases.map((item) => item.id));
  for (const id of rowsById.keys()) {
    if (!expectedIds.has(id)) throw new Error(`A planilha contém o cenário ${id}, que não pertence a report.json.`);
  }

  const allRows = report.cases.map((item, index) => {
    const rowIndex = index + 2;
    const existing = rowsById.get(item.id);
    if (existing) return reindexRow(existing.xml, existing.rowIndex, rowIndex);
    if (!/^CT-00[1-5]$/.test(item.id)) {
      throw new Error(`O XLSX está sem a linha de ${item.id}; inclua o cenário na matriz antes de gerar o relatório.`);
    }

    const values = {
      A: item.title,
      B: '',
      C: item.actions,
      D: '',
      E: '',
      F: '',
      G: item.verdict,
      H: item.expected,
      I: item.actual,
      J: '',
      K: `Card JPEG — ${item.id} (${item.verdict}); HTML fonte e detalhes no report.html`,
    };
    let row = reindexRow(template.xml, template.rowIndex, rowIndex);
    for (const [column, value] of Object.entries(values)) row = setCellText(row, `${column}${rowIndex}`, value);
    return row;
  });

  if (allRows.length !== report.cases.length || rowsById.size > report.cases.length) {
    throw new Error(`Linhas XLSX=${allRows.length}; cenários report.json=${report.cases.length}.`);
  }
  sheet = sheet.replace(sheetData[0], `<sheetData>${headerRow.xml}${allRows.join('')}</sheetData>`);
  const finalRow = report.cases.length + 1;
  sheet = sheet.replace(/ref="A1:K\d+"/g, `ref="A1:K${finalRow}"`);
  const hyperlinks = report.cases.map((_item, index) => {
    const rowIndex = index + 2;
    const relationshipId = `rId${100 + index}`;
    return `<hyperlink ref="K${rowIndex}" r:id="${relationshipId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" />`;
  }).join('');
  if (/<hyperlinks>[\s\S]*?<\/hyperlinks>/.test(sheet)) {
    sheet = sheet.replace(/<hyperlinks>[\s\S]*?<\/hyperlinks>/, `<hyperlinks>${hyperlinks}</hyperlinks>`);
  } else {
    sheet = sheet.replace('</worksheet>', `<hyperlinks>${hyperlinks}</hyperlinks></worksheet>`);
  }
  fs.writeFileSync(sheetPath, sheet, 'utf8');

  const relsPath = path.join(directory, 'xl', 'worksheets', '_rels', 'sheet1.xml.rels');
  let rels = fs.readFileSync(relsPath, 'utf8');
  rels = rels.replace(/<Relationship\b(?=[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/hyperlink")[^>]*\/>/g, '');
  const relationships = report.cases.map((item, index) =>
    `<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${linkRoot}${item.id}.jpg" TargetMode="External" Id="rId${100 + index}" />`,
  ).join('');
  rels = rels.replace('</Relationships>', `${relationships}</Relationships>`);
  fs.writeFileSync(relsPath, rels, 'utf8');

  const workbookPath = path.join(directory, 'xl', 'workbook.xml');
  const workbook = fs.readFileSync(workbookPath, 'utf8')
    .replace(/\$A\$1:\$K\$\d+/g, `$A$1:$K$${finalRow}`);
  fs.writeFileSync(workbookPath, workbook, 'utf8');

  const tablePath = path.join(directory, 'xl', 'tables', 'table1.xml');
  const table = fs.readFileSync(tablePath, 'utf8').replace(/ref="A1:K\d+"/g, `ref="A1:K${finalRow}"`);
  fs.writeFileSync(tablePath, table, 'utf8');
  return allRows.length;
}

const reportRows = updatePackage(unpacked, 'evidence/');
const reportCaseRows = includeEveryReportCase(unpacked, 'evidence/');
const sourceRows = updatePackage(sourceUnpacked, `../../qa/reports/${executionId}/evidence/`);
const reportWorkbook = path.join(runDir, 'report.xlsx');
const reportArchive = path.join(runDir, 'report.zip');
const sourceArchive = path.join(runDir, 'cenarios-complementares.updated.zip');
for (const file of [reportArchive, sourceArchive, reportWorkbook, sourceWorkbook]) fs.rmSync(file, { force: true });
const archiveTool = process.platform === 'win32' ? 'tar.exe' : 'tar';
const packageParts = ['[Content_Types].xml', '_rels', 'docProps', 'xl'];
execFileSync(archiveTool, ['-a', '-c', '-f', reportArchive, '-C', unpacked, ...packageParts], { stdio: 'inherit' });
execFileSync(archiveTool, ['-a', '-c', '-f', sourceArchive, '-C', sourceUnpacked, ...packageParts], { stdio: 'inherit' });
fs.renameSync(reportArchive, reportWorkbook);
fs.renameSync(sourceArchive, sourceWorkbook);
console.log(JSON.stringify({ executionId, reportRows, reportCaseRows, sourceRows, reportWorkbook, sourceWorkbook }, null, 2));
