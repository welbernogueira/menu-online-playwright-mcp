# Plano de organização das suítes — Menu On-Line

**Estado:** organização materializada em `tests/`; execução dos novos cenários ainda pendente. O mapeamento entre suítes, cenários e bloqueios está em [`docs/testes/suites-automatizadas.md`](../testes/suites-automatizadas.md).

## Princípios de execução

- Executar fluxos com estado em aplicação local ou preview isolado, usando BASE_URL explícito. O padrão atual de Playwright aponta para produção.
- Manter leitura de href de WhatsApp/telefone como verificação de saída; interceptar popup/clique em ambiente controlado. Não enviar pedido ou mensagem real.
- Mockar ViaCEP nos testes determinísticos para simular endereço encontrado, CEP inexistente, falha HTTP, timeout e offline. Manter no máximo uma verificação de disponibilidade real separada e não bloqueante.
- Usar dados sintéticos, produto fixo e estado limpo por teste. Não compartilhar carrinho entre testes paralelos.
- Separar assertions de negócio de detalhes visuais que ainda não têm especificação aprovada.
- Gerar screenshot/trace apenas em falha e redigir informações pessoais nos anexos; os valores devem ser fictícios.

## Suítes recomendadas

| Suíte futura | Objetivo e escopo | Pré-requisitos | Cenários candidatos | Critério de aprovação |
|---|---|---|---|---|
| 00 — Smoke | Saber rapidamente se a página e seus recursos essenciais abriram. | Build local/preview acessível; BASE_URL explícito. | S-01, NAV-01, NET-01, NET-02. | Conteúdo principal visível, âncoras resolvem, fontes/imagens aprovadas carregam, nenhum erro inesperado bloqueia a página. |
| 01 — Catálogo e navegação | Cobrir filtros, paginação e conteúdo visível do catálogo. | Dados estáticos conhecidos; navegador desktop e mobile. | CAT-01, CAT-02, CAT-03, DATA-01, NAV-01. | Cada categoria apresenta o conteúdo permitido e troca/expansão não duplica cards; dataset segue invariantes aprovadas. |
| 02 — Seleção de itens | Cobrir quantidade, limites e inclusão no carrinho. | Estado local zerado; produto com preço determinístico. | PROD-01, PROD-02, PROD-03, RESP-02. | Quantidade não fica negativa, zero não altera carrinho, inclusão e repetição atualizam linhas/badge e reset conforme regra. |
| 03 — Carrinho e cálculos | Cobrir estados vazio/com itens, edição e cálculo de valores. | Carrinho isolado por teste; regra de entrega confirmada. | CART-01, CART-02, CART-03. | Empty state bloqueia avanço; alterações refletem quantidade, badge, subtotal, taxa e total sem divergência. |
| 04 — Endereço e validação | Provar entradas válidas/inválidas e fluxo por etapas. | Carrinho com item; dados sintéticos; ViaCEP interceptado quando necessário. | ADDR-01 a ADDR-04, CHK-01. | Campos obrigatórios e UF são validados segundo requisito; CEP respeita formato; voltar preserva/limpa estado de modo definido. |
| 05 — Integração ViaCEP | Testar o adaptador para o serviço externo sem rede flakey. | Interceptação Playwright; contrato de retorno definido. | CEP-01, CEP-02. | Mapeamento de campos correto e erros/timeout têm retorno recuperável e caminho manual funcional. |
| 06 — Resumo e saídas externas | Conferir mensagem e links sem sair do ambiente QA. | Dados sintéticos; popup/clique interceptados; número de teste aprovado se aplicável. | ORDER-01, RES-01, SEC-01. | URL/texto contém apenas valores esperados e não envia nada; o console e anexos não expõem dados desnecessários. |
| 07 — Conteúdo interativo | Cobrir depoimentos e seções informativas. | Página carregada; conteúdo aprovado pelo negócio. | TESTI-01, SEC-01. | Relato selecionado corresponde ao botão ativo; conteúdo visível permanece consistente. |
| 08 — Recursos e rede | Regressão de fontes, imagens, scripts e 4xx. | Rede limpa; lista de recursos históricos atualizada após validar correções. | NET-01, NET-02, NET-03, S-01. | Nenhum recurso esperado falha; qualquer exceção é justificada e não oculta regressão. |
| 09 — Responsividade e acessibilidade | Verificar breakpoints, operação por teclado e semântica. | Matriz de viewports e alvo WCAG/navegadores definidos. | NAV-02, RESP-01, RESP-02, A11Y-01, A11Y-02. | Sem overflow impeditivo; todas as ações essenciais são encontráveis e operáveis; erros acessíveis são anunciados. |
| 10 — Compatibilidade e desempenho | Avaliar navegadores suportados e tempos de carregamento. | Browsers, dispositivos e orçamento acordados; ambiente estável. | BROWSER-01, PERF-01. | Critérios mensuráveis definidos pelo produto e resultados dentro dos limites aprovados. |
| 11 — Regressão integrada | Executar o subconjunto estável de maior risco após alterações. | Suites anteriores estáveis; deploy preview identificado. | Smoke + CAT-01/02 + PROD-03 + CART-01/03 + ADDR-02/03 + NET-01/02/03. | Caminho do catálogo até o resumo passa sem regressão; a fronteira externa permanece bloqueada durante automação. |

## Critério de entrada para implementação

Antes de automatizar regras ambíguas, confirmar as perguntas em perguntas-pendentes.md. Priorizar correção e teste de UF e formato do CEP, isolamento de ViaCEP e comportamento de adição em toque. Depois, fixar o catálogo e a política de preço/entrega como dados de referência.

## Critério de saída

- Requisitos e resultados esperados aprovados para casos de pedido, CEP, entrega, persistência e reserva.
- Execuções repetíveis em preview sem acessar serviços ou contatos reais.
- Evidências sem endereço ou CEP pessoal.
- Falhas classificadas por requisito/risco, com logs, URL de ambiente e versão do commit.

