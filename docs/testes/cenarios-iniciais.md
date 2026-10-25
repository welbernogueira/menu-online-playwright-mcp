# Cenários iniciais de teste — Menu On-Line

**Estrutura da suíte:** `01-e2e/` contém verificações de interface, não fluxos integrados de negócio; `02-static-resources/` verifica recursos estáticos; `03-network/` verifica respostas HTTP; `support/` centraliza a linha de base conhecida.

```text
tests/
├── 01-e2e/
│   ├── home.spec.js                 # CT-001
│   └── products.spec.js             # CT-005
├── 02-static-resources/
│   ├── fonts.spec.js                # CT-002
│   └── testimonial-background.spec.js # CT-003
├── 03-network/
│   └── unexpected-404.spec.js       # CT-004
└── support/
    └── known-issues.js
```

**Estado da implementação:** CT-001 a CT-005 estão automatizados em Playwright Test. BUG-003 foi corrigido no código local; a versão publicada ainda não contém a correção.

**Estado da execução:** última suíte completa full-suite-local-20261024T231124284Z, com alvo http://127.0.0.1:8765/ e Chromium. Os resultados dos CTs iniciais estão na tabela mais recente.

**Evidências da suíte:** o relatório HTML é produzido em `qa/reports/latest/playwright-report/`; screenshots e traces de falhas são salvos em `qa/reports/latest/test-results/`.

**Execuções históricas preservadas:** a execução inicial está em `qa/reports/archive/2026-10-19-initial-attempt/playwright-report/`; o relatório da execução local aprovada está em `qa/reports/archive/2026-10-19-post-fix-validation/playwright-report/`.

**Linha de base publicada antes das correções locais (14/10/2026):** 2 testes passaram (CT-001, CT-005) e 3 testes de aceitação falharam (CT-002, CT-003, CT-004) contra o `BASE_URL` padrão. Os três resultados FAIL correspondiam a BUG-001/002/003. CT-004 não identificou 404 fora da linha de base conhecida.

**Execução automatizada pós-correção local (14/10/2026):** suíte completa executada com `BASE_URL=http://127.0.0.1:8765/`: 3 testes passaram (CT-001, CT-002, CT-005) e 2 falharam (CT-003, CT-004). CT-002 confirmou carregamento local das duas fontes. CT-003/CT-004 falharam apenas pelo BUG-003 (`/img`); nenhum 404 novo foi encontrado. A suíte retorna código diferente de zero enquanto BUG-003 continuar impedindo o critério de aceitação.

**Execução automatizada após a correção do BUG-003 (19/10/2026):** `npm.cmd test` com `BASE_URL=http://127.0.0.1:8765/` no preview local: 5 passaram (CT-001 a CT-005), 0 falharam. CT-003 confirmou que o CSS computado não define imagem de fundo, que `/img` não foi solicitado, que o card mantém 390 × 390 px, raio de 120 px, posição absoluta à esquerda e cor `#ffe8a3`, e que `pizzas.png` carregou (`naturalWidth > 0`, resposta HTTP abaixo de 400). CT-004 não observou 404. Na primeira tentativa, CT-003 falhou por exigir visibilidade da imagem animada/responsiva; o critério foi ajustado para verificar carregamento, e a repetição da suíte completa passou.

**Verificação publicada (19/10/2026):** inspeção exploratória com Playwright MCP, separada dos testes automatizados, ainda encontrou `/img` e as duas URLs antigas de fontes respondendo 404. `pizzas.png` respondeu 200 e carregou. Nenhuma correção é considerada confirmada em produção.

**Linha de base e defeitos:** `tests/support/known-issues.js` identifica as três URLs da linha de base histórica para diagnóstico. CT-004 classifica separadamente 404 históricos e novos, e reprova ambos; assim, a classificação não isenta uma regressão de um recurso já corrigido. A execução local de 19/10 não encontrou 404.

## Execução completa mais recente — 24/10/2026

| Cenário | Veredito | Evidência |
|---|---|---|
| CT-001 | PASSOU | [Card HTML](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-001.html) · [JPEG](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-001.jpg) |
| CT-002 | PASSOU | [Card HTML](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-002.html) · [JPEG](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-002.jpg) |
| CT-003 | PASSOU | [Card HTML](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-003.html) · [JPEG](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-003.jpg) |
| CT-004 | PASSOU | [Card HTML](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-004.html) · [JPEG](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-004.jpg) |
| CT-005 | PASSOU | [Card HTML](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-005.html) · [JPEG](../../qa/reports/full-suite-local-20261024T231124284Z/evidence/CT-005.jpg) |

