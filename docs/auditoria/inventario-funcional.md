# Inventário funcional e técnico — Menu On-Line

**Data da auditoria:** 19/10/2026 (BRT)

**Escopo:** descoberta, leitura de código e exploração segura. Nenhum teste automatizado foi executado nesta auditoria; não houve alteração na aplicação, nos testes existentes, no repositório oficial da aplicação, nem publicação.

## Identificação dos projetos e linha de versão

| Projeto | Identificação observada | Evidência |
|---|---|---|
| Repositório de QA em análise | Raiz local menuOnline-project-main; remoto welbernogueira/menu-online-playwright-mcp; branch main; HEAD local 21bd659 (fix: remove invalid testimonials image request). O origin/main observado ainda estava em a386c3e (chore: initialize Menu On-Line Playwright MCP project). | git remote -v, git branch, git rev-parse; configuração e arquivos de QA no repositório local. |
| Repositório oficial da aplicação | welbernogueira/menuOnline-project, público, branch main; último commit exibido durante a inspeção: f1bff39, “fix: correct font paths and testimonials background”. Não foi clonado nem alterado. | [Repositório oficial](https://github.com/welbernogueira/menuOnline-project) e [commit de correção](https://github.com/welbernogueira/menuOnline-project/commit/f1bff398c3e744dd451f94a191e94fd12cde2e01). A listagem mostra css, fonts, img, js e index.html. |
| Aplicação publicada | https://menu-online-project.vercel.app/. A navegação da auditoria encontrou a versão corrigida para fontes e fundo dos depoimentos. | [Site publicado](https://menu-online-project.vercel.app/); observação com Playwright MCP em 19/10/2026, aproximadamente 23:49 BRT. |

Os arquivos de HTML/CSS/JavaScript presentes no repositório de QA são uma cópia local útil para inspeção e execução da suíte. Eles não são o repositório oficial. O código de app/js/app.js e a correção de CSS foram conferidos também na interface pública do GitHub. A auditoria não fez checkout, commit, push ou deploy.

## Arquitetura e arquivos relevantes

| Área | Arquivos | Constatação |
|---|---|---|
| Página e conteúdo | app/index.html:1-610 | Uma página estática com âncoras para Reservas, Serviços, Cardápio e Depoimentos, mais o modal do carrinho. O idioma declarado no HTML é en, embora o conteúdo esteja em português. |
| Estilo | app/css/main.css, app/css/responsivo.css | Estilos gerais e um breakpoint mobile em max-width: 767px. As regras de exibição dos controles de quantidade dependem de :hover em app/css/main.css:274-330. |
| Lógica | app/js/app.js | Estado global do carrinho/endereço, filtragem do menu, cálculo de valores, validação, consulta de CEP, criação de links para telefone e WhatsApp e troca de depoimentos. |
| Dados | app/js/dados.js | Catálogo estático com seis categorias e 12 produtos por categoria, totalizando 72 registros. Os preços são números e cada registro possui id, nome, descrição e caminho de imagem. |
| Recursos | app/img/, app/fonts/ | Fotos dos produtos e imagens institucionais locais, SVGs, ícones, Poppins Regular e Medium. A inspeção da árvore e das referências locais não encontrou imagem de produto ausente. |
| Bibliotecas de interface | app/js/jquery-1.12.4.min.js, app/js/bootstrap.min.js, app/js/popper.min.js, app/js/modernizr-3.5.0.min.js, app/js/wow.min.js; CSS Bootstrap, Font Awesome e Animate | Arquivos versionados junto da página; não são instalados por npm. |
| Projeto de automação | package.json, package-lock.json, playwright.config.js, tests/ | @playwright/test é a dependência de desenvolvimento declarada. A configuração usa Chromium, execução paralela, relatório de lista/HTML e BASE_URL; o padrão é o domínio publicado. |
| MCP e documentação de QA | .vscode/mcp.json, docs/bugs/bugs-identificados.md, docs/testes/cenarios-iniciais.md | O MCP configurado usa npx -y @playwright/mcp@latest. Os documentos existentes têm histórico de defeitos e execução; seus estados publicados precisam ser reconciliados com a inspeção atual. |

Não foram encontrados, na árvore inspecionada do QA, rotas de servidor, backend, autenticação, autorização, processamento de pagamento, persistência remota, pipeline de CI ou configuração de deploy da aplicação. Isso descreve somente o escopo de arquivos observado; não prova que não haja recursos configurados fora desses repositórios.

## Catálogo de funcionalidades

| ID | Funcionalidade e localização | Objetivo aparente, ações e dados | Regras e estados encontrados | Dependências, observação e incerteza |
|---|---|---|---|---|
| F-01 | Cabeçalho e navegação — app/index.html:27-68 | Navegar por âncoras para Reservas, Serviços, Cardápio e Depoimentos; abrir o carrinho. Em largura mobile, um botão abre o menu colapsável. | Navegação pela mesma página. O seletor mobile abre com sucesso na viewport 390 × 844; os links aparecem depois da abertura. | Bootstrap local. A execução por teclado e o foco do botão não foram auditados. |
| F-02 | Banner, telefone e redes — app/index.html:71-145, app/js/app.js:473-484 | Mostrar chamada principal, âncora para o cardápio, botão de telefone, Instagram, WhatsApp abreviado, LinkedIn e GitHub. | O telefone é preenchido como link tel: usando o número definido no JavaScript. | Links externos e número de telefone não foram acionados; validade, titularidade e destino atual dependem de confirmação. |
| F-03 | Serviços — app/index.html:149-190 | Exibir três cartões informativos: facilidade para pedir, entrega e qualidade. | Conteúdo estático, sem controles ou formulário. | Não há regra funcional ou integração encontrada. |
| F-04 | Categorias e catálogo — app/index.html:192-237, app/js/app.js:23-53, app/js/dados.js | Mostrar Burgers, Pizzas, Churrasco, Steaks, Bebidas e Sobremesas. Cada categoria substitui os cards exibidos. | Cada categoria contém 12 itens no dado local. A carga inicial mostra os oito primeiros. Todas as seis categorias foram selecionadas no site publicado e apresentaram oito cards. | Dados e imagens são estáticos. Não foi identificada pesquisa, ordenação, disponibilidade ou filtro adicional. A precisão comercial dos dados não foi validada. |
| F-05 | “Ver mais” — app/index.html:234, app/js/app.js:38-60 | Acrescentar os itens restantes da categoria ativa. | Ao acionar, são acrescentados os índices 8 a 11 e o controle é ocultado. Em Pizzas, a exploração observou 8 → 12 itens. Trocar de categoria volta à primeira página de oito itens. | A página também registra um listener para .btnVerMais, mas o elemento tem id btnVerMais; a chamada inline observada permite que a ação funcione apesar do listener sem correspondência. |
| F-06 | Quantidade e adição de produto — app/js/app.js:63-119 e template em app/js/app.js | Incrementar/decrementar quantidade local e adicionar item selecionado ao carrinho. | Quantidade inicial 0; decremento não reduz abaixo de 0; adicionar só faz algo quando a quantidade é maior que 0; produto repetido soma quantidades; após adicionar, contador volta a 0 e o badge é atualizado. Um produto foi adicionado apenas ao estado temporário do navegador e exibiu confirmação. | Estado em memória do navegador. O controle fica escondido por CSS até :hover; disponibilidade e descobribilidade em toque precisam ser confirmadas. |
| F-07 | Carrinho — app/index.html:415-435, 566-600, app/js/app.js:121-300 | Abrir/fechar modal, ver item, ajustar quantidade, remover, ver badge e valores. | Carrinho vazio mostra mensagem e bloqueia “Continuar”. Com um item de R$ 99,00, a exploração observou subtotal R$ 99,00, entrega R$ 5,00 e total R$ 104,00. A taxa é constante no código. | Lista e valores são mantidos em memória; não foi encontrada persistência local. Comportamento ao recarregar é inferido do código, não uma regra de produto confirmada. |
| F-08 | Endereço e consulta de CEP — app/index.html:437-518, app/js/app.js:303-350 | Informar CEP, endereço, bairro, número, cidade, complemento e UF; consultar endereço pelo CEP ou digitar manualmente. | A consulta remove caracteres não numéricos e exige oito dígitos antes de chamar ViaCEP. A consulta preenche logradouro, bairro, cidade e UF; CEP não encontrado orienta preenchimento manual. Complemento é opcional no validador. | Chamada JSONP pública para ViaCEP. Falha de rede/timeout não tem handler .fail nem indicação clara de carregamento identificada no código. A integração não foi acionada nesta auditoria. |
| F-09 | Revisão e preparo do pedido — app/index.html:525-600, app/js/app.js:352-471 | Exibir itens, endereço e total, montar mensagem e endereço wa.me para o pedido. | A validação customizada bloqueia campos textuais vazios, mas verifica CEP apenas como não vazio e UF apenas por comprimento. O placeholder de UF tem valor -1 e passa. A etapa de resumo foi alcançada usando exclusivamente dados sintéticos; o link “Enviar pedido” não foi acionado. | O código registra a mensagem completa em console.log, incluindo dados de endereço e CEP. A conclusão ocorre fora do site via WhatsApp; envio não foi testado. |
| F-10 | Depoimentos — app/index.html:241-337, app/js/app.js:487+ | Apresentar três relatos e trocar o relato ativo pelos seletores 1, 2 e 3. | Troca de nome, nota, texto e botão ativo observada para seletores 2 e 3. | Conteúdo estático. O seletor 2 tem uma aspa excedente no atributo de origem (app/index.html:332), mas o navegador expôs e executou o handler; risco de manutenção, não falha observada. |
| F-11 | Reserva — app/index.html:339-365, app/js/app.js:475-480 | Apresentar chamada de reserva e preparar link de WhatsApp com mensagem fixa. | O link é preenchido no início e abre nova aba. Não há formulário de data ou horário no HTML observado. | Não foi aberto o WhatsApp. Regras de reserva, horários e confirmação dependem do negócio. |
| F-12 | Rodapé — app/index.html:367-413 | Mostrar copyright e repetir links de redes. | Conteúdo estático com links externos. | Não foi confirmada validade dos destinos; nenhum link externo foi acionado. |
| F-13 | Layout responsivo e acessibilidade observável — app/css/responsivo.css, app/index.html | Adaptar navegação, banner, catálogo, depoimentos, reserva, rodapé e modal para telas menores. | Em 390 × 844, não houve overflow horizontal e o menu móvel abriu. A coluna ilustrativa de Depoimentos desaparece no mobile. | Não houve varredura completa de tamanhos, orientação, teclado, leitores de tela, contraste ou zoom. Há sinais de risco semântico descritos em riscos-e-lacunas.md. |
| F-14 | Recursos e carregamento — app/css/main.css:1-9,341-364, app/index.html, assets | Carregar fontes, imagens, scripts e estilos necessários. | No site atual, as duas fontes Poppins responderam 200 e ficaram carregadas; não foi solicitada a URL /img; pizzas.png carregou com naturalWidth 600; consola da página publicou zero erros e zero avisos na navegação inicial observada. | Esta evidência é uma observação exploratória pontual, não uma execução da suíte nem garantia de todas as rotas ou redes. |

## Persistência, serviços e recursos externos

- Carrinho, endereço e total são variáveis JavaScript em memória (app/js/app.js:3-9). Não foi observado uso de localStorage, sessionStorage, cookies próprios ou API de backend na aplicação. A perda ao recarregar é uma inferência a confirmar como requisito.
- A única chamada de serviço de dados de aplicação identificada no código é a busca de CEP via ViaCEP (app/js/app.js:314-341). O fluxo usa JSONP.
- Reserva e pedido produzem links para wa.me; o telefone usa tel:. Outros links navegam para perfis externos, incluindo um atalho bit.ly. Esses destinos não foram abertos.
- Não foram encontrados endpoints próprios, autenticação, autorização, pagamentos, cadastro, gestão de estoque ou histórico de pedidos. Essas áreas são não aplicáveis à arquitetura encontrada ou dependem de confirmação de que exista um sistema externo adicional.

## Testes existentes e estado publicado atual

| ID existente | Arquivo | Cobertura que realmente implementa |
|---|---|---|
| CT-001 | tests/01-e2e/home.spec.js | Título, heading principal e link Cardápio. Não percorre o menu nem o carrinho. |
| CT-002 | tests/02-static-resources/fonts.spec.js | Respostas e estado de carregamento das duas faces Poppins, com evidência JSON. |
| CT-003 | tests/02-static-resources/testimonial-background.spec.js | Fundo sem URL /img, medidas/cor/posição do card e carregamento de pizzas.png. |
| CT-004 | tests/03-network/unexpected-404.spec.js | Respostas HTTP 404 novas e URLs da linha de base histórica. |
| CT-005 | tests/01-e2e/products.spec.js | Oito produtos iniciais da categoria padrão, nomes, preços e imagens. |

O auditado não executou CT-001 a CT-005. O histórico em docs/bugs/bugs-identificados.md e docs/testes/cenarios-iniciais.md registra inspeções anteriores em que produção ainda apresentava três 404. A navegação atual, posterior ao commit f1bff39, observou recursos corrigidos. Esses documentos históricos não foram modificados; seus estados precisam ser atualizados com evidência de uma execução de aceitação repetível contra produção.

## Convenção de evidência

- **Observado:** visto na página publicada ou na fonte do commit inspecionado.
- **Confirmado no código:** a regra está implementada, mas isso isoladamente não prova funcionamento.
- **Inferido:** dedução da estrutura ou do estado em memória; requer definição/validação adicional.
- **Pendente:** depende de requisito, acesso, integração ou execução não realizada.

