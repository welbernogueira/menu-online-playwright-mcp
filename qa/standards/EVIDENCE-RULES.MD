# Regras para Evidências Visuais de QA — Menu On-Line

## 1. Objetivo e formato

Padronizar a geração de evidências visuais dos testes de QA do projeto Menu On-Line, produzindo um card HTML/CSS e uma captura JPEG por cenário autorizado, vinculados aos dados reais da execução e aos relatórios correspondentes.

O foco principal é documentar os testes de frontend executados com o Playwright MCP, registrando o comportamento observado na interface, as ações realizadas, as assertions, o resultado esperado, o resultado obtido e o veredito.

Quando o cenário envolver APIs, integrações ou banco de dados, incluir as evidências complementares disponíveis, respeitando o escopo de validação e as ferramentas utilizadas.

O formato oficial das capturas é JPEG (`.jpg`). Não gerar PNG como formato final das evidências.

As evidências devem comprovar o que foi efetivamente observado, sem alterar, fabricar ou completar resultados com suposições.

## 2. Contexto e fontes de evidência

Antes de gerar evidências, consultar a auditoria e o mapeamento existentes em `docs/auditoria/`, além dos arquivos de teste e dos registros da execução selecionada.

Considerar, conforme a estrutura efetivamente utilizada pelo projeto:

- Documentos de auditoria funcional e matriz de cobertura.
- Cenários implementados e seus respectivos arquivos de teste.
- Registros reais de execução do Playwright.
- Relatórios e traces disponíveis.
- Screenshots e logs produzidos durante a execução.
- `report.json` e `raw.json`, quando fizerem parte do fluxo de execução.
- Respostas de API, registros do Postman/Newman e evidências complementares, quando aplicáveis.

Não presumir que todos esses arquivos já existem. Identificar quais fontes estão disponíveis e registrar as limitações quando faltarem dados necessários.

A auditoria, o plano de testes e os cenários propostos são fontes de contexto, mas não substituem evidências de execução.

## 3. Fonte e integridade dos dados

- Utilizar os registros reais da execução selecionada como fonte dos resultados apresentados nos cards.
- Quando houver `qa/reports/{executionId}/raw.json`, utilizar o registro bruto correspondente ao cenário.
- Utilizar `report.json` para os dados normalizados e para as referências aos registros brutos, quando esse formato fizer parte do fluxo adotado.
- Para testes de frontend, utilizar os resultados reais observados via Playwright MCP, incluindo estados da interface, assertions, logs e screenshots disponíveis.
- Para testes de API, incluir request e response somente quando houver dados reais registrados.
- Exibir, conforme aplicável, request, response, assertions, resultado esperado, resultado obtido e veredito.
- Utilizar somente valores observados ou critérios definidos para o cenário.
- Nunca preencher lacunas com suposições.
- Quando um dado necessário não estiver disponível, mostrar `Não disponível na evidência` e manter o cenário inconclusivo se não for possível determinar o resultado.
- Registrar o `executionId` e a referência à origem da evidência, como JSON Pointer, quando houver um registro JSON correspondente.
- Quando não existir JSON Pointer, registrar a referência rastreável disponível, como arquivo de teste, identificação do cenário, registro de execução ou caminho do screenshot.
- Sanitizar tokens, credenciais, cookies, dados pessoais e outras informações sensíveis.
- Não incluir segredos em HTML, JPEG, relatórios, metadados ou links.
- Não alterar o conteúdo de uma evidência para simular aprovação ou corrigir visualmente uma falha.

## 4. Apresentação dos cards

Gerar um card por cenário autorizado, com identificação clara e conteúdo compatível com a camada testada.

### Conteúdo mínimo

Cada card deve apresentar:

- Identificador e nome do cenário.
- Funcionalidade ou fluxo relacionado.
- Veredito da execução.
- Ações ou passos relevantes.
- Resultado esperado.
- Resultado obtido.
- Assertions realizadas e seus resultados.
- Referência à evidência de origem.
- Identificação da execução.
- Limitações relevantes, quando existentes.

### Informações específicas do frontend

Quando aplicável, apresentar:

- Página ou rota validada.
- Elementos utilizados durante o teste.
- Ações realizadas, como clique, preenchimento, seleção ou navegação.
- Estado da interface antes e depois da ação.
- Textos, valores, mensagens e estados observados.
- Assertions relacionadas ao comportamento validado.
- Screenshot real que sustente a conclusão.

Não inventar requisições HTTP ou respostas de API para um cenário que validou exclusivamente a interface.

### Informações específicas de API e integração

Quando houver dados disponíveis e o cenário exigir essa validação, apresentar:

- Método HTTP e URL.
- Request body, quando existir.
- Status HTTP e tempo de resposta, quando registrados.
- Response body, quando disponível.
- Assertions executadas.
- Resultado esperado e resultado obtido.
- Referência ao registro bruto correspondente.

