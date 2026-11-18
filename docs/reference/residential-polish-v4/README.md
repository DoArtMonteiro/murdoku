# Referência visual residencial V4

Capturas de referência do resultado V3, recolhidas em 19/09/2026 antes das
alterações de polimento arquitetónico, a partir do SHA V3
`1e78316f024c60bac98239ed0104c1f44b4d43bf`. As capturas posteriores foram
repetidas em 20/09/2026, no ramo `astra/residential-architectural-polish-v4`,
sobre `c21adf7` com a correção das portas ainda por guardar num commit.
A geometria estava congelada, incluindo a transmissão de `cut.head` ao
resolvedor do aro. As imagens foram capturadas no
Chromium real através do endereço `http://127.0.0.1:5173/?env=1&case=hard-1`,
com janela de conteúdo de 1440 × 1100 e DPR 1.

## Enquadramento

Na cena residencial V3, o *canvas* ocupa `x=161`, `y=345`, `697,984 × 629,984`
px. Os recortes abaixo usam coordenadas relativas ao *canvas*, para que as
capturas AFTER mantenham exatamente o mesmo enquadramento:

| Zona | Recorte relativo ao *canvas* |
| --- | --- |
| Porta do quarto | `x=185`, `y=110`, `160 × 165` px |
| Porta da casa de banho | `x=0`, `y=180`, `260 × 250` px |
| Escritório/estudo | `x=410`, `y=125`, `285 × 255` px |
| Porta da leitura | `x=300`, `y=260`, `240 × 220` px |
| Escada e patamar | `x=300`, `y=180`, `300 × 250` px |

As capturas AFTER foram recolhidas no mesmo endereço, viewport e coordenadas,
depois das alterações de geometria das portas feitas a seguir ao commit
`c21adf7`. A captura final inclui a passagem de `cut.head` para o cálculo da
guarnição. Na altura da captura, as alterações ainda estavam na árvore de
trabalho e incluíam `src/scene3d/doorGeometry.ts`, `resolve.ts`, `renderer.ts`,
`schema.ts` e `tests/doorGeometry.test.ts`.

## Baseline V3

| Vista | Imagem |
| --- | --- |
| Piso superior completo, página | [Página](v3-before-upper-page-1440x1100.png) |
| Piso superior, apenas *canvas* | [Piso superior](v3-before-upper-canvas.png) |
| Porta do quarto | [Quarto](v3-before-bedroom-door.png) |
| Porta da casa de banho | [Casa de banho](v3-before-bathroom-door.png) |
| Escritório/estudo | [Escritório](v3-before-office.png) |
| Escada e patamar | [Patamar](v3-before-stair-landing.png) |
| Rés-do-chão com contexto superior fantasma, página | [Página fantasma](v3-before-ground-upper-ghost-page-1440x1100.png) |
| Rés-do-chão com contexto superior fantasma, *canvas* | [Canvas fantasma](v3-before-ground-upper-ghost-canvas.png) |

## Portas após a correção

As quatro entradas superiores ficam cobertas pelas mesmas guarnições
procedurais: quarto, casa de banho, escritório/estudo e leitura. A imagem da
leitura usa o recorte adicional `x=300`, `y=260`, `240 × 220` px.

| Vista | Imagem |
| --- | --- |
| Piso superior completo, página | [Página](v4-after-upper-page-1440x1100.png) |
| Piso superior, apenas *canvas* | [Piso superior](v4-after-upper-canvas.png) |
| Porta do quarto | [Quarto](v4-after-bedroom-door.png) |
| Porta da casa de banho | [Casa de banho](v4-after-bathroom-door.png) |
| Porta do escritório/estudo | [Escritório](v4-after-office-door.png) |
| Porta da leitura | [Leitura](v4-after-reading-door.png) |
| Escada e patamar | [Patamar](v4-after-stair-landing.png) |
| Rés-do-chão com contexto superior fantasma, página | [Página fantasma](v4-after-ground-upper-ghost-page-1440x1100.png) |
| Rés-do-chão com contexto superior fantasma, *canvas* | [Canvas fantasma](v4-after-ground-upper-ghost-canvas.png) |

