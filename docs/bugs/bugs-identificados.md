# Defeitos identificados — Menu On-Line

Registro iniciado com a exploração de QA da página publicada em `https://menu-online-project.vercel.app/`. A linha de base original está preservada abaixo. BUG-001 e BUG-002 receberam correção local validada, mas continuam abertos para o site publicado até implantação; BUG-003 segue aberto sem correção.

## BUG-001 — Poppins Regular responde 404

- **Descrição:** A declaração da fonte Poppins Regular tenta carregar um recurso que falha na página publicada.
- **Pré-condições:** Acesso à página inicial publicada; CSS `css/main.css` carregado; navegador com console e rede observáveis.
- **Passos de reprodução:**
  1. Abrir `https://menu-online-project.vercel.app/`.
  2. Aguardar o carregamento e consultar as requisições de rede e o console.
- **Resultado esperado:** A fonte Poppins Regular é carregada com sucesso, sem resposta 404.
- **Resultado atual:** `GET https://menu-online-project.vercel.app/FONTS/Poppins-Regular.otf` responde `404`; o navegador registra falha da fonte.
- **Evidência da linha de base:** o CSS original referenciava `../FONTS/Poppins-Regular.otf`, enquanto o arquivo local existente é `fonts/Poppins-Regular.otf`; no site publicado a URL maiúscula respondeu 404 e a face ficou em estado `error`.
- **Impacto:** O texto que especifica essa família usa uma fonte substituta; a tipografia pode diferir do design pretendido. Não foi observado impacto funcional na navegação da página.
- **Severidade sugerida:** Baixa (P3), sujeita à confirmação dos critérios visuais do produto.
- **Causa:** Divergência de capitalização confirmada no código local: `FONTS/` versus diretório existente `fonts/`.
- **Status:** Corrigido e validado no código local; permanece aberto no site publicado até implantação e confirmação.
- **Evidência pós-correção:** CT-002 passou contra o servidor local em 14/10/2026; o teste verificou resposta sem erro HTTP e face Poppins Regular carregada.
- **Pontos não confirmados:** A correção ainda não foi implantada nem validada no domínio publicado. A obrigatoriedade visual exata da família não foi definida.

## BUG-002 — Poppins Medium responde 404

- **Descrição:** A declaração da fonte Poppins Medium tenta carregar um recurso que falha na página publicada.
- **Pré-condições:** Acesso à página inicial publicada; CSS `css/main.css` carregado; navegador com console e rede observáveis.
- **Passos de reprodução:**
  1. Abrir `https://menu-online-project.vercel.app/`.
  2. Aguardar o carregamento e consultar as requisições de rede e o console.
- **Resultado esperado:** A fonte Poppins Medium é carregada com sucesso, sem resposta 404.
- **Resultado atual:** `GET https://menu-online-project.vercel.app/FONTS/Poppins-Medium.otf` responde `404`; o navegador registra falha da fonte.
- **Evidência da linha de base:** o CSS original referenciava `../FONTS/Poppins-Medium.otf`, enquanto o arquivo local existente é `fonts/Poppins-Medium.otf`; no site publicado a URL maiúscula respondeu 404 e a face ficou em estado `error`.
- **Impacto:** Textos que especificam essa família, incluindo elementos em negrito configurados no CSS, podem ser renderizados com fonte substituta. Não foi observado impacto funcional na página.
- **Severidade sugerida:** Baixa (P3), sujeita à confirmação dos critérios visuais do produto.
- **Causa:** Divergência de capitalização confirmada no código local: `FONTS/` versus diretório existente `fonts/`.
- **Status:** Corrigido e validado no código local; permanece aberto no site publicado até implantação e confirmação.
- **Evidência pós-correção:** CT-002 passou contra o servidor local em 14/10/2026; o teste verificou resposta sem erro HTTP e face Poppins Medium carregada.
- **Pontos não confirmados:** A correção ainda não foi implantada nem validada no domínio publicado. A obrigatoriedade visual exata da família não foi definida.

## BUG-003 — Imagem de fundo dos depoimentos responde 404

- **Descrição:** O CSS aponta a imagem de fundo da seção de depoimentos para um caminho sem nome de arquivo.
- **Pré-condições:** Acesso à página inicial publicada; CSS `css/main.css` carregado; navegador com rede e estilos computados observáveis.
- **Passos de reprodução:**
  1. Abrir `https://menu-online-project.vercel.app/`.
  2. Aguardar o carregamento e consultar a requisição de imagem com referenciador `css/main.css`.
  3. Inspecionar a regra `.background-depoimentos`.
- **Resultado esperado:** O fundo dos depoimentos carrega a imagem definida para a seção, sem resposta 404.
- **Resultado atual:** `GET https://menu-online-project.vercel.app/img` responde `404` (`type: image`). O estilo computado da seção aponta para essa URL.
- **Evidências:** `css/main.css`, regra `.background-depoimentos` na linha 346, contém `background-image: url(../img)`. O diretório local `img/` existe, mas a URL não especifica um arquivo. A resposta observada no site é 404.
- **Impacto:** O fundo da seção de depoimentos não é carregado; conteúdo textual e demais elementos observados continuam disponíveis. Não foi constatado impacto funcional.
- **Severidade sugerida:** Baixa (P3), sujeita à importância visual desse fundo.
- **Causa provável:** Referência CSS incompleta, sem nome de arquivo de imagem.
- **Status:** Aberto — correção não aplicada.
- **Pontos não confirmados:** Não foi identificado qual imagem existente ou pretendida deveria ser usada. Não se confirmou se a ausência do fundo é intencional ou bloqueia algum critério visual.

## Investigação e execução pós-correção local — 14/10/2026

- Os únicos arquivos locais Poppins são `fonts/Poppins-Regular.otf` e `fonts/Poppins-Medium.otf`; os nomes e capitalização foram conferidos no sistema de arquivos.
- `img/bg-icons-1.png` existe sem referência CSS/documentação que o associe aos depoimentos. `img/bg-icons-2.png` é usado em Serviços e Cardápio. Ambos são padrões decorativos semelhantes; a intenção para Depoimentos não pode ser determinada apenas pelo projeto. BUG-003 permanece sem correção.
- A suíte completa foi executada em `http://127.0.0.1:8765/` após a alteração local: CT-001, CT-002 e CT-005 passaram; CT-003 e CT-004 falharam pelo `/img` 404 conhecido. Nenhum 404 novo foi observado.
- O site publicado não foi alterado nem validado novamente após a correção local. BUG-001 e BUG-002 continuam em aberto para a versão publicada até sua implantação e confirmação.
