# Critérios padrão para execução da suíte completa

**Versão:** 1.0
**Definição:** 24/10/2026
**Escopo:** linha de base de QA autorizada pelo responsável do projeto para tornar executáveis CT-008, CT-017 a CT-020, CT-022 a CT-026, CT-029 a CT-034 e CT-036.

## Como interpretar esta linha de base

O responsável autorizou o uso de comportamentos padrão para executar os cenários que estavam em `test.fixme`. Os critérios deste documento são a **linha de base de QA da suíte**: um resultado diferente deve ser registrado como divergência verificável, mas não deve ser descrito como uma regra comercial formalmente aprovada.

Quando o critério deriva do código ou do site atual, isso está indicado. Essa origem permite regressão reproduzível; ela não comprova que textos comerciais, preços, produtos ou destinos externos sejam oficiais. Se o responsável do produto fornecer uma regra diferente, este documento e as assertions correspondentes devem ser atualizados antes da próxima execução.

`PASSOU` significa que o comportamento corresponde a esta linha de base. `FALHOU` significa que uma assertion comprovou divergência da linha de base. Nenhum dos dois vereditos certifica o catálogo, a política comercial ou a conformidade integral do produto.

## Critérios dos cenários liberados

| CT | Critério de aceite da linha de base de QA | Limite da conclusão |
|---|---|---|
| CT-008 | As seções Serviços, Cardápio, Depoimentos e Reservas existem, têm título e conteúdo não vazio; os links internos de navegação apontam para destinos existentes. A verificação é estrutural e de regressão. | Não valida a veracidade de depoimentos, alegações de marketing, titularidade de marcas ou aprovação comercial do conteúdo. |
| CT-017 | O subtotal é a soma de preço unitário × quantidade. Para carrinho não vazio, a linha de base atual considera entrega fixa de R$ 5,00 por pedido, uma única vez, e total = subtotal + entrega, formatados em BRL com duas casas decimais. | Os R$ 5,00 refletem a implementação atualmente observada e são um parâmetro provisório de QA, não confirmação de preço comercial. |
| CT-018 | CEP, endereço, bairro, número, cidade e UF são obrigatórios. Campo vazio ou composto apenas por espaços impede a revisão, mostra feedback identificável e mantém o usuário na etapa de endereço. Complemento é opcional. | O critério escolhe a validação mínima previsível para um endereço de entrega; não define mensagens comerciais exatas. |
| CT-019 | O placeholder de UF (`-1`) é inválido. A revisão só avança depois de selecionar uma UF brasileira válida (sigla de duas letras). O foco/feedback deve indicar a UF inválida. | É uma regra de validação segura para impedir endereço sem estado; o teste não valida cobertura geográfica do serviço de entrega. |
| CT-020 | O CEP manual aceita oito dígitos, com ou sem hífen único após o quinto dígito (`12345678` ou `12345-678`). A aplicação remove a máscara antes de montar o resumo. Letras, espaços internos, hífen em outra posição ou quantidade diferente de oito dígitos impedem a revisão. A validação manual não exige chamar ViaCEP. | A validação verifica formato, não existência geográfica do CEP. Um CEP sintaticamente válido pode não existir. |
| CT-022 | Resposta ViaCEP de CEP inexistente apresenta feedback que permita entender que a consulta não encontrou o CEP e que o preenchimento manual continua disponível. Falha de rede/timeout também deve apresentar feedback recuperável, manter o CEP e deixar o formulário utilizável. As respostas são mockadas; nenhum serviço público é chamado. | Não fixa uma redação exata para erro de rede nem mede disponibilidade externa. |
| CT-023 | Complemento vazio é aceito; quando preenchido, seu valor é preservado na revisão. Demais campos obrigatórios continuam validados. | A linha de base trata complemento como opcional, conforme a estrutura observada do formulário. |
| CT-024 | Ao voltar da revisão para o endereço, CEP, endereço, bairro, número, cidade, UF, complemento, itens do carrinho e total permanecem preenchidos, sem duplicação de itens. | Aplica-se à navegação dentro do modal durante a mesma sessão; não estabelece persistência após recarregar ou fechar o navegador. |
| CT-025 | A etapa de revisão prepara um link HTTPS `wa.me` com o telefone configurado pela aplicação e uma mensagem codificada que contém itens, quantidades, preços, endereço sintético, CEP e total. O teste inspeciona o link, sem abri-lo nem enviar mensagem. | Confirma formato e conteúdo construído pelo código local; não confirma que o telefone ou a mensagem sejam oficiais. |
| CT-026 | O link de reserva usa HTTPS para `wa.me`, com telefone numérico e mensagem não vazia; o link de contato usa `tel:` com telefone numérico. Os destinos são inspecionados no DOM e nunca ativados. | Confirma apenas estrutura técnica e consistência do destino configurado; titularidade e validade permanecem sem confirmação. |
| CT-029 | A página não apresenta rolagem horizontal involuntária (tolerância de 1 CSS px) nas larguras 320, 360, 390, 768, 1024 e 1366 px. Os elementos principais do cenário devem caber na viewport. | Matriz inicial de QA para telas pequenas, breakpoint responsivo, tablet e desktop; não substitui teste em dispositivos físicos. |
| CT-030 | Em contexto Chromium com toque habilitado e viewport 390 × 844, os controles de quantidade e adição são descobríveis e operáveis sem depender de hover. A interação deve atualizar quantidade/badge e permitir adicionar o produto. | Emulação de toque pelo Playwright não substitui validação de hardware real. |
| CT-031 | Navegação principal, abertura/fechamento do menu móvel, seletor de categoria, controles de produto, carrinho e ações de etapa exercitados no cenário devem ser alcançáveis e ativáveis por teclado. Escape deve fechar o modal quando ele estiver aberto. | Verificação automatizada parcial de teclado; não avalia estilo de foco nem equivale a auditoria manual completa com leitor de tela. Relacionada aos critérios de teclado da WCAG 2.2, sem declarar conformidade integral; foco visível continua pendente na pergunta 22. |
| CT-032 | O documento declara `lang="pt-BR"`; campos e controles exercitados possuem nome acessível programático, e os campos do endereço têm rótulos associados. | Verificação automatizada básica relacionada a idioma da página, rótulos/instruções e nome/papel/valor; não é certificação WCAG. |
| CT-033 | O navegador suportado pela configuração atual desta suíte é Chromium, que deve completar o fluxo essencial de abertura, catálogo e carrinho. | A configuração do projeto declara somente Chromium. Firefox, WebKit, versões de navegador e dispositivos não são considerados suportados por esta linha de base; a pergunta 21 continua aberta para decisão de produto. |
| CT-034 | Logs de console gerados ao montar a revisão não devem conter endereço, CEP, complemento ou conteúdo completo do pedido. O teste usa exclusivamente marcadores sintéticos e registra no relatório somente se houve vazamento, sem copiar o texto do pedido. | Critério mínimo de minimização de dados para a suíte. Não define retenção geral de logs nem política de produção/CI. |
| CT-036 | Contra servidor estático local em loopback, medir três navegações novas e registrar Navigation Timing. A mediana de `domContentLoadedEventEnd` deve ser ≤ 2.500 ms e a mediana de `loadEventEnd` ≤ 5.000 ms. Cada navegação tem timeout máximo de 10 s. | Orçamento inicial de QA para a cópia local, não SLA nem medição de produção/Core Web Vitals. Reavaliar ao mudar ambiente ou infraestrutura. |

