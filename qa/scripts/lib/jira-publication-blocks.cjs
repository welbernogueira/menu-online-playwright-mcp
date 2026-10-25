'use strict';

function assertCompleteBlockPlan(blocks, expectedScenarioIds) {
  if (!Array.isArray(blocks) || !Array.isArray(expectedScenarioIds)) throw new TypeError('Blocos e cenários esperados precisam ser arrays.');
  const flattened = [];
  const markers = new Set();
  for (const [index, block] of blocks.entries()) {
    if (!block || !Array.isArray(block.scenarioIds) || !block.scenarioIds.length) throw new Error(`Bloco ${index + 1} está vazio ou sem IDs.`);
    if (!block.idempotencyMarker || markers.has(block.idempotencyMarker)) throw new Error(`Marcador de idempotência vazio ou duplicado no bloco ${index + 1}.`);
    markers.add(block.idempotencyMarker);
    if (new Set(block.scenarioIds).size !== block.scenarioIds.length) throw new Error(`O bloco ${index + 1} contém cenários duplicados.`);
    flattened.push(...block.scenarioIds);
  }
  if (new Set(flattened).size !== flattened.length) throw new Error('Há cenários duplicados entre blocos de publicação.');
  if (JSON.stringify(flattened) !== JSON.stringify(expectedScenarioIds)) throw new Error('Os blocos não cobrem os cenários exatamente uma vez e na ordem original.');
  return { blocks: blocks.length, scenarios: flattened.length, complete: true };
}

function inspectPublishedMarker(comments, marker) {
  if (!Array.isArray(comments) || typeof marker !== 'string' || !marker) throw new TypeError('Informe comentários Jira e um marcador válido.');
  const matches = comments.filter((comment) => String(comment.body || '').includes(marker));
  if (matches.length > 1) throw new Error(`Marcador duplicado no Jira: ${marker}. Interrompa e reconcilie manualmente.`);
  return matches.length === 1
    ? { state: 'already-published', commentId: String(matches[0].id) }
    : { state: 'not-found-after-readback', commentId: null };
}

function retryDecisionAfterUncertainWrite(comments, marker) {
  const observed = inspectPublishedMarker(comments, marker);
  return observed.state === 'already-published' ? 'do-not-retry' : 'safe-to-retry-after-readback';
}

function assertScenarioMediaReferences(expectedScenarioIds, mediaItems) {
  if (!Array.isArray(expectedScenarioIds) || !Array.isArray(mediaItems)) throw new TypeError('Cenários e referências de mídia precisam ser arrays.');
  if (new Set(expectedScenarioIds).size !== expectedScenarioIds.length) throw new Error('A lista de cenários esperados contém duplicidades.');
  const byScenario = new Map();
  const references = new Set();
  for (const item of mediaItems) {
    if (!item || typeof item.scenarioId !== 'string' || byScenario.has(item.scenarioId)) throw new Error('Referência de mídia sem cenário ou com cenário duplicado.');
    const reference = String(item.fileId || item.attachmentId || '');
    if (!reference || references.has(reference)) throw new Error('Referência de mídia vazia ou repetida.');
    byScenario.set(item.scenarioId, item);
    references.add(reference);
  }
  const expected = new Set(expectedScenarioIds);
  if ([...byScenario.keys()].some((id) => !expected.has(id))) throw new Error('Há mídia associada a um cenário que não pertence à execução.');
  if (byScenario.size !== expected.size || expectedScenarioIds.some((id) => !byScenario.has(id))) throw new Error('Falta mídia para um ou mais cenários esperados.');
  return true;
}

module.exports = { assertCompleteBlockPlan, assertScenarioMediaReferences, inspectPublishedMarker, retryDecisionAfterUncertainWrite };
