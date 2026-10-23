# Revisão Astra antes da produção

Data: 08/09/2026. Base: `sol/isometric-system-hardening`, commit `2d1ec76`.
Ramo autorizado: `astra/two-storey-and-interaction-polish`.

## SYSTEM ESCALATION — direção física da escada

A geometria medida de `stairsOpen.glb` sobe no eixo +X. O resolvedor atribuía
90° a sul, mas a rotação positiva sobre Y usada pelo Three transforma +X em −Z,
isto é, norte. O validador e a imagem discordavam nos lanços norte/sul.

A correção limita-se à tabela de rotação em `src/scene3d/resolve.ts`: sul usa
270° e norte usa 90°. Não altera a câmara, o esquema, o solucionador, as pistas
ou os validadores. O teste das quatro direções transforma o vetor de subida com
a mesma operação do Three: falhou para norte/sul antes da correção.

Alternativa considerada: restringir a autoria a lanços este/oeste. Rejeitada
porque deixaria um erro real numa capacidade já declarada pelo sistema. A tarefa
Astra autoriza correções fundamentais necessárias e justificadas; esta correção
é isolada num commit próprio, antes da nova composição.

## SYSTEM ESCALATION — volume de visibilidade da escada

O teste de visibilidade tratava todo o lanço como um bloco de 1,34 unidades,
incluindo o pé. Um raio à altura da personagem intersectava essa caixa, mas
passava acima dos primeiros degraus reais. Deslocar a escada para contornar
esse falso positivo impedia o contacto exato entre o último degrau e a laje.

`stairVisibility.ts` usa onze volumes conservadores medidos nos três GLB retos.
Os intervalos incluem a sobreposição real dos degraus e arredondam para fora.
O teste recorta todos os triângulos das malhas por faixa e prova que os volumes
contêm a superfície inteira; confirma ainda pé livre e topo obstruído nas
quatro direções. A escada de canto mantém a caixa completa.

A única aplicação em `validate.ts` é a oclusão de células (`cell-hidden`).
Colisões, circulação, dimensões, vãos, patamares e associação entre pisos
conservam os controlos anteriores. Nenhuma escada é ignorada pelo validador.
Esta correção resolve uma aproximação geométrica incorreta, sem dispensar uma
regra de produção. A revisão independente não encontrou bloqueadores.

## SYSTEM ESCALATION — apresentação do piso acompanhante

As caixas fantasma passam a mostrar arestas arquitetónicas, sem diagonais de
triangulação. A escada acompanhante fica opaca à altura real, com escrita de
profundidade: a laje ativa oculta-a fisicamente e o vão revela o lanço. Na vista
explodida mantém opacidade de 0,48. Câmara, separação entre pisos e interação
não mudam. A alteração limita-se ao tratamento visual em `renderer.ts`.

## Composição e interação

O lanço norte sobe para este e termina na aresta da coluna 5. O vão superior
`[2, 0, 4, 2]` expõe a descida, com guardas a oeste e a sul. A chegada é uma
galeria livre do escritório; a circulação prossegue para o quarto, a casa de
banho e a zona de leitura. O nome lógico «Landing» continua a designar a zona
de distribuição a sudeste, não a célula de chegada da escada.

A cama e a secretária encostam a paredes reais; a cadeira relaciona-se com a
secretária. A casa de banho tem acabamento próprio e o patamar inclui uma
zona de leitura. O tapete do quarto deixou de atravessar o vão. No rés-do-chão,
a entrada tem o seu tapete, a cozinha tem uma frente de serviço e as zonas de
refeições e de estar têm grupos de mobiliário coerentes. Não foram adicionados
recursos nem alterados o caso lógico, as pistas, a solução ou as métricas.

A célula ativa conserva um contorno duplo depois de retirar o ponteiro. As
colocações têm uma pegada explícita; os conflitos combinam cor, tracejado,
símbolo e texto. As pistas pedidas aparecem sobre os objetos, com legenda.
A orientação distingue ocupação local e entre pisos, sem bloquear a mudança
da própria pessoa. O teclado percorre as células por setas e aplica a ferramenta
com Enter ou Espaço. Os anúncios usam a divisão do piso correto.

O seletor de pisos passou a ocupar espaço próprio fora da caixa proporcional
do tabuleiro. Antes, fazia a camada transparente transbordar sobre a barra de
ferramentas; o botão de ajuda recebia um clique no tabuleiro. O controlo no
navegador confirmou a correção e a colocação de Evelyn ao gastar uma ajuda.

## Validação de 08/09/2026

- `npm test`: **376 passaram, 5 ignorados**, em 32 ficheiros.
- `npm run test:coverage`: passou; 91,02% instruções, 84,09% ramos,
  91,17% funções e 95,63% linhas **no âmbito de cobertura configurado**
  (quatro módulos de experiência de utilização; não é cobertura de todo o projeto).
- `npm run validate:production`: cinco verificações passaram; 60 casos,
  cenas escritas à mão, modelos e ligações entre pisos sem erros rígidos.
- `node scripts/measure-puzzles.mjs --check`: relatório dos 60 casos atualizado,
  sem alteração das métricas.
- `npm run lint`, `npm run build` e `git diff --check`: passaram.
- Auditoria de dependências: zero vulnerabilidades comunicadas.
- Revisão independente das correções geométricas, composição e interação:
  sem bloqueadores.

No navegador foram inspecionados Midnight Delivery, The Empty Chair e The Last
Nightcap, além dos dois pisos de The Wrong Coat em contexto fantasma, vista
explodida e diagnóstico. Confirmaram-se a relação escada–vão, a seleção,
conflitos locais e entre pisos, localização de pistas, ajuda, marcação por
teclado, desfazer, refazer, limpeza e resolução completa. A verificação incluiu
1 440 × 1 100 e 390 × 844 píxeis. O navegador não apresentou avisos de cenas;
o aviso de redução de movimento é informativo. As imagens desta revisão têm
prefixo `astra-` em `docs/reference/`.

## Veredicto

**READY — apto como referência isométrica de produção após esta revisão.**
A avaliação visual não substitui a aprovação editorial do proprietário.
O código validado está no commit `0c92790`; o commit final de documentação e
imagens integra este estado. O SHA completo da entrega consta da resposta final.

Não há bloqueadores conhecidos desta revisão. Mantêm-se as advertências
editoriais do catálogo já registadas no relatório anterior. A vista explodida
é um panorama de estrutura: a relação completa do lanço lê-se melhor com o
rés-do-chão ativo; a vista superior à altura real mostra a chegada e a descida.
Uma substituição dos GLB de escadas exige repetir o teste de cobertura da malha.
