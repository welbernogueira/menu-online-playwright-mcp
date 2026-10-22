# Suítes automatizadas — Menu On-Line

**Estado da execução (2026-10-22-full-suite-local-05):** a suíte completa descobriu 36 CTs; 19 passaram, 0 falharam e 17 ficaram PENDENTE por test.fixme. CT-001 a CT-005 e CT-006 a CT-036 foram incluídos na execução.

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

## Critérios ainda pendentes

Os casos abaixo estão registrados como `test.fixme` com a pergunta que impede um veredito de aceitação. Eles aparecem como pendentes/bloqueados no relatório e não fazem assertions sobre uma regra presumida:

- CT-008: referência aprovada para conteúdo institucional.
- CT-017: regra da taxa e cálculo de entrega.
- CT-018 a CT-020: campos obrigatórios, UF e formato de CEP.
- CT-022: comportamento quando ViaCEP não encontra o CEP ou fica indisponível.
- CT-023 e CT-024: complemento e preservação do endereço ao voltar.
- CT-025 e CT-026: destino e conteúdo oficial de pedido, reserva e telefone.
- CT-029 a CT-034: tolerâncias de viewport, toque, alvo de acessibilidade, navegadores e política de privacidade.
- CT-036: métrica e orçamento de desempenho.

CT-006, CT-007, CT-009 a CT-016, CT-021, CT-027, CT-028 e CT-035 têm assertions implementadas. A existência de assertions não representa execução ou aprovação.

## Ambiente e artefatos

As suítes de interface exigem BASE_URL explícito e pulam se o alvo for o host de produção conhecido. A execução 2026-10-22-full-suite-local-05 usou a cópia estática local em app/ com BASE_URL=http://127.0.0.1:8765/, Chromium, npm.cmd test e uma configuração por execução em qa/reports/2026-10-22-full-suite-local-05/execution-config.cjs. A configuração oficial do projeto não foi alterada.

O Playwright MCP disponível oferece ações de navegador, mas não inicia a suíte Node/Playwright. A suíte completa foi executada pelo Playwright Test CLI como alternativa compatível; o MCP foi usado para navegação exploratória local e para gerar os cards JPEG da execução.

Artefatos: [relatório visual](../../qa/reports/2026-10-22-full-suite-local-05/report.html), [report.json](../../qa/reports/2026-10-22-full-suite-local-05/report.json), [raw.json](../../qa/reports/2026-10-22-full-suite-local-05/raw.json), [report.xlsx](../../qa/reports/2026-10-22-full-suite-local-05/report.xlsx), [relatório nativo do Playwright](../../qa/reports/2026-10-22-full-suite-local-05/playwright-report/index.html) e cards em qa/reports/2026-10-22-full-suite-local-05/evidence/.

CT-001 a CT-005: PASSOU. CT-006, CT-007, CT-009 a CT-016, CT-021, CT-027, CT-028 e CT-035: PASSOU. CT-008, CT-017 a CT-020, CT-022 a CT-026, CT-029 a CT-034 e CT-036: PENDENTE, com motivo registrado em raw.json e nos cards. Os testes PENDENTE não receberam veredito funcional.