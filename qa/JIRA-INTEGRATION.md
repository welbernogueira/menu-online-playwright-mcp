# Integração Codex, Atlassian MCP e Playwright

## Diagnóstico do ambiente

Registro verificado em 24/10/2026: `.vscode/mcp.json` contém o servidor Playwright; `.codex/config.toml` do projeto registra o endpoint oficial `https://mcp.atlassian.com/v2/mcp`, sem token ou segredo. O Codex só carrega configurações `.codex/` de projeto confiável. O processo isolado inicial não tinha `CODEX_HOME`, e a listagem CLI não comprovou o estado OAuth.

Na sessão autenticada posterior, o fluxo OAuth 2.1 do Atlassian foi concluído e as ferramentas Jira de leitura, comentário e upload foram confirmadas por operações aceitas no MCP. Esse estado de autenticação é gerenciado pela instalação/usuário e não fica no arquivo do projeto; verifique as ferramentas reais em cada nova sessão. Uma indicação `Unknown` em `codex mcp list` não substitui uma chamada autenticada bem-sucedida nem prova, sozinha, que a autenticação falhou.

O Atlassian MCP v2 documenta ferramentas para consultar uma issue, ler comentários, adicionar/editar comentário e enviar arquivos locais como anexos. Como há uma ferramenta de upload documentada, a integração não introduz um token REST nem credenciais Jira no repositório.

## Ativação e verificação

1. Abra o projeto no Codex e confirme que ele está marcado como confiável para carregar `.codex/config.toml`.
2. Reinicie a extensão/sessão do Codex para carregar o servidor `atlassian`.
3. Na extensão do Codex, abra **Codex Settings → MCP servers**, selecione `atlassian` e escolha **Authenticate**. Conclua o login e consentimento na janela Atlassian. Não cole senha ou token no chat.
4. Como alternativa, em um terminal onde a instalação normal do Codex encontre seu diretório de configuração, autentique com:

   ```powershell
   codex mcp login atlassian
   ```

5. Confirme a conexão na lista MCP da extensão, com `codex mcp list` ou `/mcp` no TUI do Codex. Depois valide com `atlassianUserInfo`, `getAccessibleAtlassianResources` ou `getJiraIssue`; uma chamada Jira bem-sucedida é a confirmação efetiva. A existência do bloco em `config.toml` sozinha não comprova autenticação.

Neste ambiente de execução, `codex mcp list` retornou que `CODEX_HOME` não estava definido; por isso a autenticação deve ser feita pela extensão ou pelo terminal normal do usuário, fora desta execução isolada.

Se preferir configuração global, em vez da configuração deste projeto, use `codex mcp add atlassian --url https://mcp.atlassian.com/v2/mcp` somente se o servidor ainda não estiver registrado na configuração do usuário; depois autentique e verifique como acima. A configuração global é compartilhada entre CLI e extensão do Codex.

