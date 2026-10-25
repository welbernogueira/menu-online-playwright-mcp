'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  EXPECTED_HEADERS,
  assertJiraTableMatchesSource,
  extractJiraTableValues,
  renderJiraTable,
  splitRowsByRenderedTableSize,
} = require('../lib/jira-comment-table.cjs');
const { assertUtf8Text, decodeUtf8Buffer, encodeUtf8Base64 } = require('../lib/jira-comment-encoding.cjs');
const { assertCompleteBlockPlan, assertScenarioMediaReferences, inspectPublishedMarker, retryDecisionAfterUncertainWrite } = require('../lib/jira-publication-blocks.cjs');

const sourceRows = [
  [
    'CT-001 — Texto & <marcação>',
    'Pré-requisito "A"',
    'Passo 1\nPasso 2',
    'ALTA',
    'MAIOR',
    'FUNCIONAL',
    'APROVADO',
    'Exibir <itens> e "aspas"',
    "Texto com apóstrofo ' e &",
    'Descrição | preservada; não passou; inconclusivo',
    'qa/evidence/CT-001.jpg',
  ],
  ['', '—', 'Linha única', 'BAIXA', 'MENOR', 'NÃO FUNCIONAL', 'PENDENTE', '', '', 'Unicode: ação, café, 日本語', ''],
];

test('constrói uma tabela HTML Jira com as 11 colunas oficiais e todas as células', () => {
  const html = renderJiraTable(EXPECTED_HEADERS, sourceRows);
  const parsed = extractJiraTableValues(html);

  assert.match(html, /^<table><thead><tr>/);
  assert.match(html, /<\/thead><tbody>/);
  assert.match(html, /<\/tbody><\/table>$/);
  assert.equal((html.match(/<th>/g) || []).length, 11);
  assert.equal((html.match(/<td>/g) || []).length, sourceRows.length * 11);
  assert.deepEqual(parsed.headers, EXPECTED_HEADERS);
  assert.deepEqual(parsed.rows, sourceRows);
  assert.deepEqual(assertJiraTableMatchesSource(html, EXPECTED_HEADERS, sourceRows), {
    columns: 11,
    rows: 2,
    valuesVerified: true,
  });
});

test('escapa caracteres de marcação e preserva o texto e as quebras de linha das células', () => {
  const html = renderJiraTable(EXPECTED_HEADERS, sourceRows);

  assert.match(html, /CT-001 — Texto &amp; &lt;marcação&gt;/);
  assert.match(html, /Passo 1<br>Passo 2/);
  assert.doesNotMatch(html, /<marcação>/);
  assert.deepEqual(extractJiraTableValues(html).rows, sourceRows);
});

test('recusa cabeçalho e linhas que não correspondam ao padrão de 11 colunas', () => {
  assert.throws(() => renderJiraTable(EXPECTED_HEADERS.slice(1), []), /Cabeçalhos do XLSX divergentes/);
  assert.throws(() => renderJiraTable(EXPECTED_HEADERS, [['somente uma célula']]), /exatamente 11 células/);
});

test('divide por limite de comentário repetindo o cabeçalho e sem perder ou reordenar linhas', () => {
  const maxChars = renderJiraTable(EXPECTED_HEADERS, [sourceRows[0]]).length;
  const blocks = splitRowsByRenderedTableSize(EXPECTED_HEADERS, sourceRows, maxChars);

  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.flat(), sourceRows);
  for (const block of blocks) {
    const html = renderJiraTable(EXPECTED_HEADERS, block);
    assert.ok(html.length <= maxChars);
    assert.deepEqual(extractJiraTableValues(html).headers, EXPECTED_HEADERS);
    assert.deepEqual(extractJiraTableValues(html).rows, block);
  }
});

test('preserva texto português em UTF-8 pela transferência Base64 e rejeita mojibake', () => {
  const portuguese = 'Execução, Descrição, Pré-requisito, Evidências, não passou, inconclusivo';
  const encoded = encodeUtf8Base64(portuguese);
  assert.match(encoded, /^[A-Za-z0-9+/]+=*$/);
  assert.equal(decodeUtf8Buffer(Buffer.from(encoded, 'base64')), portuguese);
  assert.equal(assertUtf8Text('NÃO FUNCIONAL'), 'NÃO FUNCIONAL');
  assert.throws(() => assertUtf8Text('ExecuÃ§Ã£o'), /mojibake/);
  assert.throws(() => decodeUtf8Buffer(Buffer.from([0xff, 0xfe])), /UTF-8 válido/);
});

test('valida blocos completos, em ordem, sem cenários repetidos e com marcadores únicos', () => {
  const ids = ['CT-001', 'CT-002', 'CT-003'];
  assert.deepEqual(assertCompleteBlockPlan([
    { scenarioIds: ['CT-001', 'CT-002'], idempotencyMarker: 'run:table:1' },
    { scenarioIds: ['CT-003'], idempotencyMarker: 'run:table:2' },
  ], ids), { blocks: 2, scenarios: 3, complete: true });
  assert.throws(() => assertCompleteBlockPlan([
    { scenarioIds: ['CT-001', 'CT-002'], idempotencyMarker: 'run:table:1' },
    { scenarioIds: ['CT-002', 'CT-003'], idempotencyMarker: 'run:table:2' },
  ], ids), /cenários duplicados/);
  assert.throws(() => assertCompleteBlockPlan([
    { scenarioIds: ['CT-001'], idempotencyMarker: 'run:table:1' },
  ], ids), /exatamente uma vez/);
});

test('uma resposta incerta exige leitura posterior antes de qualquer retry', () => {
  const marker = 'run:table:2';
  assert.deepEqual(inspectPublishedMarker([], marker), { state: 'not-found-after-readback', commentId: null });
  assert.equal(retryDecisionAfterUncertainWrite([], marker), 'safe-to-retry-after-readback');
  const comments = [{ id: '10004', body: `<p>${marker}</p>` }];
  assert.deepEqual(inspectPublishedMarker(comments, marker), { state: 'already-published', commentId: '10004' });
  assert.equal(retryDecisionAfterUncertainWrite(comments, marker), 'do-not-retry');
  assert.throws(() => inspectPublishedMarker([...comments, { id: '10005', body: marker }], marker), /Marcador duplicado/);
});

test('associa cada screenshot ao cenário esperado e detecta ausência, duplicação ou cenário estranho', () => {
  const expected = ['CT-001', 'CT-002'];
  const references = [
    { scenarioId: 'CT-001', fileId: 'media-1' },
    { scenarioId: 'CT-002', fileId: 'media-2' },
  ];
  assert.equal(assertScenarioMediaReferences(expected, references), true);
  assert.throws(() => assertScenarioMediaReferences(expected, references.slice(0, 1)), /Falta mídia/);
  assert.throws(() => assertScenarioMediaReferences(expected, [...references, references[0]]), /cenário duplicado/);
  assert.throws(() => assertScenarioMediaReferences(expected, [references[0], { scenarioId: 'CT-003', fileId: 'media-3' }]), /não pertence/);
  assert.throws(() => assertScenarioMediaReferences(expected, [references[0], { scenarioId: 'CT-002', fileId: 'media-1' }]), /repetida/);
});
