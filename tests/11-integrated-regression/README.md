# Suíte 11 — Regressão integrada

Esta suíte é uma composição dos testes determinísticos marcados com `@regression` nas suítes funcionais. Os cenários não são duplicados: a execução padrão do projeto já os inclui junto com os demais arquivos `*.spec.js`.

Para executar somente essa composição contra a cópia local de `app/`, use:

```text
npm test -- --grep @regression
```

`npm test` executa a suíte completa por padrão e inicia um servidor isolado em loopback. Um preview alternativo exige `BASE_URL` explícito; a configuração rejeita o host conhecido de produção. CT-001 a CT-005 permanecem nos arquivos existentes. Os critérios para todos os casos estão em `docs/testes/criterios-padrao-execucao.md`; cada execução salva resultados em uma pasta única de `qa/reports/`.
