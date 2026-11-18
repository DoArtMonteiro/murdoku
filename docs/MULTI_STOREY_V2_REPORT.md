# Relatório de arquitetura de dois pisos

Data: 11/09/2026. Ramo: `astra/multistorey-architecture-v2`.
Base preservada: `5e03c58ed7ee7c31bc74772254f035f551721b66`.
Estado: READY para autoria de novas casas de dois pisos dentro do contrato atual.

## Resultado arquitetónico

A composição anterior fazia a escada chegar junto à secretária. O vão definido
por células inteiras retirava nove células, sem estabelecer um átrio independente.
A planta atual separa a chegada do estudo: escada para este, patamar norte,
corredor este e átrio transversal que serve quarto, estudo, casa de banho e leitura.

O rés-do-chão conserva a arquitetura, os móveis e a escada. Ambos os pisos
declaram a pegada construída completa de 8 × 8. Isto é correto neste caso:
«Conservatory» é interior, não jardim. O piso superior retira apenas o vão
físico `[2.65, 0, 5, 2.6]`. A cabeça do lanço encontra a aresta x=5; a chegada
tem espaço livre para continuar para este antes de virar para sul.

O quarto tem cama, cabeceira e iluminação; o estudo tem secretária, portátil
apoiado e cadeira; a casa de banho reúne banheira, lavatório e sanita; a leitura
liga assento, tapete, estante e planta. Os móveis não ocupam o vão nem as
aproximações às portas. As guardas abertas protegem as margens do vão. As
alturas reduzidas das divisórias e guardas pertencem ao recorte da miniatura.

## Alterações reutilizáveis do sistema

As decisões «SYSTEM ESCALATION» estão justificadas no
[contrato canónico](MULTI_STOREY_ARCHITECTURE.md):

- `storeyFootprint`: área física presente, independente do quadrado lógico.
- `stairwellBounds`: abertura contínua e fracionária, independente das células.
- `circulation`: patamar, corredores e aproximações às divisões.
- `treatment: 'railing'`: geometria aberta com barreira física contínua.
- Laje ativa, realces e contexto acompanhante consomem a mesma geometria.
- Enquadramento de dois pisos a 42°, com projeção, câmara e verificação de
  visibilidade partilhadas. As cenas de um piso conservam 32°.
- No contexto fantasma, o vão mostra apenas os fragmentos reais das paredes
  inferiores que o atravessam. Na vista explodida, o perfil da escada e guias
  interrompidas relacionam as duas cotas de chegada. A escada não é alongada.

Não há indicadores específicos de The Wrong Coat no renderizador. Não foram
alterados dados dos casos, pistas, soluções, solucionador ou gerador.

## Regras verificadas por máquina

O controlo de produção exige pegadas explícitas e circulação no piso superior.
Os validadores verificam apoio construído inferior, coincidência do lanço e
vão, chegada livre, continuidade do pavimento, ligações e larguras úteis mínimas
de 0,6 unidades do mundo, colisões, apoio de objetos e acesso às divisões.
Uma guarda continua intransponível apesar dos intervalos visuais.

Jardim, pátio e terreno ausente não sustentam piso interior superior. As
fachadas são obrigatórias nas fronteiras entre interior e exterior, incluindo
recuos onde deixa de existir laje. Janelas precisam de um troço real de parede.
A configuração `tests/fixtures/multistoreyGarden.ts` demonstra uma casa com
jardim lateral e piso superior limitado à parte construída. Não é um novo caso.

Proporções, privacidade, orientação dos móveis, conforto e leitura do vão
continuam sujeitos a revisão arquitetónica e imagens do navegador. Nenhum
teste mede a qualidade residencial de uma composição.

## Verificação técnica

| Verificação | Resultado |
| --- | --- |
| `npm test` | 37 ficheiros; 423 aprovados, 5 ignorados, 428 no total |
| `npm run validate:production` | 6 testes aprovados; catálogo de 60 casos |
| Catálogo `--check` | Atualizado; 20 avisos editoriais existentes, sem alteração |
| TypeScript, lint e compilação | Aprovados |
| Modelos locais | 161 ficheiros GLB; nenhum modelo catalogado em falta |
| `git diff --check` | Sem erros |
| Auditoria npm | 3 avisos moderados de desenvolvimento; 0 altos e 0 críticos; auditoria de produção sem vulnerabilidades |

A cobertura configurada abrange apenas `ux.ts`, `useCaseNotes.ts`,
`CaseNotes.tsx` e `HomeScreen.tsx`: instruções 91,02%, ramos 84,09%, funções
91,17% e linhas 95,63%. Não é cobertura de todo o projeto nem do motor 3D.
Os cinco testes ignorados permanecem identificados como tal.

Os avisos de cena emitidos por dados artificiais nos testes de componentes
não são resultados do controlo dos cinco pisos de referência; esse controlo
passa sem erros físicos. As dependências não foram alteradas.

## Provas visuais e interação

As imagens estão em [reference/multistorey-v2](reference/multistorey-v2/README.md).
Foram inspecionados os dois pisos em 1 440 × 1 100 e 390 × 844, contexto
fantasma, vista explodida, escada, patamar, guardas, corredor, portas e grupos
de mobiliário. O caso técnico de jardim foi renderizado em 1 440 × 900.

Midnight Delivery, The Empty Chair e The Last Nightcap foram novamente abertos
no Chromium. Mantêm composição, contacto com o chão, janelas e separação exterior.

Os ensaios no Chromium, nos dois tamanhos de janela, verificaram seleção,
colocação, conflito local e entre
pisos, localização de pista, ajuda, teclado, desfazer/refazer e «CASE CLOSED».
A conclusão passou pela interface de jogo; não foi injetado um estado de vitória.
A seleção superior foi ainda repetida pelo orquestrador: Jonas em linha 4,
coluna 7, com confirmação de ocupação na interface e captura do contorno ativo.
Não ocorreram pedidos falhados, respostas HTTP 4xx/5xx ou erros de página nas
recargas limpas de ambos os tamanhos. Não foi usado um dispositivo físico.

## Limites do âmbito

Não há terceiro piso, balanços, varandas ou geração automática de casas.
As futuras cenas precisam de autoria explícita e revisão visual. O contexto
fantasma é a vista principal de jogo; a vista explodida usa anotações para
mostrar relações que a laje ativa pode ocultar. Os três avisos moderados nas
ferramentas Vitest permanecem registados; não afetam dependências de produção.

Detective/Assist e a ferramenta Mark não foram reensaiados manualmente nesta
passagem de navegador. A suite completa mantém os testes desses comportamentos.

O contrato canónico é leitura obrigatória no manual de produção. Não houve
alteração de `main`, fusão, rebase, reescrita de histórico ou publicação do jogo.

## Decisão de referência

READY: um novo autor dispõe de pegada, apoio, vão, chegada, circulação, guardas,
envelope e projeção partilhados. Não precisa de inventar exceções específicas
de cada caso para construir dois pisos que pertençam à mesma casa. A aprovação
aplica-se a esse âmbito e mantém obrigatória a revisão visual de cada cena nova.