Quando o cenário combinar frontend e backend, distinguir os fatos observados na interface dos fatos comprovados por registros de API ou banco de dados.

## 5. Identidade visual

Utilizar um tema escuro inspirado no Carbon, com a seguinte paleta:

- Canvas: `#161616`
- Card: `#262626`
- Superfícies secundárias: `#393939`
- Texto principal: `#f4f4f4`
- Bordas: `#525252`
- Azul de destaque: `#0f62fe`

Regras visuais:

- Preservar contraste e legibilidade.
- Utilizar fontes locais ou famílias genéricas disponíveis no sistema.
- Não carregar fontes, scripts, imagens ou estilos remotos.
- Manter o veredito em destaque, com fonte sans-serif de no mínimo 20 px.
- Aplicar a mesma hierarquia visual a todos os vereditos, sem sugerir aprovação antes da análise.
- Garantir que textos extensos e estruturas JSON sejam legíveis.
- Evitar cortes de conteúdo e rolagem que esconda informações essenciais.
- Garantir que a captura inclua o card completo.
- Utilizar HTML/CSS simples, sem instalar dependências adicionais.
- Preservar a correspondência entre o card renderizado e os dados reais da execução.

## 6. Regras para o veredito

O veredito deve refletir o resultado real do cenário, e não apenas o status geral da ferramenta de execução.

Utilizar os seguintes valores, conforme a convenção adotada para os relatórios do projeto:

- `PASSOU`: o cenário foi executado e todas as condições esperadas e confirmadas foram atendidas.
- `NÃO PASSOU`: o cenário foi executado e apresentou uma divergência comprovada em relação ao resultado esperado.
- `IMPEDIDO`: a execução não pôde ser concluída devido a um impedimento identificado.
- `INCONCLUSIVO`: as evidências são insuficientes para determinar se o comportamento atende ao esperado.
- `PENDENTE`: o cenário ainda não foi executado ou aguarda definição ou autorização.

Não converter automaticamente o status do executor em veredito funcional. Uma execução tecnicamente concluída pode conter falhas funcionais, assim como uma falha de automação pode impedir a avaliação do comportamento da aplicação.

Se o resultado esperado depender de uma regra de negócio não confirmada, não declarar aprovação ou reprovação com base em uma hipótese.

## 7. Arquivos e vínculo aos relatórios

Organizar as evidências por execução, preservando o histórico e a rastreabilidade.

Estrutura de referência:

`qa/reports/{executionId}/`

- `raw.json`: dados brutos da execução, quando aplicável.
- `report.json`: dados normalizados dos cenários e resultados.
- `report.html`: relatório visual da execução.
- `report.xlsx`: matriz de resultados, quando solicitada ou prevista no fluxo.
- `evidence/`: capturas JPEG e arquivos HTML de origem.

Nomear cada captura com um identificador ordenável e um slug descritivo, por exemplo:

- `evidence/01-carregamento-inicial.jpg`
- `evidence/02-catalogo-produtos.jpg`
- `evidence/03-validacao-formulario.jpg`
- `evidence/04-carrinho-atualizado.jpg`

Os nomes são exemplos de formato; utilizar somente cenários realmente existentes e executados.

Regras obrigatórias:

- Salvar cada JPEG em `qa/reports/{executionId}/evidence/`.
- Preservar o HTML fonte utilizado para renderizar o card junto à evidência.
- Registrar em `report.json` o caminho relativo do JPEG, a ferramenta de captura, o `executionId` e a referência de origem, incluindo JSON Pointer quando aplicável.
- Incluir um link relativo clicável para cada imagem no `report.html`.
- Incluir o link da evidência na célula `Evidências` da linha correspondente em `report.xlsx`, quando esse relatório fizer parte da entrega.
- Não associar evidências de um cenário a outro.
- Não reutilizar screenshots de execuções anteriores como evidência de uma nova execução.
- Não substituir evidências ausentes por imagens ilustrativas ou simuladas.
- Não presumir que os relatórios citados existem sem verificar os arquivos efetivamente disponíveis.

Se o projeto ainda não possuir essa estrutura de relatórios, propor a organização antes de implementá-la e aguardar autorização quando a criação ou alteração de arquivos estiver fora do escopo aprovado.

## 8. Fluxo com Playwright MCP

1. Identificar o cenário autorizado, seus pré-requisitos, as assertions e os critérios de aceite.
2. Consultar os arquivos de auditoria e os testes existentes para confirmar o escopo e evitar duplicidade.
3. Executar o cenário autorizado por meio do Playwright MCP.
4. Registrar as ações realizadas e os estados observados durante a execução.
5. Capturar as evidências necessárias usando o Playwright MCP.
6. Confirmar que cada screenshot corresponde ao cenário e à execução atuais.
7. Registrar os resultados obtidos e relacioná-los às assertions.
8. Normalizar os dados em `report.json` somente quando esse formato fizer parte do fluxo adotado.
9. Gerar o card HTML/CSS com base nos dados reais registrados.
10. Renderizar o card no Playwright MCP e capturar o elemento completo como JPEG.
11. Validar o arquivo gerado e atualizar os links dos relatórios.
12. Verificar a correspondência entre cenário, resultado, card, screenshot e referência de origem.

