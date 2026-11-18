> Registo histórico de 07/09/2026. Para as regras e a planta atuais, este
> registo foi substituído pelo contrato canónico de
> [`MULTI_STOREY_ARCHITECTURE.md`](MULTI_STOREY_ARCHITECTURE.md). Este ficheiro
> conserva a decisão histórica e não declara uma entrega pronta.

# Dois pisos e escadas: decisão implementada

Estado histórico registado em 07/09/2026: a solução descrita neste documento estava implementada no caso de referência `hard-1`. Uma relação lógica entre linhas ou colunas pode associar posições correspondentes entre pisos através das pistas `above`, `below` e `floor` e do bloqueio cruzado em `useGame`. A apresentação torna essa associação simultaneamente visível e não interfere com a interação.

## 1. Recursos

### Furniture Kit, já presente no projeto

O pacote fornece quatro escadas medidas a partir da geometria em `catalog.generated.ts`:

| Modelo | Dimensões l × a × p, em unidades Kenney | Notas |
| --- | --- | --- |
| `stairs` | 1,82 × 1,34 × 0,79 | lanço reto, laterais fechadas |
| `stairsOpen` | 1,82 × 1,34 × 0,79 | lanço reto, degraus abertos |
| `stairsOpenSingle` | 1,82 × 1,34 × 0,79 | lanço aberto, uma longarina |
| `stairsCorner` | 1,77 × 1,34 × 1,43 | patamar com quarto de volta |

Facto principal: **a subida de 1,34 aproxima-se da parede de 1,29**. Um lanço reto sobe um piso. Ocupa 1,82 × 0,79 unidades, ou seja, 2,3 × 1,0 células com `CELL = 0.8`; a escada de canto ocupa 2,2 × 1,8 células. Esta pegada é grande numa grelha de 6 × 6 e adequada à grelha de 8 × 8 do piloto.

O pacote também fornece `floorFull` (1 × 0,05) para a laje superior e os modelos `wall`, `wallHalf`, `wallCorner`, `wallWindow`, `wallDoorway` e `paneling` para o envelope.

### Building Kit e Modular Buildings

Estes pacotes destinam-se a arquitetura exterior. Fornecem paredes, telhados, janelas, portas, escadas e alpendres numa escala própria. Podem vir a fornecer telhados, varandas e escadas exteriores, mas não são necessários para os pisos interiores: a Furniture Kit já cobre escada, laje e envelope.

A medição recuperada mostrou que a Building Kit usa paredes de 2,40 unidades e a Modular Buildings usa módulos de piso com cerca de 0,60. Por isso, ambas exigem um adaptador de envelope e não podem ser misturadas diretamente com a parede interior de 1,29. A decisão completa consta de `docs/KENNEY_PACK_SURVEY.md`.

## 2. Geometria implementada

- A distância entre pisos é `STOREY_HEIGHT = WALL_HEIGHT + FLOOR_THICKNESS`.
- Cada piso possui uma `SceneSpec` própria, com `floor: 0 | 1`, resolvida e validada contra a topologia e o mobiliário lógico desse piso.
- O rés-do-chão declara `stairs`; o piso superior declara um `stairwell` coincidente.
- O resolvedor retira a laje na abertura, coloca a escada à altura física e reserva as respetivas células.
- O validador confirma a correspondência entre a escada e o vão, a subida, os limites, os patamares livres e a inexistência de laje na abertura.

## 3. Apresentação escolhida

| Opção | Resultado | Decisão |
| --- | --- | --- |
| **Casa empilhada** | o piso superior oculta o rés-do-chão | rejeitada |
| **Pisos explodidos** | mostra os dois pisos com distância adicional | implementada como panorama opcional |
| **Piso ativo e contexto fantasma** | preserva a leitura do piso ativo e mostra a estrutura do outro | implementada como vista predefinida |
| **Transição de câmara** | depende da memória do movimento e não mostra a relação simultânea | rejeitada |

