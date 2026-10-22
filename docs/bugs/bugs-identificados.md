# Defeitos identificados — Menu On-Line

Registro iniciado com a exploração de QA da página publicada em `https://menu-online-project.vercel.app/`. A linha de base original está preservada abaixo. BUG-001 e BUG-002 receberam correção local validada, mas continuam abertos para o site publicado até implantação. BUG-003 recebeu correção local e passou na suíte local; a versão publicada ainda apresenta a falha e aguarda implantação e nova validação.

## BUG-001 — Poppins Regular responde 404

- **Descrição:** A declaração da fonte Poppins Regular tenta carregar um recurso que falha na página publicada.
- **Pré-condições:** Acesso à página inicial publicada; CSS `app/css/main.css` carregado; navegador com console e rede observáveis.
- **Passos de reprodução:**
  1. Abrir `https://menu-online-project.vercel.app/`.
  2. Aguardar o carregamento e consultar as requisições de rede e o console.
- **Resultado esperado:** A fonte Poppins Regular é carregada com sucesso, sem resposta 404.
- **Resultado atual:** `GET https://menu-online-project.vercel.app/FONTS/Poppins-Regular.otf` responde `404`; o navegador registra falha da fonte.
- **Evidência da linha de base:** o CSS original referenciava `../FONTS/Poppins-Regular.otf`, enquanto o arquivo local existente é `app/fonts/Poppins-Regular.otf`; no site publicado a URL maiúscula respondeu 404 e a face ficou em estado `error`.
- **Impacto:** O texto que especifica essa família usa uma fonte substituta; a tipografia pode diferir do design pretendido. Não foi observado impacto funcional na navegação da página.
- **Severidade sugerida:** Baixa (P3), sujeita à confirmação dos critérios visuais do produto.
- **Causa:** Divergência de capitalização confirmada no código local: `FONTS/` versus diretório existente `app/fonts/`.
- **Status:** Corrigido e validado no código local; permanece aberto no site publicado até implantação e confirmação.
- **Evidência pós-correção:** CT-002 passou contra o servidor local em 14/10/2026; o teste verificou resposta sem erro HTTP e face Poppins Regular carregada.
- **Pontos não confirmados:** A correção ainda não foi implantada nem validada no domínio publicado. A obrigatoriedade visual exata da família não foi definida.

## BUG-002 — Poppins Medium responde 404

- **Descrição:** A declaração da fonte Poppins Medium tenta carregar um recurso que falha na página publicada.
- **Pré-condições:** Acesso à página inicial publicada; CSS `app/css/main.css` carregado; navegador com console e rede observáveis.
- **Passos de reprodução:**
  1. Abrir `https://menu-online-project.vercel.app/`.
  2. Aguardar o carregamento e consultar as requisições de rede e o console.
- **Resultado esperado:** A fonte Poppins Medium é carregada com sucesso, sem resposta 404.
- **Resultado atual:** `GET https://menu-online-project.vercel.app/FONTS/Poppins-Medium.otf` responde `404`; o navegador registra falha da fonte.
- **Evidência da linha de base:** o CSS original referenciava `../FONTS/Poppins-Medium.otf`, enquanto o arquivo local existente é `app/fonts/Poppins-Medium.otf`; no site publicado a URL maiúscula respondeu 404 e a face ficou em estado `error`.
- **Impacto:** Textos que especificam essa família, incluindo elementos em negrito configurados no CSS, podem ser renderizados com fonte substituta. Não foi observado impacto funcional na página.
- **Severidade sugerida:** Baixa (P3), sujeita à confirmação dos critérios visuais do produto.
- **Causa:** Divergência de capitalização confirmada no código local: `FONTS/` versus diretório existente `app/fonts/`.
- **Status:** Corrigido e validado no código local; permanece aberto no site publicado até implantação e confirmação.
- **Evidência pós-correção:** CT-002 passou contra o servidor local em 14/10/2026; o teste verificou resposta sem erro HTTP e face Poppins Medium carregada.
- **Pontos não confirmados:** A correção ainda não foi implantada nem validada no domínio publicado. A obrigatoriedade visual exata da família não foi definida.

## BUG-003 — Imagem de fundo dos depoimentos responde 404

