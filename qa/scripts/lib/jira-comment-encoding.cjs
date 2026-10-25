'use strict';

const mojibakePattern = /(?:Ã(?:§|£|©|¡|º|ª|¼|­)|â(?:€|€™|€œ)|Â(?:\s| )|ExecuÃ§|DescriÃ§Ã£)/u;

function assertUtf8Text(value, label = 'conteúdo Jira') {
  if (typeof value !== 'string') throw new TypeError(`${label} precisa ser texto.`);
  if (value.includes('\uFFFD')) throw new Error(`${label} contém o caractere de substituição Unicode (U+FFFD).`);
  if (mojibakePattern.test(value)) throw new Error(`${label} contém sinais de corrupção de codificação (mojibake).`);
  const roundTrip = Buffer.from(value, 'utf8').toString('utf8');
  if (roundTrip !== value) throw new Error(`${label} não sobrevive a uma conversão UTF-8 sem perdas.`);
  return value;
}

function decodeUtf8Buffer(buffer, label = 'arquivo HTML') {
  if (!Buffer.isBuffer(buffer)) throw new TypeError(`${label} precisa ser um Buffer.`);
  const value = buffer.toString('utf8');
  if (!Buffer.from(value, 'utf8').equals(buffer)) throw new Error(`${label} não contém UTF-8 válido.`);
  return assertUtf8Text(value, label);
}

function encodeUtf8Base64(value, label = 'conteúdo Jira') {
  return Buffer.from(assertUtf8Text(value, label), 'utf8').toString('base64');
}

module.exports = { assertUtf8Text, decodeUtf8Buffer, encodeUtf8Base64 };
