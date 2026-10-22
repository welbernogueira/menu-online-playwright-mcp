# Regras de Análise e Geração de Cenários QA — Menu On-Line (Frontend e Backend)

## Objetivo

Analisar, planejar e gerar cenários de testes para o projeto Menu On-Line considerando o levantamento funcional, o mapeamento de fluxos, a auditoria, os riscos e as lacunas de cobertura já identificados.

O foco principal deve ser o frontend, utilizando o Playwright MCP para explorar a aplicação, interagir com seus componentes, validar os fluxos do usuário, verificar os comportamentos observáveis e coletar evidências reais das execuções.

O backend e as integrações devem ser considerados de forma complementar, conforme a arquitetura efetivamente identificada no projeto, para verificar contratos, regras de negócio, processamento, persistência e consistência dos dados quando esses aspectos fizerem parte do escopo e houver meios autorizados de validá-los.

O objetivo é ampliar a cobertura funcional com cenários relevantes, rastreáveis e reproduzíveis, aproveitando o conhecimento já produzido e evitando duplicidades, suposições indevidas e alterações não autorizadas.

## Contexto obrigatório do projeto

Considerar como ponto de partida os documentos existentes em `docs/auditoria/`:

- `inventario-funcional.md`
- `mapa-de-fluxos.md`
- `riscos-e-lacunas.md`
- `matriz-de-cobertura.md`
- `plano-de-suites.md`
- `perguntas-pendentes.md`

Considerar também os testes existentes, incluindo CT-001 a CT-005, a configuração do Playwright, o `package.json`, a organização dos diretórios de teste e os registros de execução disponíveis.

A auditoria anterior identificou áreas funcionais, fluxos, riscos e cenários propostos. Essas informações devem ser reutilizadas, mas é obrigatório distinguir o que foi apenas planejado ou observado do que foi efetivamente implementado e executado.

Não reiniciar a auditoria integral sem necessidade. Complementar a análise somente quando houver lacunas relevantes, informações desatualizadas ou dúvidas que impeçam a definição dos cenários.

## Processo obrigatório

1. Consultar os documentos de auditoria e os arquivos de teste existentes antes de iniciar novas análises.
2. Recuperar o contexto funcional já identificado e correlacionar cada fluxo com os testes existentes.
3. Utilizar o Playwright MCP prioritariamente para explorar a interface e verificar os comportamentos reais do frontend.
4. Inspecionar os componentes, as páginas, as rotas, os formulários, os eventos, os estados da interface e os arquivos de código relacionados aos cenários analisados.
5. Identificar as regras de negócio confirmadas, os comportamentos observados, as hipóteses e as perguntas pendentes.
6. Mapear a relação entre as ações do usuário, as mudanças de estado da interface e as operações de backend ou integrações identificadas.
7. Verificar os testes existentes para identificar cobertura completa, parcial, ausente, duplicada, bloqueada ou inconclusiva.
8. Propor novos cenários com base nas lacunas identificadas, no impacto funcional, nos riscos e na relevância para a jornada do usuário.
9. Priorizar os cenários de frontend, sem ignorar riscos importantes relacionados ao backend e à integridade dos dados.
10. Apresentar uma matriz consolidada de cobertura, indicando os cenários existentes, as lacunas e os testes recomendados.
11. Aguardar autorização explícita antes de criar ou modificar arquivos de teste, scripts, configurações, collections ou dados de teste, ou executar novas baterias de testes fora do escopo autorizado.
12. Após a aprovação, implementar e executar somente os cenários autorizados, utilizando o Playwright MCP para as validações de interface e as ferramentas complementares aprovadas para as demais verificações.
13. Registrar os resultados reais, as evidências, os defeitos encontrados, as limitações e as pendências.
14. Atualizar a matriz de cobertura com a situação efetivamente comprovada após a execução.

## Categorias de cenários

### 1. Frontend — prioridade principal

Considerar, conforme as funcionalidades existentes:

- Fluxos positivos e negativos das principais jornadas do usuário.
- Navegação entre páginas, seções e etapas.
- Visibilidade, habilitação e comportamento dos componentes interativos.
- Botões, links, menus, cards, formulários, seletores e modais.
- Campos obrigatórios, valores vazios, formatos inválidos e limites confirmados.
- Mensagens de validação, erro, sucesso e confirmação.
- Catálogo de produtos: carregamento, exibição e interação.
- Carrinho: inclusão, remoção, alteração de quantidades e atualização de valores, quando disponível.
- Formulários e etapas do pedido: preenchimento, validação e progressão do fluxo.
- Endereço e entrega: validação de CEP, UF e endereço, conforme as regras confirmadas.
- Subtotal, descontos, frete e total, quando aplicáveis e documentados.
- Estados vazios, carregamento, indisponibilidade e recuperação de erros.
- Persistência de estado durante navegação, retorno ou recarga, quando esperada.
- Responsividade e adaptação a diferentes dimensões de tela.
- Interação por mouse, teclado e toque, conforme os dispositivos suportados.
- Acessibilidade básica, incluindo identificação dos controles, foco e navegação por teclado.
- Carregamento de imagens, fontes, estilos e demais recursos necessários à interface.
- Prevenção de interações duplicadas e estados visuais inconsistentes.
- Regressões em funcionalidades anteriormente validadas.