A execução completa teve 36 cenários: 27 passaram, 9 falharam e 0 ficaram pendentes. Consulte o [relatório geral](../../qa/reports/full-suite-local-20261024T231124284Z/report.html). A execução local não valida produção.

## Execução completa anterior em 22/10/2026

| Cenário | Veredito | Evidência |
|---|---|---|
| CT-001 | PASSOU | [Card HTML](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-001.html) · [JPEG](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-001.jpg) |
| CT-002 | PASSOU | [Card HTML](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-002.html) · [JPEG](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-002.jpg) |
| CT-003 | PASSOU | [Card HTML](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-003.html) · [JPEG](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-003.jpg) |
| CT-004 | PASSOU | [Card HTML](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-004.html) · [JPEG](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-004.jpg) |
| CT-005 | PASSOU | [Card HTML](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-005.html) · [JPEG](../../qa/reports/2026-10-22-full-suite-local-05/evidence/CT-005.jpg) |

A execução integrou CT-001 a CT-005 à suíte completa local. Os cinco passaram no Chromium. O relatório geral está em [report.html](../../qa/reports/2026-10-22-full-suite-local-05/report.html); não houve validação de produção nesta rodada.

## Escopo e ambiente

- **Página:** `https://menu-online-project.vercel.app/`
- **Recursos sob observação:** `app/css/main.css`, `app/css/responsivo.css`, fontes Poppins e imagens referenciadas.
- **Evidências a coletar:** URL completa, método e status HTTP das requisições relevantes; mensagens do console; estado de carregamento das fontes/imagens; captura da exibição da página e dos produtos.
- **Observação:** comparar execução antes e depois de uma eventual correção. O estado “antes” disponível é o registro exploratório anterior; a execução controlada destes cenários ainda está pendente.

## CT-001 — Carregamento da página inicial

- **Arquivo:** `tests/01-e2e/home.spec.js`.
- **Estado da implementação:** Implementado.
- **Estado da execução automatizada:** PASS em 14/10/2026. A página abriu com título `Menu On-Line`, heading principal visível e link de navegação `Cardápio` visível.
- **Limitação:** A validação automatizada deste cenário verifica carregamento e conteúdo principal. Os 404 dos recursos são tratados separadamente por CT-002 a CT-004.
- **Pré-condições:** Site publicado acessível e navegador com console e rede disponíveis.
- **Passos:**
  1. Abrir a URL da página inicial.
  2. Aguardar o conteúdo principal carregar.
  3. Registrar título, URL final, erros de console e falhas de requisições.
- **Resultado esperado:** A página inicial abre e apresenta conteúdo, sem falhas que impeçam a navegação ou a leitura do menu.
- **Evidência:** Assertions de título, heading e link concluíram com sucesso; execução registrada no relatório HTML.
- **Limitação:** A página ainda registra os três 404 conhecidos; eles não impedem o conteúdo principal verificado neste cenário.

## CT-002 — Carregamento de Poppins Regular e Medium

- **Arquivo:** `tests/02-static-resources/fonts.spec.js`.
- **Estado da implementação:** Implementado como teste de aceitação.
- **Estado da execução:** FAIL na linha de base publicada anterior às correções; PASS em servidor local após correção em 14/10/2026. As duas fontes carregaram localmente.
- **Pré-condições:** Página inicial e `app/css/main.css` carregados; rede/console disponíveis.
- **Passos:**
  1. Abrir a página inicial e filtrar as requisições por `Poppins-Regular.otf` e `Poppins-Medium.otf`.
  2. Registrar URL completa, status HTTP e tipo de recurso.
  3. Consultar o console e o estado das fontes no navegador.
  4. Repetir após eventual correção publicada.
- **Resultado esperado antes da correção:** Reproduzir e registrar o estado atual, sem presumir resultado além das evidências existentes.
- **Resultado esperado depois da correção:** As URLs corretas das duas fontes respondem com sucesso, sem 404; o navegador não marca as fontes como erro.
- **Evidência:** O relatório pós-correção inclui `ct-002-font-baseline.json` com URLs, status HTTP e faces carregadas; as assertions de aceitação passaram no ambiente local.
- **Limitação:** O domínio publicado ainda não foi implantado/validado após a alteração. BUG-001/002 permanecem abertos para publicação. A aparência tipográfica esperada ainda depende de critério visual.

## CT-003 — Carregamento do fundo dos depoimentos