Na vista predefinida, o piso ativo mantém opacidade e interação completas. O outro surge à altura real, com arestas de laje e paredes translúcidas, sem diagonais da malha nem mobiliário. A sua escada permanece sólida neste modo, para revelar o lanço através do vão; a laje ativa oculta as partes que ficam sob ela. No panorama explodido, a escada do contexto usa opacidade de 0,48. O contexto fantasma não possui polígonos de interação. O realce de uma célula inclui a posição correspondente no outro piso e os bloqueios de linhas e colunas.

O botão de panorama ativa a vista explodida. A câmara não muda e não existe animação obrigatória, por isso o comportamento respeita a redução de movimento. Os botões de piso trocam os papéis ativo e fantasma.

## 4. Decisões de produto

1. O contexto fantasma mostra apenas a estrutura, a escada e o vão; o mobiliário fantasma foi excluído para reduzir ruído.
2. O panorama explodido existe como modo opcional, incluindo em ecrãs estreitos.
3. A escada continua a ser circulação física, não um tipo de mobiliário ou alvo de pista.
4. `hard-1` é o caso de referência obrigatório para regressão visual, interação entre pisos e validação física.

## 5. Critérios espaciais do passe Astra

A revisão de `hard-1` mantém a solução e as pistas existentes. O lanço junto à fachada norte, centrado na linha 0,6, sobe para este e encontra exatamente a aresta da laje na coluna 5. O vão superior ocupa `[2, 0, 4, 2]`, em coordenadas inclusivas de células; a abertura mais ampla permite ver o lanço descendente. A chegada física integra a galeria de acesso ao escritório. O percurso passa a sul da guarda para chegar ao quarto, à casa de banho e à zona de distribuição e leitura. O nome lógico «Landing» não obriga a deslocar a chegada física para essa divisão, mas o percurso entre ambas tem de ser claro.

As guardas protegem o lado oeste do vão em `x = 1.9` e a frente em `z = 3.05`, sem fechar a chegada a este. A cama apoia-se na parede oeste, na coordenada 2,5; o tapete orientado para este, em `[1.05, 2.7]`, acompanha a cama sem cobrir o vão. O murete de serviço do escritório situa-se em `z = 1.5` e a cadeira em `[6.05, 2.6]`, orientada para a secretária. O pavimento distingue a casa de banho e a zona de leitura dá uma função à distribuição superior. São relações de autoria; não acrescentam regras ao quebra-cabeças. As coordenadas entre acentos graves usam a sintaxe decimal do código.

Antes de aceitar qualquer novo caso de dois pisos:

1. confirma a direção real de subida, a pegada medida e o contacto do último degrau com a aresta da laje;
2. percorre visualmente o acesso ao primeiro degrau, a chegada e todas as portas, sem atravessar móveis ou vazio;
3. verifica os lados protegidos do vão e a abertura de chegada;
4. inspeciona os dois pisos à altura real e no panorama explodido, incluindo um pormenor dos degraus e do patamar;
5. testa a leitura em telemóvel e as exclusões de linhas e colunas entre pisos.

O validador é necessário, mas não prova sozinho continuidade visual, qualidade do percurso ou propósito das divisões. Uma correção de orientação do modelo ou da apresentação do contexto pertence ao sistema e exige uma «SYSTEM ESCALATION» separada; nunca alteres tolerâncias para acomodar um lanço mal colocado. O estado de aprovação deste passe encontra-se em `ASTRA_POLISH_REPORT.md`.

## 6. Limite da correção de visibilidade das escadas

A correção registada como «SYSTEM ESCALATION» limita-se à advertência `cell-hidden`. Um bloco único com a altura total da escada ocultava matematicamente células junto ao pé do lanço, mesmo quando os degraus reais não as tapavam. `stairVisibility.ts` usa onze volumes conservadores, medidos nos três modelos retos `stairs`, `stairsOpen` e `stairsOpenSingle`, para representar a subida na verificação de visibilidade.

Os testes verificam a inclusão de todos os triângulos dos GLB nesses volumes e distinguem raios bloqueados no topo de raios livres junto ao pé nas quatro direções. Colisões, acessibilidade, vão e patamares continuam a usar a caixa de limites completa. O modelo de canto e as orientações não ortogonais conservam essa caixa também na visibilidade. Esta correção não cria tolerâncias de autoria nem autoriza reduzir volumes para aprovar futuras cenas.
