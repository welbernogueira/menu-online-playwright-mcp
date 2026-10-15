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

**Estado da implementação:** CT-001 a CT-005 estão automatizados em Playwright Test. Nenhum defeito da aplicação foi corrigido.

**Estado da execução:** registrar abaixo somente resultados de execuções efetivamente realizadas. A suíte usa Chromium e, por padrão, `https://menu-online-project.vercel.app/`; `BASE_URL` pode substituir o destino. CT-001 e CT-005 não interagem com o carrinho nem concluem pedidos.

**Evidências da suíte:** o relatório HTML é produzido em `playwright-report/`; screenshots e traces de falhas são salvos em `test-results/`.

**Linha de base publicada antes das correções locais (14/10/2026):** 2 testes passaram (CT-001, CT-005) e 3 testes de aceitação falharam (CT-002, CT-003, CT-004) contra o `BASE_URL` padrão. Os três resultados FAIL correspondiam a BUG-001/002/003. CT-004 não identificou 404 fora da linha de base conhecida.

**Execução automatizada pós-correção local (14/10/2026):** suíte completa executada com `BASE_URL=http://127.0.0.1:8765/`: 3 testes passaram (CT-001, CT-002, CT-005) e 2 falharam (CT-003, CT-004). CT-002 confirmou carregamento local das duas fontes. CT-003/CT-004 falharam apenas pelo BUG-003 (`/img`); nenhum 404 novo foi encontrado. A suíte retorna código diferente de zero enquanto BUG-003 continuar impedindo o critério de aceitação.

**Linha de base e defeitos:** `tests/support/known-issues.js` continua identificando os três defeitos originais. BUG-001/002 foram corrigidos e validados localmente, mas permanecem na lista até validação da versão publicada. Os testes anexam observações de rede ao relatório e não convertem falhas de aceitação em aprovação. Nenhuma falha 404 nova foi encontrada na execução local.

## Escopo e ambiente

- **Página:** `https://menu-online-project.vercel.app/`
- **Recursos sob observação:** `css/main.css`, `css/responsivo.css`, fontes Poppins e imagens referenciadas.
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
- **Pré-condições:** Página inicial e `css/main.css` carregados; rede/console disponíveis.
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
- **Estado da execução automatizada:** FAIL antes e depois das correções locais; o ambiente pós-correção `http://127.0.0.1:8765/` requisitou `/img` e recebeu 404.
- **Pré-condições:** Página inicial e `css/main.css` carregados; rede disponível.
- **Passos:**
  1. Abrir a página inicial.
  2. Registrar a requisição de imagem iniciada pela regra `.background-depoimentos`.
  3. Inspecionar a URL computada e a exibição visual da seção.
  4. Repetir após eventual correção publicada.
- **Resultado esperado antes da correção:** Registrar o comportamento atual e o recurso requisitado.
- **Resultado esperado depois da correção:** A imagem escolhida para a seção responde com sucesso e aparece no fundo, sem 404.
- **Evidência:** O relatório HTML inclui `ct-003-background-baseline.json` com URL computada e resposta HTTP. O teste não presume qual arquivo deveria ser usado.
- **Limitação:** A imagem de fundo pretendida não foi identificada. BUG-003 permanece aberto.

## CT-004 — Ausência de 404 para recursos esperados

- **Arquivo:** `tests/03-network/unexpected-404.spec.js`.
- **Estado da implementação:** Implementado como teste de aceitação e classificador da linha de base.
- **Estado da execução:** FAIL na linha de base publicada com os três 404 conhecidos. Após correção local, FAIL somente pelo `/img` (BUG-003); a verificação separada de 404 não documentados passou e nenhum erro novo foi observado.
- **Pré-condições:** Lista de recursos esperados definida para a página inicial; navegador com registro de rede limpo ou identificável por navegação.
- **Passos:**
  1. Carregar a página inicial.
  2. Registrar as requisições de CSS, fontes, imagens e scripts esperados.
  3. Separar respostas de erro das respostas de sucesso/cache (`2xx`/`304`).
  4. Repetir após eventual correção publicada.
- **Resultado esperado antes da correção:** Identificar e documentar as falhas existentes sem classificá-las como resolvidas.
- **Resultado esperado depois da correção:** Nenhuma requisição de recurso esperado retorna `404`; demais recursos são avaliados conforme o status esperado para cada tipo.
- **Evidência:** O relatório HTML inclui `ct-004-network-baseline.json`, com as respostas HTTP, classificação dos 404 conhecidos e lista de 404 inesperados. O coletor usa um único evento de resposta e deduplica por objeto de requisição.
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
