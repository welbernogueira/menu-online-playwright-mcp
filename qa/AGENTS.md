# Frontend QA — Instruções do Codex

## Objetivo

Executar testes funcionais do Front-end do projeto Menu On-Line com Playwright MCP, utilizando a auditoria funcional como referência para explorar a aplicação, criar cenários, executar testes automatizados e produzir evidências rastreáveis.

## Contexto

- O projeto de QA está no repositório `menu-online-playwright-mcp`.
- A aplicação publicada está em `https://menu-online-project.vercel.app/`.
- A estrutura atual do projeto, o `package.json`, a configuração do Playwright e os cinco testes iniciais devem ser inspecionados antes de qualquer alteração.
- A auditoria funcional está documentada em `docs/auditoria/`:
  - `inventario-funcional.md`
  - `mapa-de-fluxos.md`
  - `riscos-e-lacunas.md`
  - `matriz-de-cobertura.md`
  - `plano-de-suites.md`
  - `perguntas-pendentes.md`
- Utilize o Playwright MCP para explorar a interface, observar comportamentos reais e executar os testes quando autorizado.
- Os cinco testes iniciais foram criados para validar o funcionamento do MCP. Preserve-os e não os considere representativos da cobertura completa da aplicação.
- A auditoria identificou 19 áreas funcionais e propôs 34 cenários. Esses números representam o planejamento, não a quantidade de testes implementados ou aprovados.
- A aplicação publicada já recebeu correções relacionadas aos caminhos das fontes, à solicitação inválida de imagem e ao fundo da seção de depoimentos. Confirme o estado atual antes de utilizar os registros antigos de bugs como evidência de falhas presentes.
- Não presuma que o comportamento observado na aplicação constitui, por si só, uma regra de negócio aprovada.

## Fontes de referência

Antes de analisar, criar ou executar cenários, consulte:

1. Os seis documentos em `docs/auditoria/`.
2. Os testes existentes e seus resultados disponíveis.
3. Os arquivos de configuração e scripts do projeto.
4. O código-fonte da aplicação, quando disponível no workspace.
5. A interface real, por meio do Playwright MCP, para confirmar fluxos e comportamentos observáveis.

Se o código-fonte da aplicação não estiver disponível no repositório de QA, não presuma que ele esteja presente. Utilize a interface acessível e os documentos disponíveis, registrando as limitações da análise.

## Fluxo obrigatório

1. Ler integralmente os documentos da auditoria.
2. Inspecionar a estrutura dos testes, configurações, dependências e scripts existentes.
3. Explorar a aplicação com Playwright MCP e identificar os fluxos realmente disponíveis.
4. Comparar os comportamentos observados com o inventário funcional, o mapa de fluxos, a matriz de cobertura e os riscos identificados.
5. Separar requisitos confirmados, comportamentos observados, hipóteses e perguntas pendentes.
6. Identificar os cenários já cobertos pelos testes existentes.
7. Apresentar uma matriz com a cobertura atual, as lacunas e os novos cenários recomendados.
8. Priorizar uma suíte inicial de acordo com risco funcional, impacto para o usuário, valor de regressão e estabilidade de execução.
9. Aguardar autorização explícita antes de criar ou modificar testes.
10. Após a autorização, implementar a suíte aprovada e executar os testes com Playwright.
11. Registrar os resultados reais e produzir as evidências solicitadas.
12. Validar a consistência dos resultados antes de declarar a execução concluída.

## Análise e geração de cenários

Para cada área funcional identificada na auditoria, avaliar, quando aplicável:

