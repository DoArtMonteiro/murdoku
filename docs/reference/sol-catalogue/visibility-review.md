# Revisão das linhas de visão do lote final

Data de verificação: 04/10/2026.

Foram revistos os 20 casos indicados para este ciclo, no Microsoft Edge, com vistas de rés-do-chão, piso superior, fantasma e explodida. Cada caso foi jogado até à acusação correta. Os avisos são diagnósticos geométricos de linha de visão a partir da posição de uma figura em pé; não alteram a grelha lógica nem a camada de seleção.

A validação encontrou 470 avisos ao longo das três vistas e 178 combinações únicas de caso, piso, célula e bloqueador. Todos os avisos pertencem à categoria `cell-hidden`. A tabela abaixo conserva a célula e o identificador exato do bloqueador, indicando as vistas em que ocorre. A lista completa das vistas fantasma/explodida também está fixada no teste `tests/fixtures/reviewedCatalogueSightlines.ts`; alterações futuras reprovam a comparação exata.

Nos casos em que os avisos se cruzam com posições solucionadas, a sobreposição da grelha foi verificada no tabuleiro jogado e os marcadores continuaram visíveis e selecionáveis: expert-1 (Lena, 3, 5; planta central), expert-5 (Priya, 5, 5; pilar estrutural), master-4 (Viraj, 4, 7; pilar estrutural), master-7 (Nadia, 3, 6 e Bella, 6, 2; pilares estruturais). As capturas do tabuleiro e das posições estão ligadas abaixo.

Os restantes bloqueios são escadas, pilares necessários às baias exteriores, paredes de casas de banho, duches e mobiliário localizado. As vistas completas confirmam que os espaços continuam legíveis e que a interface conserva a interação da grelha. Não se desligou nem se ocultou nenhum diagnóstico.

## Resumo por caso

| Caso | Avisos únicos por piso e vista |
|---|---|
| hard-11 | F0: normal 1, fantasma 0, explodida 0; 1 ocorrência única<br>F1: normal 1, fantasma 0, explodida 0; 1 ocorrência única |
| hard-12 | F0: normal 9, fantasma 8, explodida 8; 9 ocorrências únicas<br>F1: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas |
| expert-1 | F0: normal 8, fantasma 8, explodida 8; 8 ocorrências únicas<br>F1: normal 8, fantasma 7, explodida 7; 8 ocorrências únicas |
| expert-2 | F0: normal 7, fantasma 7, explodida 7; 7 ocorrências únicas<br>F1: normal 1, fantasma 0, explodida 0; 1 ocorrência única |
| expert-3 | F0: normal 6, fantasma 5, explodida 5; 6 ocorrências únicas<br>F1: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas |
| expert-4 | F0: normal 3, fantasma 2, explodida 2; 3 ocorrências únicas<br>F1: normal 4, fantasma 2, explodida 2; 4 ocorrências únicas |
| expert-5 | F0: normal 7, fantasma 8, explodida 8; 8 ocorrências únicas<br>F1: normal 2, fantasma 0, explodida 0; 2 ocorrências únicas |
| expert-6 | F0: normal 9, fantasma 10, explodida 10; 11 ocorrência única<br>F1: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas |
| expert-7 | F0: normal 3, fantasma 3, explodida 3; 3 ocorrências únicas<br>F1: normal 1, fantasma 0, explodida 0; 1 ocorrência única |
| expert-8 | F0: normal 3, fantasma 3, explodida 3; 3 ocorrências únicas<br>F1: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas |
| expert-9 | F0: normal 11, fantasma 11, explodida 11; 11 ocorrência única<br>F1: normal 1, fantasma 0, explodida 0; 1 ocorrência única |
| expert-10 | F0: normal 13, fantasma 13, explodida 13; 13 ocorrências únicas<br>F1: normal 2, fantasma 0, explodida 0; 2 ocorrências únicas |
| master-1 | F0: normal 8, fantasma 7, explodida 7; 8 ocorrências únicas<br>F1: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas |
| master-2 | F0: normal 11, fantasma 10, explodida 10; 11 ocorrência única<br>F1: normal 3, fantasma 1, explodida 1; 3 ocorrências únicas |
| master-3 | F0: normal 6, fantasma 6, explodida 6; 7 ocorrências únicas<br>F1: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas |
| master-4 | F0: normal 11, fantasma 10, explodida 10; 12 ocorrências únicas<br>F1: normal 2, fantasma 1, explodida 1; 2 ocorrências únicas |
| master-5 | F0: normal 6, fantasma 6, explodida 6; 6 ocorrências únicas<br>F1: normal 1, fantasma 0, explodida 0; 1 ocorrência única |
| master-6 | F0: normal 0, fantasma 0, explodida 0; 0 ocorrências únicas<br>F1: normal 2, fantasma 1, explodida 1; 2 ocorrências únicas |
| master-7 | F0: normal 14, fantasma 14, explodida 14; 15 ocorrências únicas<br>F1: normal 1, fantasma 0, explodida 0; 1 ocorrência única |
| master-8 | F0: normal 5, fantasma 5, explodida 5; 5 ocorrências únicas<br>F1: normal 2, fantasma 1, explodida 1; 2 ocorrências únicas |

