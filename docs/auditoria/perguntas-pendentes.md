# Perguntas pendentes para fechar requisitos e cenários

As perguntas abaixo evitam transformar comportamentos atuais do código em regras de negócio presumidas. A referência ao código explica a origem da dúvida, não valida que o comportamento seja o desejado.

## Pedido, endereço e carrinho

1. **UF é obrigatória?** O formulário oferece placeholder “...” com valor -1, e esse valor passa pela validação atual; o site avançou ao resumo com UF não selecionada. O esperado é bloquear e pedir seleção de uma UF válida?
2. **Qual formato de CEP deve ser aceito?** A busca aceita oito dígitos, mas revisão manual só verifica campo não vazio. CEP com hífen deve ser normalizado? CEP fictício/inválido deve ser impedido de avançar?
3. **Quais campos de entrega são obrigatórios?** O código exige CEP, endereço, bairro, cidade, UF e número; complemento parece opcional. Esse conjunto está aprovado?
4. **A busca de CEP é obrigatória ou opcional?** O código permite preencher manualmente; confirme se esse caminho deve permanecer disponível quando ViaCEP falha.
5. **Como o usuário deve ser informado sobre indisponibilidade do ViaCEP?** Definir mensagem, retry, timeout e se o caminho manual basta.
6. **A taxa de entrega é fixa em R$ 5,00?** O valor está codificado globalmente. Aplica-se a qualquer CEP, categoria, subtotal e quantidade?
7. **Há valor mínimo/máximo de pedido, limite por produto, estoque ou regra de disponibilidade?** Nenhuma dessas regras foi encontrada no código observado.
8. **O carrinho deve persistir ao recarregar, fechar modal ou voltar ao site?** O estado observado é somente em memória; persistência não foi encontrada.
9. **Ao voltar da revisão para o endereço, os campos devem permanecer?** Confirmar também se remover o último item durante o fluxo altera etapas e totais.
10. **O que deve acontecer com um CEP inválido ou endereço sem número?** Definir critério e mensagens antes de transformar validação em oracle.

## Catálogo e conteúdo

11. **Os 72 registros de app/js/dados.js representam o catálogo vigente ou dados demonstrativos?** Muitos nomes correspondem a restaurantes/marcas dos EUA; confirmar produtos, descrições, imagens e disponibilidade.
12. **Os preços em reais são os valores comerciais corretos?** A suíte não deve fixar a lista atual sem um catálogo aprovado.
13. **A regra de 8 produtos iniciais e 12 por categoria é intencional?** Confirmar limite, ordem e se Ver mais deve ser ocultado quando faltarem itens.
14. **Existe outra fonte/catálogo externo ou painel administrativo fora do repositório observado?** Nenhum foi encontrado na árvore/fonte consultada.
15. **Qual conteúdo aprovado deve permanecer nas três avaliações/depoimentos?** A auditoria só verificou a troca de relatos estáticos.

## Reserva, contato e limites de integração

16. **A reserva é apenas uma conversa iniciada no WhatsApp?** A interface não coleta data/horário e o código prepara uma mensagem fixa. Deve haver informação adicional?
17. **Os números e links externos atualmente codificados são os destinos oficiais?** O número 5583991050557, os links tel:, wa.me, bit.ly, Instagram, LinkedIn e GitHub não foram acionados.
18. **Qual deve ser o conteúdo exato da mensagem de pedido e de reserva?** Definir formatação, moeda, separadores, dados obrigatórios e destino aprovado.
19. **A automação deve verificar somente a URL montada e interceptar nova aba?** A auditoria não enviou mensagens. Indicar número/ambiente de teste se for necessário testar uma integração real.

## Qualidade, compatibilidade e operação

20. **Qual o idioma declarado esperado para leitores de tela e ferramentas?** HTML indica inglês (lang=en) com texto em português; confirmar pt-BR.
21. **Quais navegadores, versões e dispositivos devem ser suportados?** Playwright está configurado somente para Chromium.
22. **Qual alvo de acessibilidade e quais critérios visuais aprovam contraste, foco, labels, ícones e leitores de tela?** Nenhuma declaração foi encontrada.
23. **Os controles de produto precisam funcionar por toque sem hover?** O CSS esconde as ações até hover; a interação em touchscreen real não foi confirmada.
24. **Qual orçamento de desempenho deve ser usado?** Não foi identificado limite de carregamento ou Core Web Vitals.
25. **O log de console com a mensagem completa do pedido é intencional?** O conteúdo contém endereço e CEP e foi observado no caminho de revisão.
26. **Existe política para capturas, traces, logs e retenção de dados em CI?** A suíte guarda trace e screenshot em falha; dados devem ser sempre fictícios e anonimizados.
27. **Quando a linha de base de BUG-001/002/003 deve ser encerrada?** O histórico do QA diz que a produção ainda tinha os três 404; a visita atual e o commit mais recente da aplicação mostram as correções. Confirmar uma execução repetível e atualizar os documentos de bugs/testes sem apagar o histórico.
28. **Qual ambiente deve ser o destino padrão dos testes automatizados?** playwright.config.js usa produção quando BASE_URL está ausente. Definir local/preview e os controles necessários para impedir operações externas.
29. **Há CI, configuração de deploy ou requisitos operacionais em outro repositório/sistema?** Não foram encontrados na árvore do projeto de QA; confirmar proprietário e processo oficial.

## Perguntas bloqueantes para a próxima etapa

Para escrever testes assertivos de checkout, as decisões mínimas são: UF obrigatória, formato de CEP, campos obrigatórios, taxa de entrega, persistência, política de ViaCEP e limite de integração com WhatsApp. Para acessibilidade, compatibilidade e desempenho, definir padrões e ambientes. Sem essas respostas, os cenários podem ser criados como observações exploratórias, mas não como critérios de aprovação de produto.