- Fluxos positivos e negativos.
- Navegação entre páginas, seções e componentes.
- Validação de campos obrigatórios.
- Campos vazios, valores inválidos e limites.
- Estados iniciais, intermediários e finais.
- Botões, links, menus, modais e formulários.
- Filtros, pesquisa, seleção e atualização de informações.
- Adição, alteração e remoção de itens do carrinho.
- Cálculos, totais, quantidades e taxas, somente conforme regras confirmadas.
- Persistência de estado durante a navegação, quando especificada.
- Exibição de mensagens de erro, sucesso ou validação.
- Layout, acessibilidade básica e comportamento responsivo, quando aplicáveis.
- Interações por mouse, teclado e toque, quando o comportamento esperado estiver definido.
- Regressões relacionadas a bugs anteriormente corrigidos.
- Erros de console, requisições de rede e recursos estáticos que afetem o funcionamento.

Não crie um teste para cada variação apenas para aumentar a quantidade de cenários. Priorize validações independentes, relevantes e rastreáveis.

## Regras de negócio e ambiguidades

Consulte obrigatoriamente `docs/auditoria/perguntas-pendentes.md` e `docs/auditoria/riscos-e-lacunas.md` antes de definir os resultados esperados.

As seguintes questões já foram identificadas e exigem atenção:

- Aceitação de uma UF não selecionada.
- Validação do endereço e do CEP.
- Taxa de entrega e condições de cálculo.
- Comportamento do carrinho.
- Interações dependentes de hover e comportamento em dispositivos de toque.

Esses itens não devem ser tratados automaticamente como defeitos ou requisitos confirmados. Investigue as evidências disponíveis e registre as decisões que ainda dependem de esclarecimento.

Quando o comportamento esperado não estiver especificado:

1. Descreva o comportamento observado.
2. Registre a ambiguidade.
3. Indique o risco de negócio associado.
4. Solicite confirmação antes de estabelecer uma assertion funcional definitiva.
5. Não classifique uma hipótese como requisito aprovado.

## Critérios para implementação

Cada cenário aprovado para automação deve conter:

- Identificador único e nome objetivo.
- Área funcional e fluxo relacionado.
- Prioridade: CRÍTICA, ALTA, MÉDIA ou BAIXA.
- Tipo: FUNCIONAL ou NÃO FUNCIONAL.
- Pré-condições e estado inicial.
- Passos de execução.
- Dados de teste necessários.
- Resultado esperado verificável.
- Assertions que serão executadas.
- Justificativa e risco coberto.
- Referência ao documento da auditoria que originou o cenário.
- Evidências que serão produzidas.

Use seletores estáveis e orientados ao usuário sempre que possível. Evite depender de posições fixas, atrasos arbitrários, textos frágeis ou detalhes internos de implementação quando houver alternativas mais robustas.

Não utilize `waitForTimeout` como estratégia padrão de sincronização. Prefira as esperas e assertions apropriadas do Playwright.

Mantenha os testes independentes sempre que possível. Não dependa da execução anterior para estabelecer o estado inicial de outro cenário, a menos que essa dependência seja explícita e documentada.

## Execução dos testes

Antes de executar:

1. Identifique a URL de destino e o ambiente.
2. Confirme se a execução será local ou contra a aplicação publicada.
3. Identifique os cenários e assertions que serão executados.
4. Verifique se os testes podem alterar dados ou disparar operações reais.
5. Confirme que os dados e o ambiente são adequados para o teste.
6. Registre os comandos e as configurações utilizados.

Utilize o Playwright MCP para explorar a aplicação e executar os testes de acordo com as ferramentas disponíveis e com a configuração existente.

Não invente nomes de ferramentas, capacidades do MCP, resultados ou arquivos de saída. Se determinada operação não estiver disponível, informe a limitação e proponha uma alternativa compatível com o ambiente existente.

Diferencie claramente:

- Exploração manual da interface via MCP.
- Cenários planejados.
- Testes automatizados implementados.
- Testes efetivamente executados.
- Testes aprovados, reprovados, bloqueados ou inconclusivos.

## Evidências e relatórios

Registre, conforme os recursos existentes no projeto:

