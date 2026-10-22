# Menu On-Line — QA

Este repositório reúne uma cópia local da aplicação para inspeção e os testes Playwright. A aplicação oficial é mantida em outro repositório.

## Estrutura

- `app/`: HTML, estilos, scripts, fontes e imagens da cópia local da aplicação.
- `tests/`: testes Playwright organizados por tipo.
- `docs/`: auditoria funcional, cobertura e histórico de bugs.
- `qa/AGENTS.md`: instruções de trabalho de QA.
- `qa/standards/`: regras para cenários e evidências.
- `qa/templates/`: modelos reutilizáveis.
- `qa/reports/archive/`: relatórios e resultados históricos preservados localmente.
- `qa/reports/latest/`: saída local da execução Playwright mais recente.
- `package.json` e `playwright.config.js`: dependências, comandos e configuração dos testes.

Os arquivos de `qa/reports/` são artefatos locais e ficam fora do controle de versão.

## Comandos

- `npm.cmd test`: executa os testes. Sem `BASE_URL`, o destino padrão é o site publicado.
- `npm.cmd run test:report`: abre o relatório da execução mais recente.

Para executar contra a cópia local, abra um terminal e sirva `app/`:

```powershell
python -m http.server 8765 --directory app
```

Em outro terminal, na raiz do repositório:

```powershell
$env:BASE_URL = 'http://127.0.0.1:8765/'
npm.cmd test
```