## Avisos identificados

| Caso | Piso | Célula | Bloqueador(es) | Vistas | Posição solucionada |
|---|---|---|---|---|---|
| hard-11 | Rés-do-chão | (4, 3) | `object:stairs` | normal | nenhuma |
| hard-11 | Piso superior | (0, 6) | `object:bathroom-shower` | normal | nenhuma |
| hard-12 | Rés-do-chão | (0, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (0, 6) | `object:stairs` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (1, 5) | `object:stairs` | normal | nenhuma |
| hard-12 | Rés-do-chão | (5, 2) | `support:column:3,6` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (5, 5) | `support:column:6,6` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (5, 7) | `support:column:8,6` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (7, 2) | `support:column:3,8` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (7, 5) | `support:column:6,8` | normal, ghost, exploded | nenhuma |
| hard-12 | Rés-do-chão | (7, 7) | `support:column:8,8` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (1, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (2, 3) | `support:column:4,3` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (2, 5) | `object:stairs, support:column:6,3` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (3, 5) | `object:spine-plant-centre-east` | normal, ghost, exploded | Lena |
| expert-1 | Rés-do-chão | (5, 3) | `support:column:4,6` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (5, 5) | `support:column:6,6` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| expert-1 | Rés-do-chão | (7, 5) | `support:column:6,8` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (4, 0) | `wall:bathroom-north` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (4, 1) | `wall:bathroom-north` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (4, 3) | `wall:bathroom-north` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (4, 4) | `wall:bathroom-east, wall:bathroom-north` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (5, 4) | `wall:bathroom-east` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (6, 1) | `object:bathroom-shower` | normal | nenhuma |
| expert-1 | Piso superior | (6, 4) | `wall:bathroom-east` | normal, ghost, exploded | nenhuma |
| expert-1 | Piso superior | (7, 4) | `wall:bathroom-east` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (2, 1) | `support:column:2,3` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (2, 4) | `support:column:5,3` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (5, 1) | `support:column:2,6` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (5, 4) | `support:column:5,6` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (5, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (7, 1) | `support:column:2,8` | normal, ghost, exploded | nenhuma |
| expert-2 | Rés-do-chão | (7, 4) | `support:column:5,8` | normal, ghost, exploded | nenhuma |
| expert-2 | Piso superior | (1, 6) | `object:bathroom-shower-south` | normal | nenhuma |
| expert-3 | Rés-do-chão | (2, 5) | `object:stairs` | normal | nenhuma |
| expert-3 | Rés-do-chão | (3, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-3 | Rés-do-chão | (4, 1) | `support:column:2,5` | normal, ghost, exploded | nenhuma |
| expert-3 | Rés-do-chão | (4, 3) | `support:column:4,5` | normal, ghost, exploded | nenhuma |
| expert-3 | Rés-do-chão | (7, 1) | `support:column:2,8` | normal, ghost, exploded | nenhuma |
| expert-3 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| expert-4 | Rés-do-chão | (2, 2) | `support:column:3,3` | normal, ghost, exploded | nenhuma |
| expert-4 | Rés-do-chão | (4, 2) | `support:column:3,5` | normal, ghost, exploded | nenhuma |
| expert-4 | Rés-do-chão | (5, 2) | `object:stairs` | normal | nenhuma |
| expert-4 | Piso superior | (2, 4) | `object:bathroom-shower-north` | normal | nenhuma |
| expert-4 | Piso superior | (2, 6) | `object:study-chair` | normal, ghost, exploded | nenhuma |
| expert-4 | Piso superior | (5, 4) | `object:bathroom-shower-south` | normal | nenhuma |
| expert-4 | Piso superior | (6, 4) | `object:bathroom-shower-south` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (2, 2) | `support:column:3,3` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (2, 5) | `support:column:6,3` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (3, 0) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (3, 1) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (5, 5) | `support:column:6,6` | normal, ghost, exploded | Priya |
| expert-5 | Rés-do-chão | (5, 7) | `support:column:8,6` | normal, ghost, exploded | nenhuma |
| expert-5 | Rés-do-chão | (5, 2) | `support:column:3,6` | ghost, exploded | nenhuma |
| expert-5 | Piso superior | (1, 0) | `object:bathroom-shower-west` | normal | nenhuma |
| expert-5 | Piso superior | (1, 1) | `object:bathroom-shower-east` | normal | nenhuma |
| expert-6 | Rés-do-chão | (2, 1) | `support:column:2,3` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (2, 5) | `support:column:6,3` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (5, 1) | `support:column:2,6` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (5, 3) | `object:stairs, support:column:4,6` | normal | nenhuma |
| expert-6 | Rés-do-chão | (5, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (6, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (7, 1) | `support:column:2,8` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (2, 2) | `support:column:3,3` | ghost, exploded | nenhuma |
| expert-6 | Rés-do-chão | (5, 3) | `support:column:4,6` | ghost, exploded | nenhuma |
| expert-7 | Rés-do-chão | (2, 3) | `object:stairs, support:column:4,3, wall:office-garden-facade` | normal, ghost, exploded | nenhuma |
| expert-7 | Rés-do-chão | (2, 6) | `support:column:7,3` | normal, ghost, exploded | nenhuma |
| expert-7 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| expert-7 | Piso superior | (3, 0) | `object:bathroom-shower` | normal | nenhuma |
| expert-8 | Rés-do-chão | (2, 2) | `support:column:3,3` | normal, ghost, exploded | nenhuma |
| expert-8 | Rés-do-chão | (2, 4) | `support:column:5,3` | normal, ghost, exploded | nenhuma |
| expert-8 | Rés-do-chão | (5, 2) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (2, 1) | `support:column:2,3` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (2, 3) | `support:column:4,3` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (2, 5) | `support:column:6,3` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (3, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (3, 6) | `object:dining-lamp-west` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (4, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (5, 1) | `support:column:2,6` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (5, 3) | `support:column:4,6` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (7, 1) | `support:column:2,8` | normal, ghost, exploded | nenhuma |
| expert-9 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| expert-9 | Piso superior | (1, 3) | `object:bathroom-shower-east` | normal | nenhuma |
| expert-10 | Rés-do-chão | (0, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (0, 6) | `object:stairs` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (2, 1) | `support:column:2,3` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (2, 3) | `support:column:4,3` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (4, 3) | `support:column:4,5` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (4, 5) | `support:column:6,5` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (4, 7) | `support:column:8,5` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (5, 1) | `support:column:2,6` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (5, 3) | `support:column:4,6` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (7, 1) | `support:column:2,8` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (7, 5) | `support:column:6,8` | normal, ghost, exploded | nenhuma |
| expert-10 | Rés-do-chão | (7, 7) | `support:column:8,8` | normal, ghost, exploded | nenhuma |
| expert-10 | Piso superior | (3, 1) | `object:bathroom-shower-north` | normal | nenhuma |
| expert-10 | Piso superior | (4, 1) | `object:bathroom-shower-south` | normal | nenhuma |
| master-1 | Rés-do-chão | (2, 3) | `support:column:4,3` | normal, ghost, exploded | nenhuma |
| master-1 | Rés-do-chão | (2, 5) | `support:column:6,3` | normal, ghost, exploded | nenhuma |
| master-1 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| master-1 | Rés-do-chão | (3, 3) | `object:stairs` | normal | nenhuma |
| master-1 | Rés-do-chão | (3, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-1 | Rés-do-chão | (4, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-1 | Rés-do-chão | (5, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-1 | Rés-do-chão | (6, 7) | `object:kitchen-fridge` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (3, 3) | `support:column:4,4` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (3, 5) | `support:column:6,4` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (3, 7) | `support:column:8,4` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (5, 0) | `object:stairs` | normal | nenhuma |
| master-2 | Rés-do-chão | (6, 0) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (6, 3) | `support:column:4,7` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (6, 5) | `support:column:6,7` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (6, 7) | `support:column:8,7` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (7, 5) | `support:column:6,8` | normal, ghost, exploded | nenhuma |
| master-2 | Rés-do-chão | (7, 7) | `support:column:8,8` | normal, ghost, exploded | nenhuma |
| master-2 | Piso superior | (1, 6) | `object:bathroom-shower-north` | normal | nenhuma |
| master-2 | Piso superior | (1, 7) | `object:bathroom-shower-north` | normal, ghost, exploded | nenhuma |
| master-2 | Piso superior | (6, 6) | `object:bathroom-shower-south` | normal | nenhuma |
| master-3 | Rés-do-chão | (2, 3) | `object:stairs` | normal | nenhuma |
| master-3 | Rés-do-chão | (2, 4) | `support:column:5,3` | normal, ghost, exploded | nenhuma |
| master-3 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| master-3 | Rés-do-chão | (3, 3) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-3 | Rés-do-chão | (3, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-3 | Rés-do-chão | (4, 7) | `object:hallway-plant` | normal, ghost, exploded | nenhuma |
| master-3 | Rés-do-chão | (2, 2) | `support:column:3,3` | ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (0, 1) | `object:stairs` | normal | nenhuma |
| master-4 | Rés-do-chão | (0, 2) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (2, 3) | `support:column:4,3` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (2, 6) | `support:column:7,3` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (2, 7) | `support:column:8,3` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (4, 2) | `support:column:3,5` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (4, 3) | `support:column:4,5:3,5` | normal | nenhuma |
| master-4 | Rés-do-chão | (4, 6) | `support:column:7,5` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (4, 7) | `support:column:8,5` | normal, ghost, exploded | Viraj |
| master-4 | Rés-do-chão | (7, 2) | `support:column:3,8` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| master-4 | Rés-do-chão | (4, 3) | `support:column:4,5:3,5, support:column:4,5:4,4` | ghost, exploded | nenhuma |
| master-4 | Piso superior | (1, 4) | `object:hallway-plant-east` | normal, ghost, exploded | nenhuma |
| master-4 | Piso superior | (4, 1) | `object:bathroom-shower` | normal | nenhuma |
| master-5 | Rés-do-chão | (2, 1) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-5 | Rés-do-chão | (2, 2) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-5 | Rés-do-chão | (4, 2) | `support:column:3,5` | normal, ghost, exploded | nenhuma |
| master-5 | Rés-do-chão | (4, 4) | `support:column:5,5` | normal, ghost, exploded | nenhuma |
| master-5 | Rés-do-chão | (7, 2) | `support:column:3,8` | normal, ghost, exploded | nenhuma |
| master-5 | Rés-do-chão | (7, 4) | `support:column:5,8` | normal, ghost, exploded | nenhuma |
| master-5 | Piso superior | (6, 5) | `object:bathroom-shower` | normal | nenhuma |
| master-6 | Piso superior | (2, 5) | `object:bathroom-shower-south` | normal | nenhuma |
| master-6 | Piso superior | (3, 5) | `object:bathroom-shower-south` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (0, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (0, 5) | `object:stairs` | normal | nenhuma |
| master-7 | Rés-do-chão | (1, 4) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (3, 2) | `support:column:3,4` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (3, 3) | `support:column:4,4` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (3, 6) | `support:column:7,4` | normal, ghost, exploded | Nadia |
| master-7 | Rés-do-chão | (3, 7) | `support:column:8,4` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (6, 2) | `support:column:3,7` | normal, ghost, exploded | Bella |
| master-7 | Rés-do-chão | (6, 3) | `support:column:4,7` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (6, 6) | `support:column:7,7` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (6, 7) | `support:column:8,7` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (7, 3) | `support:column:4,8` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (7, 6) | `support:column:7,8` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (7, 7) | `support:column:8,8` | normal, ghost, exploded | nenhuma |
| master-7 | Rés-do-chão | (7, 2) | `support:column:3,8` | ghost, exploded | nenhuma |
| master-7 | Piso superior | (1, 1) | `object:bathroom-shower` | normal | nenhuma |
| master-8 | Rés-do-chão | (0, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-8 | Rés-do-chão | (1, 5) | `object:stairs` | normal, ghost, exploded | nenhuma |
| master-8 | Rés-do-chão | (2, 2) | `support:column:3,3` | normal, ghost, exploded | nenhuma |
| master-8 | Rés-do-chão | (4, 2) | `support:column:3,5` | normal, ghost, exploded | nenhuma |
| master-8 | Rés-do-chão | (7, 2) | `support:column:3,8` | normal, ghost, exploded | nenhuma |
| master-8 | Piso superior | (2, 7) | `object:bedroom-lamp-north` | normal, ghost, exploded | nenhuma |
| master-8 | Piso superior | (4, 0) | `object:bathroom-shower` | normal | nenhuma |

## Provas das posições solucionadas com interseção

- expert-1: [tabuleiro resolvido](expert-1-solution-board-qa.jpeg).
- expert-5: [tabuleiro resolvido](expert-5-solution-board-qa.jpeg).
- master-4: [tabuleiro resolvido](master-4-solution-board-qa.jpeg).
- master-7: [tabuleiro resolvido](master-7-solution-board-qa.jpeg).

Total: 470 observações de avisos, 178 grupos únicos, 5 células solucionadas com bloqueio 3D.
