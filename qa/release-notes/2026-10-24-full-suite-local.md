# Release notes de QA — suíte completa local

**Data:** 24/10/2026
**Execução:** `full-suite-local-20261024T203731415Z`
**Alvo:** cópia local de `app/`, servida em `http://127.0.0.1:8765/`
**Navegador:** Chromium
**Resultado:** 36 cenários executados; 28 passaram, 8 falharam, 0 ficaram pendentes.

## Ajustes realizados nesta entrega

- Criada a linha de base provisória de QA em [`docs/testes/criterios-padrao-execucao.md`](../../docs/testes/criterios-padrao-execucao.md) para liberar os cenários que estavam marcados como `test.fixme`. Ela permite regressão reproduzível, sem transformar hipóteses em regras comerciais aprovadas.
- Removidos os bloqueios `test.fixme`; os 36 cenários foram executados na suíte completa.
- Ajustado o fluxo de execução para iniciar e encerrar um servidor local isolado, usar a cópia de `app/` por padrão e bloquear o host de produção. Um preview só é alvo com `BASE_URL` explícito.
- Automatizada a geração e sincronização dos resultados e relatórios, inclusive quando há falhas; o código de saída continua indicando reprovação da suíte.
- Ampliada a validação de campos vazios/somente espaços e dos formatos de CEP. As respostas do ViaCEP usadas nesses cenários são determinísticas e mockadas.
- **Nenhum arquivo da aplicação em `app/` foi alterado para fazer os testes passarem.** Os ajustes foram na documentação, nos testes e na infraestrutura de QA.

## Reprovações e novos achados

Os itens abaixo falharam contra a linha de base documentada. São achados da cópia local nesta execução; a rodada não verificou a versão publicada.

| Cenário | Achado observado |
|---|---|
| CT-019 — UF obrigatória | O placeholder de UF permite avançar sem uma seleção válida e não há indicação/foco de validação suficiente. |
| CT-020 — Formato do CEP | O CEP mascarado não é normalizado como esperado e entradas com tamanho/formato inválido são aceitas. |
| CT-022 — Falha de rede no ViaCEP | A falha de rede não apresenta feedback recuperável; o fluxo de CEP inexistente mockado passou. |
| CT-029 — Layout responsivo | Há rolagem horizontal involuntária nas larguras verificadas: 320, 768, 1024 e 1366 px. |
| CT-030 — Interação por toque | Controles de quantidade/adição não ficam descobríveis ou operáveis sem depender de hover. |
| CT-031 — Teclado e modal | Controles principais não são alcançáveis/ativáveis por teclado e Escape não fecha o modal. O estilo de foco visível continua fora do critério automatizado desta rodada. |
| CT-032 — Semântica e nomes acessíveis | O idioma do documento não está declarado como `pt-BR`; campos de endereço não têm rótulos programáticos e ações não têm nomes acessíveis adequados. |
| CT-034 — Dados no console | Logs de console ao montar a revisão incluem endereço, CEP, complemento ou conteúdo do pedido sintético. |

Esses resultados são divergências verificadas frente à linha de base de QA, não uma aprovação ou reprovação comercial do produto. A suíte local não confirma o estado da produção. Decisões ainda abertas continuam em [`docs/auditoria/perguntas-pendentes.md`](../../docs/auditoria/perguntas-pendentes.md).

## Evidências da execução

- [Relatório visual](../reports/full-suite-local-20261024T203731415Z/report.html)
- [Relatório nativo do Playwright](../reports/full-suite-local-20261024T203731415Z/playwright-report/index.html)
- [Dados normalizados](../reports/full-suite-local-20261024T203731415Z/report.json) e [dados brutos](../reports/full-suite-local-20261024T203731415Z/raw.json)
- [Planilha da execução](../reports/full-suite-local-20261024T203731415Z/report.xlsx)
- Cards HTML e JPEG por cenário: `qa/reports/full-suite-local-20261024T203731415Z/evidence/CT-001` a `CT-036`.

A verificação dos artefatos encontrou 36 cards HTML, 36 JPEGs válidos, screenshots originais do app para 35 cenários, JSON bruto e normalizado, relatório HTML nativo, planilha e links documentais consistentes. CT-035 é uma checagem estática e não requer screenshot da aplicação.

## Higiene do repositório

- Removidos os 201 snapshots intermediários acumulados em `.playwright-mcp/` e o `debug.log` temporário do Chromium. Os dois caminhos foram adicionados ao `.gitignore`. Os relatórios e evidências em `qa/reports/` foram preservados.

## Limitações

- O resultado vale para a cópia local e a configuração informadas; não é uma execução de produção.
- A linha de base é provisória de QA. Preços, destinos externos, conteúdo e demais decisões de negócio ainda precisam de confirmação do responsável de produto.
- O CT-031 não verifica visualmente o indicador de foco, e a suíte não substitui uma auditoria completa com leitor de tela ou dispositivos físicos.
