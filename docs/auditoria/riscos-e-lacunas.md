# Riscos e lacunas — Menu On-Line

Escala usada: **Alta** quando a falha pode bloquear ou corromper o fluxo principal de pedido; **Média** quando compromete uso, confiança ou uma parcela importante do fluxo; **Baixa** quando o impacto observado é limitado. Probabilidade é uma estimativa para priorizar investigação, não uma métrica estatística.

## Defeitos e riscos

| ID | Prioridade | Probabilidade | Evidência, impacto e recomendação |
|---|---|---|---|
| R-01 — UF placeholder aceito na revisão | **Alta** | Alta: reproduzido | Com carrinho contendo 1 produto, preencher CEP 00000000, rua “Rua de Teste QA”, bairro “Centro QA”, número 1 e cidade “Cidade QA”; deixar UF em “...”; clicar “Revisar pedido”. O site avançou ao resumo e apresentou endereço com sufixo --1. Isso pode produzir um pedido com UF inválida. Código: app/js/app.js:352-412; placeholder: app/index.html:487-490. O comportamento foi reproduzido no site publicado em 19/10/2026 com dados sintéticos. |
| R-02 — CEP manual aceito sem formato válido | **Alta** | Alta: regra explícita no código | O validador de revisão verifica se CEP não está vazio, não se possui oito dígitos. A validação de oito dígitos existe apenas ao clicar a busca do ViaCEP. No fluxo reproduzido, 00000000 passou por revisão manual sem chamada externa. Isso permite endereço incompleto ou inválido; definir a regra e testar 7/8/9 dígitos e letras. Código: app/js/app.js:314-321,352-366. |
| R-03 — Controles do catálogo dependem de hover | **Média** | Média; hipótese de usabilidade | O CSS esconde .add-carrinho e só o revela com .card-item:hover (app/css/main.css:274-328); o CSS responsivo não contém uma substituição explícita para toque. Na viewport mobile de 390 px os controles de um card foram observados com display:none antes de hover. O comportamento após toque real não foi possível confirmar; pode exigir gesto adicional ou impedir a descoberta dos controles em alguns dispositivos. Validar em dispositivos touchscreen antes de classificar como falha reproduzida. |
| R-04 — Falha de rede do ViaCEP sem estado de erro | **Média** | Média | O $.getJSON tem callback de sucesso, mas não handler de erro/timeout nem estado de carregamento identificados (app/js/app.js:323-341). Uma indisponibilidade pode deixar o usuário sem retorno; o preenchimento manual existe como alternativa, porém não foi verificado como feedback suficiente. |
| R-05 — Dados do endereço registrados no console | **Média** | Alta: chamada ocorre no caminho de resumo | finalizarPedido executa console.log(texto) com os itens, endereço, CEP e complemento (app/js/app.js:437-467). Durante a reprodução com dados artificiais, o caminho chegou a essa função; nenhum dado real foi usado. Isso expõe dados pessoais a ferramentas de desenvolvimento e logs coletados por terceiros. Recomenda-se confirmar a necessidade e remover/minimizar o registro antes da automação ou uso real. |
| R-06 — Interação e labels com semântica incompleta | **Média** | Média; requer verificação assistiva | Filtros de categoria, controles de quantidade e parte dos links de ação são âncoras sem href ou spans com onclick (app/index.html:201-234, template em app/js/app.js); campos usam label sem associação explícita for/id de label (app/index.html:439-488). Pode dificultar teclado, foco visível e leitor de tela. A auditoria não executou avaliação WCAG nem leitor de tela. |
| R-07 — Idioma da página declarado como inglês | **Baixa** | Alta: atributo observado | app/index.html:2 declara lang="en" enquanto conteúdo e interface estão em português. Leitores de tela podem pronunciar em idioma incorreto e ferramentas de tradução podem classificar mal a página. Confirmar se o idioma pretendido é pt-BR. |
| R-08 — Conteúdo e preços sem critério comercial confirmado | **Média** | Indeterminada | app/js/dados.js contém marcas/restaurantes norte-americanos e preços em reais, por exemplo no catálogo observado. Não se conclui que os dados estão errados: falta saber se são produtos reais, dados de demonstração, moeda correta e valores autorizados. Validar com proprietário do menu antes de usar dados como oracle E2E. |
| R-09 — Cobertura existente concentra-se em carregamento e recursos | **Alta** | Alta: lacuna observada | CT-001 a CT-005 cobrem página, fontes, fundo, 404 e os oito primeiros burgers. Não há cobertura automatizada existente para as outras cinco categorias, Ver mais, quantidade, carrinho, taxa, endereço, CEP, resumo, depoimentos, reservas, mobile, teclado ou acessibilidade. O defeito R-01 não é detectado pela suíte atual. |
| R-10 — Teste por padrão aponta para produção | **Média** | Média | playwright.config.js usa o site publicado como baseURL quando BASE_URL não está definido. Os testes existentes são predominantemente de leitura, mas futuras interações com WhatsApp/reserva poderiam abrir integrações reais se o escopo não for isolado. Preferir local/preview para E2E com estado e bloquear ações externas por padrão. |
| R-11 — Documentação de defeitos desatualizada em relação ao site observado | **Média** | Alta: divergência observada | docs/bugs/bugs-identificados.md e docs/testes/cenarios-iniciais.md dizem que o domínio ainda falha nas duas fontes e /img. Na navegação atual, Poppins Regular/Medium responderam 200, não houve requisição /img, pizzas.png carregou e o CSS exibiu background-image:none e card #ffe8a3. O commit mais recente do repositório oficial também diz corrigir fontes/fundo. Reconciliar os documentos somente depois de uma execução de aceitação repetível contra produção; a auditoria não os alterou. |
| R-12 — Listener de “Ver mais” aponta para seletor diferente | **Baixa** | Alta no código; impacto mitigado | app/js/app.js:16 liga handler a .btnVerMais, enquanto app/index.html:234 usa id btnVerMais. A ação continuou funcionando pela chamada inline e foi observada; é código redundante que pode confundir manutenção ou mascarar quebra futura. |
| R-13 — Regra CSS inválida em avatar de depoimento | **Baixa** | Alta no código; efeito visual não mensurado | app/css/main.css:370 define background-color: 50px, valor que não representa uma cor CSS. Pode ser ignorado pelo navegador. As imagens são definidas em regras subsequentes; não foi observada falha visual funcional. Confirmar e corrigir apenas junto com critério visual aprovado. |
| R-14 — Asserções e dados de CT-005 cobrem só o primeiro lote | **Média** | Alta: escopo do teste | O teste fixa nomes/preços dos oito burgers iniciais (tests/01-e2e/products.spec.js). Não verifica as demais categorias, expansão, quantidade ou manutenção de consistência entre os 72 dados e imagens. A lista hardcoded também exige atualização manual se o catálogo mudar intencionalmente. |

