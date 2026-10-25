'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const archiveTool = process.platform === 'win32' ? 'tar.exe' : 'tar';

function decodeXml(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_match, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/&#([0-9]+);/g, (_match, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function attribute(attributes, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = attributes.match(new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`));
  return match ? decodeXml(match[1]) : null;
}

function textRuns(fragment) {
  const withoutPhonetics = fragment.replace(/<rPh\b[^>]*>[\s\S]*?<\/rPh>/g, '');
  return [...withoutPhonetics.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1]))
    .join('');
}

function columnIndex(reference) {
  const letters = reference.match(/^([A-Z]+)/)?.[1];
  if (!letters) throw new Error(`Referência de célula XLSX inválida: ${reference}`);
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => textRuns(match[1]));
}

function readEntry(archivePath, entry, existingEntries) {
  if (!existingEntries.has(entry)) return null;
  try {
    return execFileSync(archiveTool, ['-xOf', archivePath, entry], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`Não foi possível ler ${entry} de ${archivePath}: ${error.message}`);
  }
}

function resolveWorksheetTarget(target) {
  if (!target || /^[a-z]+:/i.test(target)) throw new Error('Relacionamento da planilha aponta para um destino inválido.');
  const normalized = target.startsWith('/')
    ? path.posix.normalize(target.replace(/^\/+/, ''))
    : path.posix.normalize(path.posix.join('xl', target));
  if (!normalized.startsWith('xl/') || normalized === 'xl/..' || normalized.split('/').includes('..')) {
    throw new Error(`Destino da planilha fora de xl/: ${target}`);
  }
  return normalized;
}

function cellValue(cellXml, sharedStrings) {
  const attributes = cellXml.match(/^<c\b([^>]*)>/)?.[1] || '';
  const type = attribute(attributes, 't');
  const body = cellXml.replace(/^<c\b[^>]*>/, '').replace(/<\/c>\s*$/, '');

  if (type === 'inlineStr') {
    const inline = body.match(/<is\b[^>]*>([\s\S]*?)<\/is>/);
    return inline ? textRuns(inline[1]) : '';
  }

  const value = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1];
  if (value === undefined) return '';
  if (type === 's') {
    const index = Number.parseInt(value, 10);
    if (!Number.isInteger(index) || index < 0 || index >= sharedStrings.length) {
      throw new Error(`Índice de shared string inválido: ${value}`);
    }
    return sharedStrings[index];
  }
  if (type === 'b') return value === '1' ? 'TRUE' : 'FALSE';
  return decodeXml(value);
}

function readXlsxTable(archivePath) {
  const archive = path.resolve(archivePath);
  let entries;
  try {
    entries = new Set(execFileSync(archiveTool, ['-tf', archive], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
      .split(/\r?\n/)
      .filter(Boolean));
  } catch (error) {
    throw new Error(`Não foi possível abrir o arquivo como XLSX (${archive}): ${error.message}`);
  }

  const workbookXml = readEntry(archive, 'xl/workbook.xml', entries);
  const relationshipsXml = readEntry(archive, 'xl/_rels/workbook.xml.rels', entries);
  if (!workbookXml || !relationshipsXml) throw new Error('XLSX sem xl/workbook.xml ou relacionamentos.');

  const firstSheet = workbookXml.match(/<sheet\b([^>]*)\/?\s*>/);
  if (!firstSheet) throw new Error('O XLSX não contém uma planilha visível para leitura.');
  const relationshipId = attribute(firstSheet[1], 'r:id');
  const sheetName = attribute(firstSheet[1], 'name') || 'Planilha';
  const relationship = [...relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)]
    .find((match) => attribute(match[1], 'Id') === relationshipId);
  if (!relationship) throw new Error(`Relacionamento da primeira planilha não encontrado: ${relationshipId}`);

  const worksheetPath = resolveWorksheetTarget(attribute(relationship[1], 'Target'));
  const worksheetXml = readEntry(archive, worksheetPath, entries);
  if (!worksheetXml) throw new Error(`Planilha XLSX ausente: ${worksheetPath}`);
  const sharedStrings = parseSharedStrings(readEntry(archive, 'xl/sharedStrings.xml', entries));
  const sheetData = worksheetXml.match(/<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/);
  if (!sheetData) throw new Error('A planilha XLSX não contém sheetData.');

  const rawRows = [...sheetData[1].matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)].map((match) => {
    const rowNumber = Number.parseInt(attribute(match[1], 'r'), 10);
    const values = [];
    const cells = [...match[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)];
    for (const cell of cells) {
      const reference = attribute(cell[1], 'r');
      if (!reference) throw new Error(`Célula sem referência na linha ${rowNumber}.`);
      const index = columnIndex(reference);
      const xml = cell[2] === undefined ? `<c ${cell[1]}/>` : `<c ${cell[1]}>${cell[2]}</c>`;
      values[index] = cellValue(xml, sharedStrings);
    }
    return { rowNumber, values };
  });

  const headerRow = rawRows.find((row) => row.values.some((value) => value !== undefined && value !== ''));
  if (!headerRow) throw new Error('A primeira planilha está vazia.');
  const headers = headerRow.values.map((value) => String(value ?? ''));
  const rows = rawRows
    .filter((row) => row.rowNumber > headerRow.rowNumber)
    .map((row) => ({
      rowNumber: row.rowNumber,
      values: headers.map((_header, index) => String(row.values[index] ?? '')),
      extraValues: row.values.slice(headers.length).filter((value) => value !== undefined && value !== ''),
    }))
    .filter((row) => row.values.some((value) => value !== '') || row.extraValues.length > 0);

  return { archivePath: archive, sheetName, headers, rows };
}

module.exports = { readXlsxTable };
