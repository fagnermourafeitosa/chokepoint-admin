# Chokepoint · Developer Workbench (React + TypeScript)

Frontend protótipo navegável. Não há conexão com OpenFGA, IdP, MCP ou APIs externas; os dados são exemplos locais.

## Abrir

- `dist/index.html`, junto com a pasta `dist` completa; ou
- `chokepoint_admin_context_sources.html`: HTML independente com React, CSS e logo embutidos.

## Context Sources

Navegação **Access → Context sources**. É possível:

1. Importar um OpenAPI 3.x **JSON** (`.json` local ou JSON colado) ou carregar o exemplo **Orders API**.
2. Descobrir operações `GET` com resposta JSON tipada e campos escalares, inclusive propriedades aninhadas e `$ref` locais.
3. Selecionar a tool MCP protegida, mapear parâmetros da URL (`{id}`) para argumentos declarados da tool e escolher um campo da resposta.
4. Salvar o mapeamento, que passa a aparecer no editor **Visual/CEL** da tool atribuída.
5. Testar extração em uma resposta **exemplo** JSON (isso não é uma verificação de dados reais).
6. Remover mappings (regras antigas que dependam deles passam a falhar na validação).

O botão **Connect context source** no editor também abre essa tela sem adicionar outra opção ao menu principal.

## Arquitetura e limites

- Os argumentos MCP vêm de **schemas demonstrativos estáticos** neste protótipo, não de uma chamada real `tools/list`.
- A identidade e o agente também são demonstrativos; em produção precisam ser validados antes de fornecer atributos.
- A importação OpenAPI descobre contratos, **não verifica segurança, semântica ou procedência de valores**.
- Mapear campos `GET` NÃO significa que o frontend faz requisições HTTP. O conector PIP de produção deverá controlar autenticação, rede/SSRF, allowlist, timeouts, comportamento fail-closed, versão do schema e vínculo entre operação/autoridade.
- `Test sample` e `Evaluate access` usam valores locais explicitamente rotulados como fixtures, não fatos obtidos por conectores ativos.
- O editor CEL testa apenas um subconjunto local. Em produção, revalidar no OpenFGA/cel-go antes de publicar e na execução, com enforcement PEP.
- Dynamic Conditions OpenFGA continuam experimentais: https://openfga.dev/blog/dynamic-abac-expressions-announcement
- Regras de escopo restritivas aplicadas em AND são **simuladas pelo Chokepoint**; não significam que tuples OpenFGA independentes sejam automaticamente conjuntivas.

## Desenvolvimento

`tsc -p tsconfig.json` recompila `src/app.tsx` para `dist/app.js`. Sem dependências em CDN (React 16 vendorizado).