## Lacunas de testabilidade

### Cobertura funcional

- Não existem testes de transição de categoria e expansão completa das seis categorias.
- Não existe teste de quantidade mínima, repetição, mescla de duplicados, badge, remoção ou atualização do total.
- Não existem testes de validação negativa e positiva de endereço, nem teste para o placeholder da UF.
- Não há contrato automatizado isolado para ViaCEP. Seu serviço está fora do controle da suíte.
- Não há teste do resumo e da montagem do link WhatsApp que impeça o envio real.
- Os relatos e o botão de reserva foram explorados parcialmente; destinos externos não foram acionados.

### Não funcional, observabilidade e segurança básica

- **Responsividade:** observação pontual em 390 × 844; falta matriz de larguras, orientação, zoom e teste de modal/carrinho em tamanhos pequenos.
- **Acessibilidade:** não foram executados teclado completo, auditoria automática, leitor de tela, contraste, ordem de foco ou verificação de rótulos.
- **Compatibilidade:** a configuração executa Chromium; não há projeto de Firefox/WebKit. Navegadores alvo não estão documentados.
- **Desempenho:** nenhum orçamento ou medição foi encontrado; a auditoria não coletou Core Web Vitals nem tamanho de recursos.
- **Segurança:** revisão somente estática e não destrutiva; nenhuma análise de vulnerabilidade foi executada. O console.log com texto de pedido merece atenção.
- **Rede:** a página principal foi observada sem 404/console error atual; ViaCEP e links externos não foram testados. Falhas de rede, bloqueios de terceiros e códigos 4xx/5xx permanecem pendentes.
- **Persistência:** não foi observado armazenamento local. Se preservar o carrinho entre sessões for requisito, não há implementação visível na cópia examinada.

### Não aplicável ou não confirmado

Autenticação, autorização, papéis, cadastro, pagamento e API própria não foram encontrados na aplicação inspecionada. Não se devem inventar testes para essas áreas sem evidência de sistema integrado. “Não encontrado no código observado” não prova ausência de serviços externos.

## Limites da inspeção

- A visita à aplicação publicada usou uma sessão de navegador e rede disponíveis naquele momento; estados de produção podem mudar.
- Categorias, expansão, depoimentos, carrinho vazio, inclusão local de um produto, valores e avanço para resumo foram observados. O envio final não foi executado.
- A busca ViaCEP, contatos, WhatsApp e redes não foram chamados.
- O fluxo de resumo foi exercitado com dados sintéticos. O endereço foi apagado da sessão ao recarregar a página.
- Não houve execução de Playwright Test, teste de API, verificação de compatibilidade, leitor de tela ou medição de desempenho.