As três cenas douradas foram repetidas depois da alteração partilhada das
portas. Os casos continuam a ser cenas de um só piso.

| Caso | Imagem |
| --- | --- |
| `very-easy-1` | [AFTER](v4-after-golden-very-easy-1.png) |
| `very-easy-2` | [AFTER](v4-after-golden-very-easy-2.png) |
| `easy-1` | [AFTER](v4-after-golden-easy-1.png) |

## Cenas douradas V3

Estas três capturas preservam os *canvas* das cenas de regressão indicadas. Os
casos `very-easy-1`, `very-easy-2` e `easy-1` são cenas de um só piso e, por
isso, não têm o controlo «Upstairs».

| Caso | Imagem |
| --- | --- |
| `very-easy-1` | [Referência](v3-before-golden-very-easy-1.png) |
| `very-easy-2` | [Referência](v3-before-golden-very-easy-2.png) |
| `easy-1` | [Referência](v3-before-golden-easy-1.png) |

## Variantes temporárias de altura

Estas imagens são comparações de trabalho, capturadas a 20/09/2026 com o
mesmo viewport, o mesmo *canvas* e os recortes do escritório e da leitura. A
consulta `rp` altera apenas as duas paredes semânticas `office-west` e
`reading-west`; as restantes categorias mantêm as suas alturas.

| Variante | Piso superior | Escritório | Leitura |
| --- | --- | --- | --- |
| `rp=0.66` | [Canvas](v4-height-a-066-upper-canvas.png) | [Recorte](v4-height-a-066-office.png) | [Recorte](v4-height-a-066-reading.png) |
| `rp=0.69` | [Canvas](v4-height-b-069-upper-canvas.png) | [Recorte](v4-height-b-069-office.png) | [Recorte](v4-height-b-069-reading.png) |
| `rp=0.8` | [Canvas](v4-height-c-080-upper-canvas.png) | [Recorte](v4-height-c-080-office.png) | [Recorte](v4-height-c-080-reading.png) |

## Provas finais V4

As capturas finais foram recolhidas em 21/09/2026 no ramo
`astra/residential-architectural-polish-v4`, a partir do SHA
`7675d24ccb7ac09be7ffcafc34fda4836a51e5ea`. Foram produzidas no Chromium real
através de *dev-browser*, com DPR 1. As vistas de ambiente usam a consulta
`?env=1&case=hard-1`, a janela de 1 440 × 1 100 e o *canvas* nativo. A vista
móvel usa 390 × 844.

### Ambiente e pisos

| Vista | Imagem |
| --- | --- |
| Piso superior ativo, fantasma do rés-do-chão, página | [Página](v4-final-upper-lower-ghost-page-1440x1100.png) |
| Piso superior ativo, fantasma do rés-do-chão, *canvas* | [Canvas](v4-final-upper-lower-ghost-canvas.png) |
| Rés-do-chão ativo, fantasma do piso superior, página | [Página](v4-final-ground-upper-ghost-page-1440x1100.png) |
| Rés-do-chão ativo, fantasma do piso superior, *canvas* | [Canvas](v4-final-ground-upper-ghost-canvas.png) |
| Vista explodida, página | [Página](v4-final-exploded-page-1440x1100.png) |
| Vista explodida, *canvas* | [Canvas](v4-final-exploded-canvas.png) |
| Piso superior no telemóvel | [390 × 844](v4-final-mobile-upper-390x844.png) |

### Portas, divisões e percurso

Os cinco primeiros recortes mantêm as coordenadas relativas ao *canvas* usadas
nas comparações anteriores. Os quatro recortes de corredor alargam o campo de
visão para documentar a continuidade entre cada divisão, o patamar e a zona de
leitura.

