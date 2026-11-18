# Revisão visual residencial V3

Cena: `hard-1`, piso superior, commit `f6c948e`. Capturas de navegador de
12/09/2026; repetição móvel e revisão das referências concluídas em 13/09/2026.
As imagens mostram a aplicação real, sem reconstrução ou retoque. Os pormenores
são recortes da vista isométrica, não uma câmara em primeira pessoa.

## Treze vistas obrigatórias

| Vista | Imagem |
| --- | --- |
| Chegada da escada | [Chegada](v3-arrival-stair.png) |
| Escada e patamar | [Patamar](v3-stair-landing.png) |
| Patamar e corredor | [Corredor](v3-landing-corridor.png) |
| Porta do quarto | [Porta](v3-bedroom-door-final.png) |
| Interior do quarto | [Quarto](v3-bedroom-interior.png) |
| Porta da casa de banho | [Porta](v3-bathroom-door.png) |
| Interior da casa de banho | [Casa de banho](v3-bathroom-interior.png) |
| Escritório | [Escritório](v3-office.png) |
| Sala de leitura | [Leitura](v3-reading.png) |
| Piso superior completo | [Piso](v3-upper-full.png) |
| Contexto do rés-do-chão | [Contexto](v3-context-final.png) |
| Vista explodida | [Pisos separados](v3-exploded-final.png) |
| Piso em ecrã móvel, 390 × 844 | [Telemóvel](v3-mobile-upper-final.png) |

A revisão da chegada responde afirmativamente à pergunta «Se estivesse aqui
numa casa real, o que vejo faria sentido?». A escada chega a um patamar livre;
o corredor prolonga-o até às portas. A parede completa do quarto interrompe
a vista para a cama. A casa de banho fica atrás da sua parede norte e tem
entrada lateral. Os testes geométricos complementam esta leitura, com os
limites de amostragem descritos no [projeto](../../MULTI_STOREY_V3_DESIGN.md).

## Verificação do jogo

No computador foram verificados seleção, colocação, conflito na mesma linha,
conflito entre pisos, desfazer, refazer, mudança de piso, navegação por setas,
localização de pistas e ajuda. A solução terminou com Silas identificado,
em 02:10, com uma ajuda. A repetição a 390 × 844 terminou em 00:35, sem ajudas,
após colocar as cinco pessoas nos dois pisos através dos controlos da página.

- [Seleção no piso superior](v3-game-upper-selection.png).
- [Vitória no computador](v3-desktop-victory.png).
- [Apresentação móvel da primeira vitória](v3-mobile-victory.png).

A última imagem mostra a primeira vitória redimensionada. A segunda vitória
foi confirmada pelo estado visível da página; a captura durante a animação
de entrada foi descartada por estar vazia.

## Cenas de referência

Revisão visual concluída sem regressões observadas. Os respetivos ficheiros
de cena não foram alterados nesta versão.

- [Midnight Delivery](v3-regression-midnight.png).
- [The Empty Chair](v3-regression-empty-chair.png).
- [The Last Nightcap](v3-regression-last-nightcap.png).
