# Murdoku

O Murdoku é um jogo de dedução policial inspirado na obra de Manuel Garand. O jogador lê as pistas, coloca cada pessoa numa casa isométrica e identifica quem ficou a sós com a vítima. É uma aplicação web progressiva instalável e funciona sem ligação à rede depois da primeira visita.

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # versão de produção em dist/
npm run preview  # pré-visualização da versão de produção
```

A demonstração pública usa o nome **Alibi**: [jogar](https://murdoku-seven.vercel.app).

## Como funciona

- A casa divide-se em células e divisões, com mobiliário a que as pistas podem fazer referência.
- Cada pessoa ocupa uma linha e uma coluna exclusivas, mesmo quando o caso possui dois pisos.
- Todas as pistas são literalmente verdadeiras e o conjunto admite uma única solução.
- O assassino é o suspeito que partilha a divisão da vítima.

## Funcionalidades

- 60 casos determinísticos distribuídos por seis níveis, de Muito fácil a Mestre.
- 60 casos com cenas 3D escritas à mão, incluindo 30 casos de dois pisos. Não há cenas procedimentais no catálogo.
- Vista isométrica com paredes e aberturas físicas, sombras, mobiliário Kenney medido e associação entre objetos lógicos e visuais.
- Piso ativo com contexto fantasma não interativo e panorama explodido opcional nos casos de dois pisos.
- Colocar, marcar com X, desfazer, limpar, pedir ajuda e acusar, com avisos de conflito entre linhas e colunas.
- Temas claro e escuro, progresso retomável, notas privadas por caso e página de notas de lançamento.
- Aplicação web progressiva instalável, com tipos de letra e retratos disponíveis sem ligação à rede.

## Arquitetura

```text
src/core/       modelo, motor de pistas, solucionador, gerador e catálogo
src/data/       casos escritos à mão
src/scene3d/    esquema, catálogo físico, resolvedor, validação e renderizador
src/hooks/      estado do jogo e tema
src/components/ ecrãs React, interação e tabuleiro isométrico
src/styles/     variáveis semânticas e estilos
tests/          testes unitários, de integração e de pré-validação
docs/           decisões, manuais, relatórios e referências visuais
```

O catálogo usa sementes e identificadores estáveis para preservar o progresso entre sessões. O solucionador verifica que cada conjunto de pistas admite uma única solução.

O motor em `src/core` não depende do React. A camada visual consome o mesmo contrato lógico e valida separadamente a arquitetura da cena.

## Produção e validação

Antes de criar ou modificar um caso ou uma cena 3D, lê `docs/OPUS_PRODUCTION_MANUAL.md`. Os documentos principais são:

- `docs/PUZZLE_AUTHORING.md`, para dificuldade e autoria de pistas;
- `docs/ISOMETRIC_SCENE_SYSTEM.md`, para arquitetura e composição;
- `docs/KENNEY_PACK_SURVEY.md`, para seleção de recursos;
- `docs/KENNEY_ENVIRONMENT_EXPANSION.md`, para o roteiro de ambientes.
- [Auditoria visual final](docs/FINAL_VISUAL_AUDIT.md), com cobertura dos 60 casos, correções e resultados de validação.

Controlos rápidos:

```bash
npm run validate:production
node scripts/measure-puzzles.mjs --check
```

Controlo integral:

```bash
npm test
npm run validate:production
npm run verify
node scripts/measure-puzzles.mjs --check
npm run lint
npm run build
npm run report:puzzles
```

## Temas

Os temas usam propriedades personalizadas semânticas em `src/styles/theme.css`. O tema escuro é o predefinido, respeita a preferência do sistema e não depende de JavaScript. Para adicionar um tema, cria um bloco `:root.theme-<nome>` e acrescenta a entrada correspondente em `THEMES`, em `src/hooks/useTheme.ts`.