| Zona | Imagem |
| --- | --- |
| Porta do quarto | [Recorte](v4-final-bedroom-door.png) |
| Porta da casa de banho | [Recorte](v4-final-bathroom-door.png) |
| Porta do escritório/estudo | [Recorte](v4-final-office-door.png) |
| Porta da leitura | [Recorte](v4-final-reading-door.png) |
| Escada e patamar | [Recorte](v4-final-stair-landing.png) |
| Quarto e corredor | [Recorte](v4-final-bedroom-corridor.png) |
| Casa de banho e corredor | [Recorte](v4-final-bathroom-corridor.png) |
| Escritório e corredor | [Recorte](v4-final-office-corridor.png) |
| Grupo da leitura | [Recorte](v4-final-reading-group.png) |

### Estados de jogo

Capturas de página a 1 440 × 1 100, com os elementos DOM sobre o tabuleiro,
através de `?case=hard-1`. A seleção usa o foco real da célula. Jonas foi
colocado na linha 4, coluna 7, do piso superior; Clara foi depois colocada
na linha 4, coluna 8, para produzir um conflito real de linha. As duas
colocações foram desfeitas no fim, com confirmação de 0/5 pessoas colocadas.

| Estado | Imagem |
| --- | --- |
| Inicial, sem pessoas colocadas | [Inicial](v4-final-game-idle.png) |
| Célula selecionada, ainda livre | [Seleção](v4-final-game-selected.png) |
| Célula ocupada por Jonas | [Ocupação](v4-final-game-occupied.png) |
| Jonas e Clara em conflito | [Conflito](v4-final-game-conflict.png) |

### Correspondência com as 24 provas pedidas

| N.º | Prova | Imagem |
| --- | --- | --- |
| 1 | Porta do quarto antes | [V3](v3-before-bedroom-door.png) |
| 2 | Porta do quarto depois | [V4](v4-final-bedroom-door.png) |
| 3 | Porta da casa de banho antes | [V3](v3-before-bathroom-door.png) |
| 4 | Porta da casa de banho depois | [V4](v4-final-bathroom-door.png) |
| 5 | Porta do escritório | [V4](v4-final-office-door.png) |
| 6 | Porta no eixo oposto, Z | [Casa de banho](v4-final-bathroom-door.png) |
| 7 | Piso superior antes | [V3](v3-before-upper-canvas.png) |
| 8 | Piso superior depois | [V4](v4-final-upper-canvas.png) |
| 9 | Quarto e corredor | [V4](v4-final-bedroom-corridor.png) |
| 10 | Casa de banho e corredor | [V4](v4-final-bathroom-corridor.png) |
| 11 | Escritório e corredor | [V4](v4-final-office-corridor.png) |
| 12 | Patamar e guarda | [V4](v4-final-stair-landing.png) |
| 13 | Vista limpa do piso superior | [V4](v4-final-upper-canvas.png) |
| 14 | Rés-do-chão ativo e piso superior fantasma | [V4](v4-final-ground-upper-ghost-canvas.png) |
| 15 | Piso superior ativo e rés-do-chão fantasma | [V4](v4-final-upper-lower-ghost-canvas.png) |
| 16 | Vista explodida | [V4](v4-final-exploded-canvas.png) |
| 17 | Estado inicial | [V4](v4-final-game-idle.png) |
| 18 | Seleção | [V4](v4-final-game-selected.png) |
| 19 | Ocupação | [V4](v4-final-game-occupied.png) |
| 20 | Conflito | [V4](v4-final-game-conflict.png) |
| 21 | Móvel, 390 × 844 | [V4](v4-final-mobile-upper-390x844.png) |
| 22 | Midnight Delivery | [Após a correção partilhada](v4-after-golden-very-easy-1.png) |
| 23 | The Empty Chair | [Após a correção partilhada](v4-after-golden-very-easy-2.png) |
| 24 | The Last Nightcap | [Após a correção partilhada](v4-after-golden-easy-1.png) |

As provas 4/6 e 8/13 partilham imagens: a primeira já mostra o eixo Z;
a segunda é a vista limpa completa. As três cenas de regressão foram
inspecionadas após a correção partilhada das portas. A nova classe de altura
não é usada nessas cenas e os testes preservam o seu comportamento anterior.
