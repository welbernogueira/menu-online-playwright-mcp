# Mapa de fluxos — Menu On-Line

**Base:** HTML/JavaScript local do repositório de QA, conferência da aplicação oficial no GitHub e navegação segura do site publicado em 19/10/2026 (BRT). As ações em WhatsApp, telefone e redes externas não foram abertas.

## Fluxo de navegação e catálogo

~~~mermaid
flowchart TD
    A[Carregar página única] --> B[Banner e navegação]
    B --> C[Selecionar âncora Cardápio]
    C --> D[Carregar categoria ativa]
    D --> E[Mostrar 8 primeiros produtos]
    E --> F{Ver mais?}
    F -- Sim --> G[Acrescentar itens 9 a 12]
    G --> H[Ocultar Ver mais]
    F -- Não --> I[Manter 8 produtos]
    H --> J{Trocar categoria?}
    I --> J
    J -- Sim --> D
    J -- Não --> K[Selecionar quantidade]
    K --> L{Quantidade maior que zero?}
    L -- Não --> M[Nenhuma adição]
    L -- Sim --> N[Adicionar ou somar produto no carrinho]
    N --> O[Zerar seletor e atualizar badge]
~~~

**Evidência observada:** a página tem seis categorias. Cada uma foi selecionada e exibiu oito produtos. Em Pizzas, “Ver mais” acrescentou quatro itens e desapareceu. O filtro selecionado ficou ativo e a troca de categoria voltou a oito itens. Fontes: app/index.html:192-237; app/js/app.js:23-60; app/js/dados.js. Navegação entre as seções é feita por âncoras em app/index.html:46-55.

## Fluxo de carrinho, endereço e revisão

~~~mermaid
flowchart TD
    A[Selecionar Meu carrinho] --> B{Carrinho vazio?}
    B -- Sim --> C[Mostrar mensagem de carrinho vazio]
    C --> D[Continuar bloqueado]
    B -- Não --> E[Mostrar itens e subtotal]
    E --> F[Aplicar entrega fixa de R$ 5 no código]
    F --> G[Continuar para endereço]
    G --> H{Buscar CEP ou preencher manualmente?}
    H -- Buscar CEP --> I[Validar 8 dígitos]
    I --> J[Consultar ViaCEP]
    J --> K[Preencher rua, bairro, cidade e UF]
    H -- Manual --> L[Preencher endereço, CEP, número, cidade e UF]
    K --> M[Revisar pedido]
    L --> M
    M --> N{Validação atual passa?}
    N -- Não --> O[Mensagem e foco no primeiro campo vazio]
    N -- Sim --> P[Mostrar resumo do pedido]
    P --> Q[Montar endereço wa.me em nova aba]
    Q --> R[Envio externo pelo usuário]
~~~

**Fronteira de segurança da auditoria:** o diagrama mostra o destino implementado, mas a seta de envio externo não foi executada. A inspeção parou na etapa de resumo. O link WhatsApp foi preparado pelo código; nenhum pedido ou mensagem foi enviado.

**Evidência observada:** abrir o carrinho vazio mostrou a mensagem “Seu carrinho está vazio!” e não avançou. Um único produto adicionado localmente exibiu badge 1 e, ao abrir o carrinho, subtotal de R$ 99,00, entrega de R$ 5,00 e total de R$ 104,00. Depois, foram preenchidos CEP 00000000, Rua de Teste QA, Centro QA, número 1 e Cidade QA; sem escolher UF, o resumo abriu. Esses são dados sintéticos, usados apenas no estado temporário do navegador.

**Regra divergente confirmada:** o campo UF permanece no placeholder com valor -1, mas resumoPedido verifica apenas se o texto da opção está vazio. -1 tem comprimento diferente de zero. Isso permitiu a etapa de resumo com a UF inválida. Evidências: app/index.html:487-517; app/js/app.js:352-412.

## Fluxo de busca de CEP

~~~mermaid
flowchart LR
    A[Campo CEP] --> B[Remover caracteres não numéricos]
    B --> C{Exatamente 8 dígitos?}
    C -- Não --> D[Exibir formato inválido]
    C -- Sim --> E[GET JSONP ViaCEP]
    E --> F{Resposta contém erro?}
    F -- Sim --> G[Orientar preenchimento manual]
    F -- Não --> H[Preencher endereço, bairro, cidade e UF]
    E -. timeout/rede .-> I[Tratamento não identificado no código]
~~~

ViaCEP não foi chamado durante a navegação. Portanto, respostas válidas/inválidas, disponibilidade e timeout não foram observados. A ausência de handler de falha é verificada no fonte (app/js/app.js:314-350), não em uma simulação de falha.

## Fluxo de depoimentos, reserva e contato

~~~mermaid
flowchart TD
    A[Depoimento 1 ativo] --> B[Selecionar 2 ou 3]
    B --> C[Ocultar relato anterior]
    C --> D[Mostrar relato e botão ativos]
    E[Inicialização da página] --> F[Preparar link de reserva para wa.me]
    E --> G[Preparar link tel: para o telefone]
    H[Botão Fazer reserva] --> I[Abrir WhatsApp com mensagem fixa]
    J[Botão telefone] --> K[Aplicativo telefônico]
~~~

Os depoimentos 2 e 3 foram selecionados com sucesso e atualizaram texto e estado visual. Os links de reserva e telefone não foram acionados; seus destinos foram conferidos apenas no DOM/código (app/index.html:339-365, app/js/app.js:473-484).

## Estados e transições conhecidos

| Área | Estados encontrados | Transições observadas | Transições pendentes |
|---|---|---|---|
| Catálogo | Categoria ativa; lista de 8 ou 12 itens; botão Ver mais visível/oculto | Troca de todas as categorias; expansão de Pizzas de 8 para 12 | Segundo clique/reentrada após expansão, limites para dados incompletos |
| Produto | Quantidade 0; quantidade selecionada; adicionado | Incrementar para 1; adicionar; badge atualizado; quantidade volta a 0 | Decremento até zero, múltiplas unidades, duplicidade e entradas extremas |
| Carrinho | Vazio; com produto; etapas 1, 2 e 3 | Vazio bloqueia; carrinho com produto abre endereço; resumo abre com campos preenchidos | Remover último item em cada etapa; voltar; preservar/limpar estado após fechar |
| CEP/endereço | Campos vazios; busca; dados manuais; resumo | Campos sintéticos com UF inválida passam ao resumo | Erros CEP, CEP válido, indisponibilidade de ViaCEP e validação de campos individuais |
| Página mobile | Navegação fechada/aberta | Toggler abriu o menu e mostrou os links em viewport de 390 × 844 | Ativação por teclado/leitor de tela; comportamento de controles de produto por toque |

## O que é comportamento esperado documentado

Não foi encontrado documento de requisitos de produto. Logo, as regras identificadas em comentários/código — oito itens iniciais, doze itens por categoria, taxa fixa de R$ 5, validações do endereço e mensagens — são evidência da implementação atual, não especificação aprovada. As perguntas que precisam de decisão estão em perguntas-pendentes.md.

