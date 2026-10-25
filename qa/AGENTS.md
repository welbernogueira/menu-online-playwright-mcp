# Frontend QA — Instruções do Codex

## Objetivo

Explorar o front-end do Menu On-Line e capturar evidências visuais com Playwright MCP; implementar e executar suítes automatizadas pelo Playwright Test CLI, usando a auditoria funcional como referência.

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
- Utilize o Playwright MCP para explorar a interface e observar comportamentos reais. Execute suítes automatizadas pelo CLI após autorização.
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

### Linha de base de execução autorizada

O responsável do projeto autorizou uma linha de base de QA para liberar os cenários que estavam pendentes na suíte completa. Consulte `docs/testes/criterios-padrao-execucao.md` antes de implementar ou executar esses casos. Os critérios ali definidos podem ser usados como oráculo de regressão desta suíte, mas devem continuar identificados como linha de base de QA, sem serem apresentados como políticas comerciais ou requisitos de produto formalmente aprovados. Não reabra como `test.fixme` os casos cobertos pelo documento; registre divergências como resultados de teste e mantenha explícitas as limitações indicadas.

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

Utilize o Playwright MCP para exploração e captura das evidências visuais. A execução da suíte Node/Playwright ocorre pelo Playwright Test CLI (`npm test`), pois o MCP de navegador não oferece um runner para os arquivos `*.spec.js`.

## Publicação de resultados no Jira

Quando o usuário solicitar explicitamente a execução e publicação dos resultados em uma issue Jira, siga [`JIRA-INTEGRATION.md`](JIRA-INTEGRATION.md). Use a configuração do Atlassian MCP v2 em `.codex/config.toml`, valide a issue antes da suíte e confirme cada operação pelo retorno do MCP.

Na publicação:

