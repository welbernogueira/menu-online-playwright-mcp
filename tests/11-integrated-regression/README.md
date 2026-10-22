# Suíte 11 — Regressão integrada

Esta suíte é uma composição dos testes determinísticos marcados com `@regression` nas suítes funcionais. Os cenários não são duplicados: a execução padrão do projeto já os inclui junto com os demais arquivos `*.spec.js`.

Para executar somente essa composição em um ambiente local ou preview isolado, defina `BASE_URL` e use:

```powershell
$env:BASE_URL = 'http://127.0.0.1:PORTA/'
npx playwright test --grep '@regression'
```

Para incluir todos os cenários CT-001 a CT-036, use `npm test` com `BASE_URL` apontando para o ambiente QA/preview. CT-001 a CT-005 permanecem nos arquivos existentes. Cenários com `test.fixme` aparecem no relatório como pendentes até a aprovação dos critérios correspondentes.