Não utilizar um navegador local como substituto do Playwright MCP quando a execução via MCP for requisito explícito.

Se o mecanismo de captura não permitir salvar diretamente no workspace, registrar a limitação e utilizar somente um procedimento de transferência de bytes que seja suportado e verificável no ambiente. Não inventar comandos, ferramentas ou caminhos de saída.

## 9. Fluxo complementar com Postman/Newman

Quando o cenário envolver testes de API e houver execução autorizada:

1. Identificar a collection, o ambiente, as requisições, os cenários e as assertions existentes.
2. Confirmar que o ambiente utilizado é o alvo local ou outro ambiente explicitamente autorizado.
3. Executar os testes pela ferramenta aprovada, como Postman/Newman ou MCP correspondente.
4. Preservar os resultados brutos da execução sem substituir dados reais por informações simuladas.
5. Se a ferramenta fornecer apenas totais agregados, registrar essa limitação e não inferir resultados individuais por cenário.
6. Utilizar o Newman local como complemento somente quando estiver disponível e autorizado, sem instalar dependências desnecessárias.
7. Normalizar cada request, response e assertion em `report.json`, vinculando o registro bruto por JSON Pointer quando aplicável.
8. Gerar os cards somente após a validação dos dados normalizados.
9. Relacionar as evidências de API ao cenário correto e à mesma execução.
10. Não utilizar resultados de API para afirmar que o frontend foi validado quando a interface não tiver sido efetivamente testada.

## 10. Regras para captura JPEG

- Utilizar o Playwright MCP para renderizar o HTML/CSS e capturar o card.
- Capturar o elemento completo do card, sem cortar o conteúdo relevante.
- Gerar JPEG com qualidade adequada, preferencialmente 90 ou equivalente.
- Garantir que o veredito, os textos, as assertions e as informações de rastreabilidade permaneçam legíveis após a compressão.
- Validar a assinatura JPEG, que deve iniciar com os bytes `FF D8 FF`.
- Confirmar que o arquivo existe e pode ser aberto.
- Verificar o enquadramento e a legibilidade da imagem.
- Confirmar que o arquivo corresponde ao card e ao cenário corretos.
- Não gerar PNG como formato final.
- Remover arquivos temporários de transferência quando não forem mais necessários.
- Não modificar a imagem depois da captura para alterar o resultado, o veredito ou as informações observadas.

## 11. Verificação antes de concluir

Antes de entregar as evidências, verificar:

1. Cada texto apresentado no card corresponde a dados de execução, ao registro de origem ou a critérios definidos para o cenário.
2. Assertions, resultado esperado, resultado obtido e veredito estão coerentes entre si.
3. A captura JPEG pertence ao cenário e à execução corretos.
4. Existe um JPEG válido para cada cenário solicitado que tenha sido executado e cuja evidência tenha sido autorizada.
5. O HTML fonte está disponível para rastreabilidade.
6. A captura inclui o card completo e possui conteúdo legível.
7. Os caminhos relativos dos arquivos estão corretos.
8. Os links no `report.html` e no `report.xlsx` apontam para as evidências correspondentes.
9. `raw.json`, `report.json`, `report.html` e `report.xlsx` apresentam informações consistentes, quando todos fizerem parte da entrega.
10. As informações sensíveis foram removidas ou sanitizadas.
11. As limitações de execução e as evidências indisponíveis estão documentadas.
12. O status do executor não foi confundido com o veredito funcional.
13. Nenhum resultado foi inventado ou alterado para produzir uma aparência de sucesso.

Se algum item não puder ser validado, registrar a limitação e não declarar a entrega completamente validada.

## 12. Aprovação e escopo de execução

Se o usuário solicitar explicitamente apenas um exemplo, produzir e vincular somente um card, com seu HTML fonte e captura JPEG, e aguardar aprovação antes de gerar os demais.

Quando houver autorização para uma suíte completa ou para todas as evidências de uma execução, gerar os cards de todos os cenários abrangidos pela autorização.

Não ampliar automaticamente o escopo para outros testes, outras execuções ou outros relatórios.

Não executar cenários novos, alterar testes ou modificar a aplicação apenas porque a geração de evidências exige dados que ainda não existem. Solicitar autorização ou registrar o impedimento.

## Regra final

A evidência visual deve ser um registro fiel, rastreável e verificável da execução real do Menu On-Line.

O Playwright MCP deve ser priorizado para a exploração, validação visual e captura dos cards do frontend. As ferramentas de API, banco de dados e relatórios devem ser utilizadas como complementos quando forem necessárias e estiverem autorizadas.

Nenhum card, screenshot, relatório ou veredito pode apresentar como fato algo que não foi observado, executado ou fundamentado em critérios confirmados.