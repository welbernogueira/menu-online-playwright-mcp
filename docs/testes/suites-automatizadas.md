# Suítes automatizadas — Menu On-Line

**Estado da execução (full-suite-local-20261024T231124284Z):** 36 cenários executados; 27 passaram, 9 falharam e 0 ficaram pendentes. CTs reprovados: CT-011, CT-019, CT-020, CT-022, CT-029, CT-030, CT-031, CT-032, CT-034. Veja [relatório completo](../../qa/reports/full-suite-local-20261024T231124284Z/report.html).

## Organização e rastreabilidade

| Suíte | Arquivo | Cenários |
|---|---|---|
| 00 — Smoke e navegação | `tests/00-smoke/navigation.spec.js` | CT-006 |
| 01 — Catálogo e navegação | `tests/01-catalog-navigation/catalog-navigation.spec.js` | CT-007 a CT-011; CT-035 |
| 02 — Seleção de produtos | `tests/02-product-selection/product-selection.spec.js` | CT-012 a CT-014 |
| 03 — Carrinho e cálculos | `tests/03-cart-calculations/cart-calculations.spec.js` | CT-015 a CT-017 |
| 04 — Endereço e validação | `tests/04-address-validation/address-validation.spec.js` | CT-018 a CT-020; CT-023 e CT-024 |
| 05 — Integração ViaCEP | `tests/05-viacep-integration/viacep-integration.spec.js` | CT-021 e CT-022 |
| 06 — Resumo e saídas externas | `tests/06-external-outputs/external-outputs.spec.js` | CT-025, CT-026 e CT-034 |
| 07 — Conteúdo interativo | `tests/07-interactive-content/interactive-content.spec.js` | CT-027 |
| 08 — Recursos e rede | `tests/08-resources-network/resources-network.spec.js` | CT-028 |
| 09 — Responsividade e acessibilidade | `tests/09-responsive-accessibility/responsive-accessibility.spec.js` | CT-029 a CT-032 |
| 10 — Compatibilidade e desempenho | `tests/10-compatibility-performance/compatibility-performance.spec.js` | CT-033 e CT-036 |
| 11 — Regressão integrada | `tests/11-integrated-regression/README.md` | Composição dos casos determinísticos marcados `@regression`; não duplica IDs |

Os testes iniciais CT-001 a CT-005 permanecem em `tests/01-e2e/`, `tests/02-static-resources/` e `tests/03-network/`. A configuração Playwright usa `testDir: ./tests` e procura recursivamente `*.spec.js`; portanto, `npm test` inclui as suítes novas e os cinco casos iniciais.

## Critérios de execução

Os antigos `test.fixme` foram substituídos por assertions conforme a linha de base de QA em [criterios-padrao-execucao.md](criterios-padrao-execucao.md). Essa linha de base torna os cenários executáveis sem declarar regras comerciais ou decisões de produto como aprovadas. As perguntas de negócio em `docs/auditoria/perguntas-pendentes.md` continuam abertas.

### Reexecução e evidências

- `npm test` executa todos os CTs na cópia local de `app/`, inicia o servidor estático em loopback e grava cada execução em uma pasta própria de `qa/reports/`.
- O runner salva JSON bruto, relatório nativo, screenshots por cenário, traces em falhas e gera `report.json`, `report.html`, `report.xlsx` e um card HTML por CT. O comando mantém o status diferente de zero quando há assertions reprovadas, depois de salvar os resultados.
- `npm run test:report` abre o relatório HTML nativo mais recente.
- Para completar as evidências JPEG obrigatórias, execute `node qa/scripts/serve-report.cjs <executionId>`, capture cada página `/evidence/CT-xxx.html` por Playwright MCP em `evidence/CT-xxx.jpg` e execute `npm run qa:report -- <executionId>` para atualizar os links do relatório e da planilha.
- Para usar um preview isolado, informe `BASE_URL` explicitamente. A configuração não permite o host conhecido de produção como destino.

**Resultado da execução mais recente:** 36 cenários executados; 27 passaram, 9 falharam e 0 ficaram pendentes. CTs reprovados: CT-011, CT-019, CT-020, CT-022, CT-029, CT-030, CT-031, CT-032, CT-034. O veredito usa a linha de base de QA e não confirma decisões comerciais.

## Ambiente e artefatos

As suítes de interface usam a cópia local de app/ por padrão: npm test inicia um servidor isolado em loopback e grava os artefatos em qa/reports/full-suite-local-20261024T231124284Z/. Um preview alternativo só é usado quando BASE_URL é informado explicitamente; o host de produção é bloqueado.

Artefatos: [relatório visual](../../qa/reports/full-suite-local-20261024T231124284Z/report.html), [report.json](../../qa/reports/full-suite-local-20261024T231124284Z/report.json), [raw.json](../../qa/reports/full-suite-local-20261024T231124284Z/raw.json), [report.xlsx](../../qa/reports/full-suite-local-20261024T231124284Z/report.xlsx), [relatório nativo do Playwright](../../qa/reports/full-suite-local-20261024T231124284Z/playwright-report/index.html) e cards em qa/reports/full-suite-local-20261024T231124284Z/evidence/.

Os cenários aprovados, reprovados e pendentes constam no relatório; nenhum resultado é inferido por ausência de erro. A rodada local não confirma comportamento em produção.