- `report.xlsx` é a fonte exclusiva das linhas e valores da tabela Jira. Não anexe o XLSX, não crie link para baixá-lo, não resuma nem omita suas linhas ou colunas e não altere seus valores durante a conversão.
- Se um XLSX já existir na issue por uma tentativa anterior, não o envie novamente nem o apague automaticamente. Registre-o como remanescente; remover um anexo existente requer autorização explícita.
- Preserve exatamente as 11 colunas e a ordem definidas em `qa/standards/REGRAS-TEMPLATE-BASE.MD`; não acrescente uma coluna separada de ID.
- Forme uma tabela visual no comentário com `contentFormat: "html"` e a estrutura HTML suportada pelo Atlassian MCP: `<table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>`. O Jira converte essa estrutura em nós ADF `table`, `tableRow`, `tableHeader` e `tableCell`. Não use Markdown com barras verticais, texto simples ou parágrafos como substitutos da tabela.
- Escape caracteres especiais para HTML e preserve quebras de linha com `<br>`. Valide que a leitura de volta do HTML mantém todos os cabeçalhos, linhas, colunas e valores da planilha. O comando `npm run qa:jira:prepare -- --preview-table --execution=<executionId>` cria uma prévia local e não acessa o Jira; `reportMatchesWorkbook` deve ser verdadeiro antes de publicar.
- Teste a conversão do preparador com `npm run test:qa:jira-table` antes de reutilizá-la. Se a tabela não couber em um comentário, divida em blocos com o cabeçalho oficial repetido e sem omitir células.
- Antes de preparar a publicação, valide que as linhas e os vereditos do XLSX correspondem a todos os cenários de `report.json`. Se houver divergência, regenere/corrija a planilha pela rotina existente; não complete valores durante a conversão.
- Para cada linha com screenshot, associe a imagem pelo ID do cenário, envie a imagem real e obtenha o `fileId` e a `collection` retornados pelo Atlassian MCP. Não associe imagens pela ordem dos arquivos.
- Para imagens posicionadas dentro da célula `Evidências`, use o formato HTML de comentário e a sintaxe de mídia indicada por `getContentFormatGuide` para `addOrEditJiraIssueComment`. Não presuma que Markdown, HTML genérico, caminho local ou URL de anexo renderize a imagem.
- O upload de mídia inline usa a fase 1 de `uploadAttachmentToJiraIssue` e os identificadores retornados no nó HTML da linha correspondente. Não execute a fase 2 nem use `inlineFileId` quando a imagem já estiver embutida no corpo, pois isso pode criar anexo duplicado ou posicioná-lo fora da tabela.
- Só use link clicável na coluna `Evidências` quando a renderização inline não for suportada; registre essa limitação e associe o link ao anexo correto. Nunca apresente uma descrição ou nome de arquivo como substituto definitivo de uma imagem disponível.
- No fallback por link, anexe standalone, releia os metadados oficiais do anexo e use a URL `content` estável retornada pelo Jira, sem construir uma URL nem publicar links temporários assinados.
- Se a tabela exceder o limite de um comentário, divida-a em comentários HTML numerados, repita em cada bloco o cabeçalho completo das 11 colunas e não elimine linhas. Use os marcadores de idempotência do preparador para evitar duplicação.
- Consulte os comentários existentes antes de escrever. Não publique outro comentário para um marcador que já exista e não edite/apague comentários existentes sem autorização explícita do usuário; interrompa a publicação e relate o conflito.
- Preserve UTF-8 de ponta a ponta. Antes de passar um bloco HTML acentuado ao MCP, use `npm --silent run qa:jira:prepare -- --execution=<executionId> --comment-base64=comment-XX-of-YY.html`; transfira o Base64 ASCII e decodifique estritamente como UTF-8 em memória. Não envie o texto por stdout PowerShell com codificação padrão. O preparador deve rejeitar mojibake e U+FFFD antes da escrita.
- Publique um bloco por vez. Antes de cada bloco, consulte o marcador `executionId:table:<n>`; depois da escrita, releia o comentário e confirme conteúdo UTF-8, 11 cabeçalhos, linhas e imagens antes de avançar. Em resposta incerta, consulte o Jira antes de qualquer retry; não repita se o marcador já estiver presente.
- Ao retomar publicação parcial, reconcilie os blocos e screenshots por marcador e identificador `CT-xxx`, preserve blocos/anexos já confirmados e não infira mapeamentos pela ordem dos arquivos. Declare conclusão somente depois de confirmar os 36 (ou a quantidade real da execução) cenários e mídias no Jira.
- `npm run test:qa:jira-table` verifica caracteres portugueses e Base64 UTF-8, detecção de corrupção, blocos completos sem duplicação, mapeamento de mídia por cenário e prevenção de retry duplicado após leitura de confirmação.
- Confirme no Jira cada comentário, a presença dos anexos, os nós de imagem no comentário e a correspondência entre cenário e evidência. Só declare a exibição inline verificada quando a leitura do comentário ou a inspeção visual confirmar a imagem; caso contrário, registre a limitação.

Não transicione a issue nem crie bugs. Sem autenticação ou ferramenta Jira disponível, conclua as etapas locais e informe que a publicação ficou bloqueada; nunca simule sucesso.

### Execução local padrão

- `npm test` executa todos os arquivos `tests/**/*.spec.js` na cópia local de `app/`; a configuração inicia e encerra um servidor estático em `127.0.0.1:8765`.
- A configuração bloqueia o host conhecido de produção. Um preview só pode ser alvo quando `BASE_URL` for informado explicitamente.
- Cada execução usa uma pasta exclusiva em `qa/reports/` e preserva `raw.json`, o relatório HTML nativo, screenshots, traces de falha, `report.json`, `report.html`, `report.xlsx` e cards HTML.
- O código de saída continua indicando falhas dos testes. O runner ainda finaliza e salva os relatórios quando uma ou mais assertions falham.
- Para abrir o HTML nativo mais recente, use `npm run test:report`.
- Para capturar JPEGs conforme `qa/standards/EVIDENCE-RULES.MD`, sirva a execução com `node qa/scripts/serve-report.cjs <executionId>`, renderize cada card via Playwright MCP em `http://127.0.0.1:8766/evidence/CT-xxx.html`, capture a página completa em `qa/reports/<executionId>/evidence/CT-xxx.jpg` e execute `npm run qa:report -- <executionId>` para sincronizar links, relatório e planilha.

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