Referências oficiais: [configuração MCP no Codex](https://learn.chatgpt.com/docs/extend/mcp), [configuração Codex](https://learn.chatgpt.com/docs/config-file/config-basic), [início rápido Atlassian Rovo MCP](https://developer.atlassian.com/cloud/rovo-mcp/guides/getting-started/) e [ferramentas suportadas pelo Atlassian MCP v2](https://support.atlassian.com/atlassian-ai-gateway/docs/supported-tools/).

## Fluxo quando o usuário solicitar execução e publicação

1. Exigir uma chave de issue explícita. Obter os recursos Atlassian acessíveis e seu `cloudId`; a API MCP exige esse contexto.
2. Ler a issue pela chave com `getJiraIssue`. Validar chave, título, descrição e relação com a execução QA. Não publicar em issue sem relação clara com Menu On-Line; não criar issues de bug nem alterar status.
3. Consultar a auditoria, critérios e suítes do projeto. Executar `npm test`, que usa a cópia local por padrão. Uma saída diferente de zero por falhas funcionais não cancela a preparação se os relatórios foram gerados; os vereditos reais devem ser publicados.
4. Capturar pelo Playwright MCP o JPEG de cada card da execução. Sincronizar os artefatos com `npm run qa:report -- <executionId>` e verificar relatório, planilha e evidências conforme `qa/AGENTS.md`.
5. Depois de obter o título exato da issue via MCP, preparar a tabela e os screenshots da execução:

   ```powershell
   npm run qa:jira:prepare -- --issue=QA-12 --issue-title="Título exato da issue" --execution=<executionId>
   ```

   Para validar sem escrever arquivos, acrescente `--dry-run`. O script **não acessa nem escreve no Jira**. Ele lê `report.xlsx` como fonte exclusiva da tabela, valida a ordem exata das 11 colunas e todas as linhas contra os IDs e vereditos de `report.json`, valida os JPEGs por ID e copia somente os screenshots para `jira-publication/attachments/`. A planilha permanece em `qa/reports/<executionId>/report.xlsx`; não é copiada para a pasta de anexos, não é enviada ao Jira e não recebe link para download no comentário. Se a planilha não tiver todas as linhas do relatório, a preparação falha e exige regenerar os artefatos pela rotina QA.

   Antes de preparar os anexos ou publicar, gere e revise a representação tabular isolada da planilha:

   ```powershell
   npm run qa:jira:prepare -- --preview-table --execution=<executionId>
   ```

   Esse modo só lê `report.xlsx`, gera `jira-publication/table-comment-preview*.html` e compara cada cabeçalho e valor recuperado do HTML com a célula de origem. A saída informa a quantidade de linhas/colunas e se os IDs, em ordem, também correspondem a `report.json`; não acessa o Jira. Se `reportMatchesWorkbook` for `false`, a prévia não representa a execução completa e a divergência deve ser resolvida pela rotina QA antes de publicar.

   A primeira preparação gera `comment-template-XX-of-YY.html`, com a tabela e marcadores explícitos de mídia pendente, além do `manifest.json`. Esses modelos não são publicáveis. A tabela preserva os nomes, a ordem e os valores das 11 colunas; a coluna `Evidências` é substituída pela imagem real da mesma linha somente depois de obter as referências de mídia do Atlassian.

6. Antes de enviar mídia, confira a sintaxe pelo `getContentFormatGuide` do Atlassian MCP, usando `toolName=addOrEditJiraIssueComment`. A versão consultada deste guia confirma:

   - `contentFormat: "html"` para conteúdo rico em comentários;
   - `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>` e `<td>` como estrutura de tabela;
   - a conversão desse HTML para ADF com nós `table`, `tableRow`, `tableHeader` e `tableCell`, que o Jira renderiza como tabela visual; Markdown com barras verticais, HTML enviado como texto simples e parágrafos por cenário não equivalem a essa estrutura;
   - `<br>` como quebra de linha dentro de células. O preparador escapa caracteres HTML e valida o retorno dos valores antes de produzir a prévia.
   - `media single` como bloco permitido dentro de célula de tabela;
   - `<figure data-type="media-single">` com `<div data-type="media" data-media-type="file" data-id="..." data-collection="...">` para uma imagem anexada.

   A célula mantém também o valor original de `Evidências` do XLSX como legenda (`figcaption`); a imagem real continua sendo o conteúdo visual principal.

   A documentação também esclarece que `inlineFileId` acrescenta mídia ao final do comentário. Para a imagem ficar na linha e célula correspondentes, use o nó HTML de mídia na célula e `contentFormat: "html"`; não use Markdown de imagem, URL ou caminho local como se fossem renderização inline. Consulte o [guia oficial do Atlassian Rovo MCP](https://developer.atlassian.com/cloud/rovo-mcp/guides/supported-tools/) e a operação [getContentFormatGuide](https://developer.atlassian.com/cloud/rovo-mcp/guides/supported-tools/).

7. Para cada screenshot preparado, em ordem pelo **ID do cenário**:

   1. Chame a ferramenta descoberta `uploadAttachmentToJiraIssue` com `issueIdOrKey` e o `filePath` local. Execute o `uploadCommand` exatamente como retornado pelo MCP.
   2. Guarde `fileId`, `collection` e `fileName` retornados, associados ao mesmo `scenarioId`. O `fileName` deve ser igual ao nome preparado `${executionId}-${scenarioId}.jpg`.
   3. No modo `inline`, não chame a segunda fase de anexação standalone e não passe `inlineFileId` para esse arquivo. A imagem será anexada e posicionada pelo nó HTML no comentário; executar as duas modalidades duplicaria o arquivo.

   Registre as referências no arquivo local `qa/reports/<executionId>/jira-publication/media-map.json`:

   ```json
   {
     "schemaVersion": "1.0",
     "issueKey": "QA-12",
     "executionId": "<executionId>",
     "mode": "inline",
     "media": [
       {
         "scenarioId": "CT-001",
         "fileName": "<fileName retornado pelo MCP>",
         "fileId": "<fileId retornado pelo MCP>",
         "collection": "<collection retornada pelo MCP>"
       }
     ]
   }
   ```

8. Finalize a publicação localmente, sem acessar o Jira:

   ```powershell
   npm run qa:jira:prepare -- --issue=QA-12 --issue-title="Título exato da issue" --execution=<executionId> --media-map=qa/reports/<executionId>/jira-publication/media-map.json
   ```

   O script valida a relação um-para-um entre ID, imagem, `fileId` e `collection`, substitui os marcadores pelas figuras inline e gera `comment-XX-of-YY.html`. Não publica automaticamente. O limite configurado é 24.000 caracteres por comentário, abaixo do limite documentado de 32.767; se necessário, divide as linhas em blocos numerados. Cada bloco repete o cabeçalho completo das 11 colunas e possui um marcador de idempotência `executionId:table:<bloco>`.

   Para transferir um bloco ao Atlassian MCP sem depender da página de códigos do terminal, emita apenas Base64 ASCII pelo preparador:

   ```powershell
   npm --silent run qa:jira:prepare -- --execution=<executionId> --comment-base64=comment-01-of-03.html
   ```

   Substitua o nome pelo arquivo listado no `manifest.json`. O comando valida UTF-8, tabela, marcador e associação de mídia do bloco antes de emitir Base64. Decodifique esse valor estritamente como UTF-8 em memória na mesma orquestração que chama o MCP. Não passe HTML acentuado pela saída textual padrão do PowerShell nem converta bytes inválidos com substituição silenciosa.

   **Fallback somente quando o guia oficial não aceitar mídia inline:** interrompa o modo inline e não publique um comentário que mostre apenas texto. Anexe cada JPEG standalone pelas duas fases do `uploadAttachmentToJiraIssue`; depois releia a issue e copie `attachmentId` e a URL `content` efetivamente retornada nos metadados do anexo. Não construa essa URL e não use URL temporária assinada. Monte `media-map.json` com `mode: "link"`, `scenarioId`, `fileName`, `attachmentId` e `url`; finalize com `--media-mode=link`. O script publica uma referência clicável direta para a imagem e registra explicitamente a limitação de renderização inline. A API oficial distingue a URL de conteúdo e a URL de thumbnail do anexo ([Jira Cloud REST API — attachments](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-attachments/)).

9. Antes da primeira escrita, conferir o `manifest.json`, todos os blocos HTML e a issue. Consultar comentários e anexos existentes pelos marcadores de idempotência. Se um marcador da execução já existir, não adicionar outro comentário nem editar/apagar o comentário existente sem autorização explícita do usuário; interromper a publicação e informar o conflito. Não publicar nenhum modelo que ainda contenha `UPLOAD INLINE PENDENTE`.

10. Somente quando não houver comentário existente para os mesmos marcadores, envie cada JPEG pelo fluxo inline e publique cada bloco por `addOrEditJiraIssueComment`, passando `commentBody` lido como UTF-8 e `contentFormat: "html"`. Nenhum XLSX é anexado em qualquer etapa.

11. Após publicar, releia a issue, comentários e anexos. Valide que:

   - há exatamente uma linha de tabela para cada cenário do XLSX e todos os blocos têm as 11 colunas na ordem definida; o corpo recebido em HTML corresponde aos nós ADF `table`/`tableRow`/`tableHeader`/`tableCell` e não a parágrafos;
   - no modo inline, cada cenário aponta para o `mediaId` retornado para seu próprio ID, a figura aparece dentro da célula correta e o anexo correspondente está acessível; no fallback, o link abre o anexo standalone com o mesmo ID;
   - os blocos completos foram aceitos e não há um anexo `${executionId}-report.xlsx` desta execução;
   - os valores da tabela correspondem à planilha e os resumos correspondem às contagens reais.

   A leitura HTML/ADF confirma a associação estrutural e a presença do nó de mídia; quando o MCP não confirmar a renderização visual, inspecione o comentário na issue por um navegador autenticado antes de afirmar que a imagem foi exibida. Se essa inspeção não estiver disponível, relate a limitação e não declare a exibição inline visualmente verificada. Registre sucesso parcial ou erro sem declarar publicação completa se faltar comentário, imagem, associação ou confirmação.

12. Trate a publicação como uma sequência de checkpoints idempotentes: para cada marcador `executionId:table:<n>`, leia os comentários imediatamente antes de escrever. Se o marcador já existir uma vez, valide esse bloco e não o recrie. Se existir mais de uma vez, interrompa para reconciliação. Depois de cada escrita, releia a issue e confirme marcador, tabela, texto UTF-8 e mídias daquele bloco antes de avançar. Se a resposta da escrita for incerta, faça a leitura posterior primeiro; só tente novamente se o marcador estiver ausente. Registre bloco concluído apenas após a confirmação. Uma edição de comentário existente exige autorização explícita, limitada ao ID informado pelo usuário.

13. Ao retomar uma execução parcial, reconcilie o conteúdo já publicado por marcador e `scenarioId`, não pela ordem dos anexos. Reutilize os blocos e o `media-map.json` originais; não repita uploads confirmados. Se os arquivos locais ou o mapeamento não puderem ser validados, pare sem completar com dados reconstruídos ou presumidos.

O comentário pode ser dividido em blocos, cada um com o cabeçalho de 11 colunas repetido; nenhuma linha ou coluna pode ser omitida. Os IDs do cenário determinam a associação dos screenshots. JSON bruto, relatório visual, traces e `report.xlsx` permanecem locais. O CT-035 é uma checagem estática: publique a captura JPEG do card desse cenário, sem inventar screenshot da aplicação.

### Limites e segurança

- O fluxo padrão executa a cópia local; não testa produção e não dispara WhatsApp, telefone ou outro link externo.
- Publicar resultados e anexos é uma operação externa. Só ocorre após solicitação explícita com chave Jira e validação da issue.
- Não mudar status, criar bugs, comentar em outro card ou incluir credenciais no comentário.
- O comentário apresenta a linha de base como critério de QA provisório, não como requisito comercial aprovado.
- O comentário de CT-034 não replica o conteúdo de console detectado; informa o achado sem copiar valores de endereço/pedido.
- Se o servidor Atlassian MCP não estiver autenticado ou a ferramenta de upload não estiver habilitada, parar a etapa de publicação, conservar o pacote local e explicar o bloqueio. A documentação oficial já confirma a operação de upload; não criar uma integração REST redundante sem necessidade.
- A preparação e a publicação nunca anexarão o XLSX. Um arquivo Excel que já esteja anexado — inclusive por uma tentativa anterior da mesma execução — não é removido automaticamente, para preservar o histórico. Não o reenvie; registre esse anexo remanescente e só o remova com autorização explícita do usuário.
- Todos os arquivos de publicação são lidos e gravados com UTF-8 explícito. O preparador rejeita U+FFFD e sequências comuns de mojibake antes da exportação; `--comment-base64` é o transporte ASCII seguro para o corpo HTML.
- Após publicar, leia o comentário novamente em HTML e valide palavras com acentos, cedilha e travessão. Uma resposta de sucesso sem leitura posterior não comprova a integridade dos caracteres.
- O manifest precisa cobrir todos os cenários uma única vez e em ordem. Cada imagem deve estar associada ao `fileId` e `collection` do mesmo `scenarioId`.
- `npm run test:qa:jira-table` cobre UTF-8/Base64, detecção de mojibake, caracteres portugueses, divisão sem duplicação de cenários, referências de mídia por ID e decisão de retry após leitura posterior.