- **Arquivo:** `tests/02-static-resources/testimonial-background.spec.js`.
- **Estado da implementação:** Implementado como teste de aceitação.
- **Estado da execução automatizada:** PASS na suíte local de 19/10/2026 após a correção; a linha de base de 14/10 havia falhado porque `/img` retornava 404.
- **Pré-condições:** Página inicial e `app/css/main.css` carregados; rede disponível.
- **Passos:**
  1. Abrir a página inicial.
  2. Confirmar que o estilo computado não define imagem de fundo e que não há requisição para `/img`.
  3. Conferir dimensões, raio, cor e posicionamento do card decorativo.
  4. Confirmar a resposta da requisição e o carregamento (`naturalWidth > 0`) de `./img/pizzas.png`.
- **Resultado esperado:** Nenhuma requisição para `/img`; o card mede 390 × 390 px, tem raio de 120 px, cor `#ffe8a3`, posição absoluta à esquerda; `pizzas.png` carrega sem erro.
- **Evidência:** `ct-003-background-baseline.json` registra estilo computado, estilo do card, requisições inválidas, URL/status da pizza e `naturalWidth`.
- **Resultado local (19/10/2026):** PASS. A imagem não precisa estar visível no viewport para comprovar o carregamento; classes responsivas e animações podem ocultá-la até a seção entrar em foco.
- **Limitação:** A versão publicada ainda requisita `/img` e não recebeu a correção.

## CT-004 — Ausência de 404 para recursos esperados

- **Arquivo:** `tests/03-network/unexpected-404.spec.js`.
- **Estado da implementação:** Implementado como teste de aceitação e classificador da linha de base.
- **Estado da execução:** PASS local em 19/10/2026, sem respostas 404. A linha de base publicada de 14/10 falhou com três 404; a inspeção publicada de 19/10 ainda confirmou os defeitos de fontes e `/img` antes de implantação.
- **Pré-condições:** Lista de recursos esperados definida para a página inicial; navegador com registro de rede limpo ou identificável por navegação.
- **Passos:**
  1. Carregar a página inicial.
  2. Registrar as requisições de CSS, fontes, imagens e scripts esperados.
  3. Separar respostas de erro das respostas de sucesso/cache (`2xx`/`304`).
  4. Repetir após eventual correção publicada.
- **Resultado esperado antes da correção:** Identificar e documentar as falhas existentes sem classificá-las como resolvidas.
- **Resultado esperado depois da correção:** Nenhuma requisição de recurso esperado retorna `404`; demais recursos são avaliados conforme o status esperado para cada tipo.
- **Evidência:** O relatório HTML inclui `ct-004-network-baseline.json`, com respostas HTTP, classificação dos 404 históricos e lista de 404 não documentados. A aprovação exige que ambas as listas e o conjunto total de respostas 404 estejam vazios; o coletor deduplica por objeto de requisição.
- **Limitação:** A coleta cobre as respostas observadas durante o carregamento da página inicial no ambiente indicado por `BASE_URL`.

## CT-005 — Preservação da exibição dos produtos

- **Arquivo:** `tests/01-e2e/products.spec.js`.
- **Estado da implementação:** Implementado.
- **Estado da execução automatizada:** PASS na linha de base publicada e após correção local em 14/10/2026. Foram encontrados oito cards com nomes e preços esperados; cada imagem estava visível e carregada (`naturalWidth > 0`). Nenhuma interação com o carrinho foi realizada.
- **Pré-condições:** Página inicial acessível; execução sem interação com controles do carrinho.
- **Passos:**
  1. Carregar a página inicial antes de eventual correção e registrar produtos, nomes, preços e imagens visíveis.
  2. Repetir a inspeção depois de eventual correção, sem clicar em controles de adicionar/remover ou no carrinho.
  3. Comparar presença e carregamento dos produtos exibidos.
- **Resultado esperado:** Os produtos que a aplicação deve apresentar continuam visíveis, com nomes e preços, e suas imagens esperadas carregam antes e depois da correção.
- **Evidência:** As assertions de oito cards, nomes, preços e largura natural positiva das imagens passaram; execução registrada no relatório HTML.
- **Limitação:** O teste valida os oito itens apresentados na página inicial, sem comparar o catálogo completo nem executar fluxos de compra.

## Critério de encerramento

Após eventual correção e implantação, repetir a suíte no site publicado, confirmar o sucesso dos critérios de aceitação CT-002 a CT-004 e atualizar a linha de base removendo apenas os defeitos efetivamente resolvidos. Não marcar defeitos como resolvidos apenas por alteração local.