- Identificador e descrição do cenário.
- Ambiente e URL utilizados.
- Data e horário da execução, quando disponíveis.
- Passos e assertions executados.
- Resultado esperado e resultado observado.
- Veredito e justificativa.
- Erros de console ou rede relevantes.
- Referências a logs, screenshots e relatórios gerados.

Quando forem solicitadas evidências visuais, utilize o Playwright MCP para capturar screenshots reais da aplicação ou das evidências previstas para o cenário. Não desenhe, edite ou simule capturas para representar um resultado de teste.

As evidências devem corresponder à execução corrente, ser legíveis e permitir identificar o cenário ao qual pertencem. Não reutilize evidências de execuções anteriores como se fossem atuais.

Antes de concluir, confirme que os arquivos existem e que as referências declaradas apontam para os artefatos corretos. Não invente caminhos de arquivos ou links.

## Regras de veredito

- `APROVADO`: todas as assertions obrigatórias foram executadas e passaram.
- `REPROVADO`: uma ou mais assertions obrigatórias falharam, demonstrando divergência em relação ao comportamento esperado confirmado.
- `BLOQUEADO`: uma dependência, configuração, ambiente ou condição impediu a validação.
- `INCONCLUSIVO`: as evidências são insuficientes para determinar o resultado ou o comportamento esperado ainda não está definido.
- `PENDENTE`: cenário planejado ou implementado que ainda não foi executado.

Um teste não pode ser considerado aprovado apenas porque a página abriu, não apresentou erro visível ou retornou um status HTTP de sucesso. O veredito deve ser sustentado pelas assertions específicas do cenário.

Falhas de infraestrutura, instabilidade ambiental e requisitos indefinidos devem ser distinguidos de defeitos funcionais.

## Segurança e restrições

- Não modificar o código da aplicação para fazer os testes passarem.
- Não remover, enfraquecer ou contornar assertions para obter aprovação artificial.
- Não alterar os cinco testes iniciais sem autorização.
- Não executar operações destrutivas nem enviar pedidos reais.
- Não realizar ações que produzam efeitos reais em sistemas externos sem autorização explícita.
- Não instalar dependências ou criar infraestrutura adicional sem necessidade.
- Não modificar configurações do projeto sem autorização.
- Não publicar resultados em serviços externos sem solicitação.
- Não registrar credenciais, tokens, cookies ou dados pessoais nas evidências.
- Não afirmar que um cenário foi executado se houve apenas inspeção ou planejamento.
- Não declarar cobertura total com base na quantidade de cenários planejados.
- Não considerar a ausência de falhas observadas como prova de que todos os fluxos estão corretos.

## Critério de conclusão

Uma suíte está concluída quando:

1. Todos os cenários aprovados para a suíte foram implementados.
2. Os testes foram executados no ambiente identificado.
3. Os resultados estão sustentados por assertions e evidências reais.
4. Os vereditos correspondem aos resultados observados.
5. Falhas, bloqueios e limitações estão documentados.
6. Os testes existentes foram preservados, salvo autorização específica.
7. Os artefatos gerados foram verificados.
8. A cobertura executada está claramente separada da cobertura planejada.

A auditoria de 19 áreas e 34 cenários é uma referência de planejamento, não uma meta de aprovação automática. Atualize a matriz de cobertura conforme os cenários forem implementados e executados.

## Autorização de execução

Na fase de análise, o agente deve ler os documentos, inspecionar a aplicação, explorar os fluxos necessários e apresentar uma proposta da primeira suíte. Não deve modificar arquivos nem criar testes nessa fase.

A implementação só pode começar após autorização explícita do usuário para a suíte proposta.

Após cada suíte, apresentar um resumo com os cenários executados, vereditos, falhas encontradas, evidências produzidas, limitações e atualização da cobertura.

A prioridade é garantir testes úteis, confiáveis, rastreáveis e alinhados ao comportamento esperado — não maximizar a quantidade de testes.