## Isolamento e dados de teste

- Executar a suíte em `http://127.0.0.1:8765/`, servindo a cópia local de `app/`; não usar o domínio de produção para cenários que alterem estado da página.
- Usar somente valores sintéticos, identificados como dados de QA. Não usar endereço, telefone, CEP ou dados de cliente reais.
- Interceptar ViaCEP com respostas determinísticas. Não depender de rede pública para os CTs 021 e 022.
- Não clicar em links `wa.me`, `tel:`, redes sociais ou outros destinos externos. CT-025 e CT-026 verificam somente os links montados.
- Não alterar o código da aplicação para fazer a linha de base passar. Divergências devem ser reportadas com resultado e evidências; a correção do produto é trabalho separado.

## Evidências e interpretação

Aplicar `qa/standards/EVIDENCE-RULES.MD`: preservar o JSON bruto do Playwright, o relatório HTML nativo e o relatório resumido da execução; gerar card HTML e captura JPEG por cenário com o resultado real. As capturas devem usar somente dados sintéticos. Um cenário reprovado continua sendo evidência válida; não se deve omitir a falha nem representar como aprovado.

A execução da suíte local comprova somente o comportamento da cópia local indicada no relatório. Não atualiza automaticamente o estado da versão publicada nem encerra as perguntas de negócio listadas em `docs/auditoria/perguntas-pendentes.md`.

## Referências

- Código inspecionado: `app/index.html`, `app/js/app.js`, `app/js/dados.js`, `app/css/main.css`, `app/css/responsivo.css`.
- Decisões de cobertura e limitações: `docs/auditoria/inventario-funcional.md`, `mapa-de-fluxos.md`, `riscos-e-lacunas.md`, `matriz-de-cobertura.md`, `plano-de-suites.md` e `perguntas-pendentes.md`.
- Acessibilidade: [WCAG 2.2 — W3C Recommendation](https://www.w3.org/TR/WCAG22/). O CT-031/032 verifica somente as condições enumeradas neste documento.
- Relatório anterior que motivou as pendências: `qa/reports/2026-10-22-full-suite-local-05/`.