### 2. Backend e integrações — prioridade complementar

Considerar somente quando a arquitetura e os recursos utilizados pelo projeto confirmarem sua aplicabilidade:

- Contratos das APIs consumidas pelo frontend.
- Métodos HTTP, parâmetros, payloads e estrutura das respostas.
- Validação de campos obrigatórios, tipos, formatos e limites.
- Códigos HTTP e tratamento de erros.
- Autenticação e autorização, quando existentes.
- Regras de negócio processadas no servidor.
- Persistência e integridade dos dados.
- Consistência entre os valores exibidos no frontend e os dados retornados pelas integrações.
- Tratamento de falhas de rede, indisponibilidade e respostas inesperadas.
- Requisições repetidas, duplicidade de operações e idempotência, conforme os contratos.
- Regressões em operações já validadas.

Não presumir a existência de backend próprio, banco de dados, endpoints ou mecanismos de autenticação sem evidências de sua implementação ou utilização.

### 3. Cenários integrados

Quando houver uma integração identificada e meios autorizados de validá-la, considerar:

- Ação realizada pelo usuário que gera uma requisição.
- Envio dos parâmetros e dados esperados.
- Tratamento da resposta pela interface.
- Atualização dos componentes após sucesso ou falha.
- Consistência dos dados entre requisição, resposta e interface.
- Comportamento diante de falhas ou respostas inesperadas.
- Prevenção de estados inconsistentes durante operações assíncronas.

A validação visual pelo Playwright MCP não deve ser apresentada como prova de persistência no banco de dados. Quando necessário, utilizar uma ferramenta complementar autorizada e registrar a evidência correspondente.

## Critérios de qualidade dos cenários

Cada cenário proposto deve conter, conforme sua natureza:

- Identificador único e título descritivo.
- Funcionalidade ou fluxo relacionado.
- Camada de validação: frontend, backend ou integrada.
- Pré-requisitos e estado inicial.
- Dados de teste.
- Página, rota, componente ou endpoint envolvido, quando aplicável.
- Passos de execução reproduzíveis.
- Resultado esperado fundamentado em requisito, regra confirmada ou contrato.
- Assertions necessárias.
- Prioridade: CRÍTICA, ALTA, MÉDIA ou BAIXA.
- Severidade estimada de uma eventual falha, com justificativa.
- Tipo: FUNCIONAL ou NÃO FUNCIONAL.
- Justificativa do cenário.
- Referência ao documento de auditoria, requisito ou código que fundamenta o teste.
- Relação com cenários existentes para evitar duplicidades.
- Situação da cobertura.
- Evidências necessárias para comprovar o resultado.

Os cenários devem verificar comportamentos funcionais, não apenas a presença de elementos, a execução de cliques ou o recebimento de respostas.

Quando não existir uma regra confirmada para determinar o resultado esperado, registrar a pendência em `perguntas-pendentes.md` ou no documento de controle correspondente, sem inventar critérios de aceite.

## Regras de utilização do Playwright MCP

1. Priorizar o Playwright MCP na exploração e validação dos fluxos de frontend.
2. Confirmar a página, o estado atual e os elementos disponíveis antes de executar cada ação.
3. Utilizar seletores estáveis e acessíveis, priorizando roles, nomes acessíveis, rótulos e atributos de teste existentes.
4. Não presumir seletores, elementos, mensagens ou estados que não tenham sido identificados.
5. Aguardar condições reais da interface antes das assertions, evitando dependência de atrasos arbitrários.
6. Verificar o resultado após cada etapa relevante do fluxo.
7. Registrar falhas de console, erros de carregamento e problemas de navegação relevantes.
8. Diferenciar defeitos funcionais de falhas de sincronização, automação, infraestrutura ou ambiente.
9. Não considerar a exploração via MCP como equivalente à criação de testes automatizados persistentes.
10. Não considerar um teste implementado como executado sem evidência de execução.
11. Não considerar um cenário aprovado como prova de cobertura completa.
12. Não utilizar o navegador como única fonte de validação quando o objetivo exigir comprovação de persistência ou processamento interno.
13. Não executar operações destrutivas ou irreversíveis sem autorização específica.
14. Registrar limitações técnicas que impeçam a execução ou reduzam a confiabilidade dos resultados.

## Regras para evidências

Quando a execução de testes for autorizada, as evidências devem ser produzidas a partir de dados reais e observáveis da execução.