- **Descrição:** O CSS aponta a imagem de fundo da seção de depoimentos para um caminho sem nome de arquivo.
- **Pré-condições:** Acesso à página inicial publicada; CSS `app/css/main.css` carregado; navegador com rede e estilos computados observáveis.
- **Passos de reprodução:**
  1. Abrir `https://menu-online-project.vercel.app/`.
  2. Aguardar o carregamento e consultar a requisição de imagem com referenciador `app/css/main.css`.
  3. Inspecionar a regra `.background-depoimentos`.
- **Resultado esperado:** A seção não requisita `/img` como imagem; o card decorativo mantém 390 × 390 px, raio de 120 px e cor `#ffe8a3`; `./img/pizzas.png` continua carregando.
- **Resultado atual publicado (19/10/2026):** `GET https://menu-online-project.vercel.app/img` responde `404` (`type: image`). O estilo computado aponta para essa URL e o card ainda aparece com `rgb(255, 242, 204)`. `pizzas.png` responde `200` e tem `naturalWidth` 600.
- **Causa:** A regra CSS apontava para o diretório `../img`, sem especificar um arquivo de imagem.
- **Correção local:** A referência ativa foi removida e mantida comentada para rastreabilidade. O card decorativo foi ajustado para `#ffe8a3`, preservando dimensões, formato e posicionamento.
- **Evidência publicada:** Inspeção com Playwright MCP em 19/10/2026 observou `/img` `404`, `pizzas.png` `200` e o card ainda na cor anterior. A publicação ainda não contém a correção local.
- **Impacto:** O fundo da seção de depoimentos não é carregado; conteúdo textual e demais elementos observados continuam disponíveis. Não foi constatado impacto funcional.
- **Severidade sugerida:** Baixa (P3), sujeita à importância visual desse fundo.
- **Status:** Corrigido e validado localmente pela suíte em 19/10/2026; continua aberto para produção até implantação e confirmação dos critérios no domínio publicado.
- **Pontos não confirmados:** Não foi identificada imagem apropriada para o fundo, então nenhuma foi escolhida. A aparência após implantação ainda precisa de conferência visual.

## Investigação e linha de base local — 14/10/2026

- Os únicos arquivos locais Poppins são `app/fonts/Poppins-Regular.otf` e `app/fonts/Poppins-Medium.otf`; os nomes e capitalização foram conferidos no sistema de arquivos.
- `img/bg-icons-1.png` existe sem referência CSS/documentação que o associe aos depoimentos. `img/bg-icons-2.png` é usado em Serviços e Cardápio. Ambos são padrões decorativos semelhantes; a intenção para Depoimentos não pode ser determinada apenas pelo projeto. A decisão foi não escolher uma imagem arbitrariamente.
- A suíte completa foi executada em `http://127.0.0.1:8765/` após a alteração local: CT-001, CT-002 e CT-005 passaram; CT-003 e CT-004 falharam pelo `/img` 404 conhecido. Nenhum 404 novo foi observado.
- O site publicado não foi alterado após as correções locais.

## Validação local e verificação publicada — 19/10/2026

- **Cenário:** suíte completa Playwright Test, cinco testes, contra o preview estático local em `http://127.0.0.1:8765/` usando `BASE_URL`.
- **Resultado obtido:** 5 passaram (CT-001 a CT-005), 0 falharam. CT-003 confirmou `background-image: none`, nenhuma requisição para `/img`, card com dimensões e cor esperadas, e `pizzas.png` carregada com resposta HTTP sem erro e `naturalWidth > 0`. CT-004 não observou respostas 404.
- **Falha durante a validação:** a primeira execução teve 4 aprovações e uma falha em CT-003 porque o teste exigia que a imagem estivesse visível. A imagem usa classes responsivas e animação de entrada; visibilidade não é necessária para validar carregamento. A assertion foi ajustada para verificar o carregamento real (`naturalWidth`) e a suíte completa passou na repetição.
- **Verificação publicada com Playwright MCP:** a página ainda requisita `/img` (404), e as URLs antigas maiúsculas das duas fontes também respondem 404. `pizzas.png` responde 200. Isso confirma que a correção local ainda não foi implantada; BUG-001, BUG-002 e BUG-003 permanecem pendentes de confirmação em produção.
