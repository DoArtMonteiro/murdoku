# Provas da arquitetura de vários pisos V2

Capturas reais do Chromium através de dev-browser, em 10/09/2026 e 11/09/2026.
O orquestrador inspecionou as imagens antes da aceitação. As imagens de ambiente
usam `?case=hard-1&env=1`; as de interação usam o jogo normal. O código de cena
final inclui a proteção do bordo da chegada do commit `386cfc9`.

## Arquitetura

| Imagem | O que permite verificar |
| --- | --- |
| [Rés-do-chão](v2-release-ground-ghost.png) | Casa inferior preservada e contexto superior alinhado |
| [Piso superior](v2-release-upper-ghost.png) | Patamar, átrio, quatro espaços e contexto inferior |
| [Lanço inferior](v2-release-stair-flight.png) | Direção e subida da escada no contexto da casa |
| [Vão e divisões em resolução nativa](v2-release-upper-rooms.png) | Chegada, bordo protegido, portas, estudo, quarto, casa de banho e leitura |
| [Vista explodida inferior](v2-release-ground-exploded.png) | Correspondência entre cabeça do lanço e chegada superior |
| [Vista explodida superior](v2-release-upper-exploded.png) | Perfil do lanço inferior e guias entre cotas |
| [Rés-do-chão móvel](v2-release-mobile-ground.png) | Enquadramento a 390 × 844 |
| [Piso superior móvel](v2-release-mobile-upper.png) | Leitura do patamar, vão e divisões em janela estreita |
| [Vista explodida móvel](v2-release-mobile-exploded.png) | Guias e legenda no tamanho móvel |
| [Regressão com jardim](v2-final-garden-support.png) | Configuração técnica independente: o piso superior não cobre o jardim lateral |

O piloto The Wrong Coat não tem jardim. A última imagem usa
`tests/fixtures/multistoreyGarden.ts`, não um caso novo. Demonstra apenas a
regra de apoio e a pegada; não apresenta uma casa mobilada para produção.

## Interação

| Imagem | O que permite verificar |
| --- | --- |
| [Seleção superior no telemóvel](v2-release-mobile-selection.png) | Jonas em linha 4, coluna 7; contorno ativo, ocupação e guias |
| [Conflito local](v2-qa-desktop-local-conflict.png) | Pessoas em conflito, indicadores e faixa correspondente |
| [Conflito entre pisos](v2-qa-desktop-crossfloor-conflict.png) | Bloqueio cruzado e célula superior ativa |
| [Localização de pista](v2-qa-desktop-clue-location.png) | Texto de pista e posições realçadas |
| [Pista no telemóvel](v2-qa-mobile-clue-location.png) | Legibilidade do texto e dos realces no ecrã estreito |
| [Conclusão no computador](v2-qa-desktop-case-closed.png) | Vitória obtida através da interface |
| [Conclusão no telemóvel](v2-qa-mobile-case-closed.png) | Vitória e controlos em 390 × 844 |

O ensaio também percorreu ajuda, aplicação da ajuda, desfazer/refazer e teclado.
As capturas de interação de 10/09 antecedem o prolongamento final da guarda,
que não alterou lógica ou controlos. A seleção móvel de 11/09 já usa a guarda final.

## Referências de um piso

- [Midnight Delivery](v2-final-single-very-easy-1.png).
- [The Empty Chair](v2-final-single-very-easy-2.png).
- [The Last Nightcap](v2-final-single-easy-1.png).

Estas três cenas conservam a câmara de 32°. A inspeção confirmou arquitetura,
apoios, mobiliário, janelas e separação do jardim após as alterações do sistema.

Os enquadramentos de computador usam 1 440 × 1 100. As imagens só da casa
preservam a resolução nativa do elemento canvas. A demonstração técnica do
jardim usa 1 440 × 900. O tamanho móvel é emulado no Chromium, sem dispositivo físico.