Para os cenários que exigirem cards de evidência:

- Gerar cards em HTML/CSS com aparência consistente com o padrão Carbon definido para o projeto.
- Capturar screenshots em formato JPEG, conforme as regras de evidência estabelecidas.
- Apresentar identificador, cenário, passos relevantes, resultado esperado, resultado obtido, assertions e veredito.
- Utilizar exclusivamente dados observados ou critérios de aceite confirmados.
- Salvar os arquivos no diretório de evidências correspondente à execução.
- Preservar a rastreabilidade entre o cenário, a execução e os arquivos gerados.
- Não fabricar respostas, resultados, mensagens ou estados para preencher os cards.
- Identificar explicitamente como indisponível qualquer evidência que não tenha sido coletada.
- Classificar o cenário como inconclusivo quando as evidências forem insuficientes para determinar o resultado.
- Não expor tokens, credenciais ou informações sensíveis.

A geração de evidências deve respeitar o escopo autorizado. Se houver autorização para um cenário de exemplo, produzir somente esse exemplo e aguardar aprovação antes de gerar evidências para a suíte completa.

## Restrições

- Não inventar regras de negócio, requisitos, mensagens, endpoints ou comportamentos esperados.
- Não assumir que o comportamento atual da aplicação está correto apenas porque foi observado.
- Não duplicar cenários já cobertos sem justificativa.
- Não modificar o código-fonte da aplicação ou do backend.
- Não alterar testes, configurações, dependências, collections ou scripts sem autorização explícita.
- Não executar operações destrutivas ou que possam afetar dados reais sem autorização.
- Não utilizar dados pessoais ou credenciais reais nas evidências.
- Não criar cenários apenas para aumentar a quantidade de testes.
- Não considerar cobertura de páginas, componentes ou requests equivalente à cobertura funcional.
- Não classificar cenários como aprovados sem execução efetiva e assertions compatíveis.
- Não ocultar falhas de automação, console, rede ou carregamento.
- Não corrigir automaticamente defeitos identificados durante a análise.
- Não executar testes de carga, concorrência ou segurança com potencial de impacto sem autorização específica.
- Não declarar cobertura completa enquanto existirem lacunas relevantes, regras pendentes ou cenários não executados.
- Não reiniciar o trabalho de auditoria já concluído sem uma justificativa técnica.
- Não substituir as evidências anteriores por suposições ou resultados não reproduzidos.

## Entrega antes da implementação

Apresentar uma matriz consolidada contendo:

1. Funcionalidades e fluxos já mapeados.
2. Cenários existentes e respectivos arquivos de teste.
3. Cobertura dos cenários CT-001 a CT-005.
4. Cobertura de frontend, backend e fluxos integrados, quando aplicável.
5. Lacunas identificadas na auditoria e na exploração via Playwright MCP.
6. Novos cenários recomendados, com prioridade, severidade e justificativa.
7. Regras de negócio pendentes de confirmação.
8. Riscos funcionais e possíveis regressões.
9. Dependências de ambiente e limitações de execução.
10. Organização proposta para as suítes.
11. Estratégia de execução via Playwright MCP e ferramentas complementares.
12. Evidências necessárias e critérios de aceite.
13. Plano de execução priorizado.

A matriz deve distinguir claramente:

- Planejado: cenário recomendado, ainda não implementado.
- Implementado: cenário existente no código, ainda sem execução comprovada nesta análise.
- Executado: cenário com registro verificável de execução.
- Aprovado: cenário executado cujas assertions atenderam aos critérios confirmados.
- Reprovado: cenário executado com divergência comprovada.
- Bloqueado: execução impedida por dependência ou restrição identificada.
- Inconclusivo: evidências insuficientes para determinar o resultado.
- Pendente: cenário aguardando execução, definição de regra ou aprovação.

## Autorização e execução

Antes de implementar ou modificar testes, apresentar a matriz de cobertura e aguardar autorização explícita.

Após a aprovação:

1. Implementar somente os cenários autorizados.
2. Priorizar os testes de frontend com Playwright MCP.
3. Executar as validações complementares de backend ou integração somente quando autorizadas e aplicáveis.
4. Registrar as assertions, os resultados observados e as evidências.
5. Atualizar a matriz com a situação real de cada cenário.
6. Apresentar um relatório final com aprovados, reprovados, bloqueados, inconclusivos e pendentes.
7. Relacionar os defeitos encontrados às evidências e às regras confirmadas.
8. Apresentar recomendações para a próxima etapa sem realizar alterações adicionais não autorizadas.

O resultado final deve refletir exclusivamente o trabalho efetivamente realizado e comprovado. A prioridade é garantir qualidade funcional do Menu On-Line, principalmente no frontend, sem perder de vista os riscos de integração e backend identificados na auditoria.