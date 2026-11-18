# Relatório de controlo de qualidade

Atualização de 11/09/2026: a arquitetura de vários pisos V2 está documentada em
[`MULTI_STOREY_V2_REPORT.md`](MULTI_STOREY_V2_REPORT.md). O controlo final passou
com 423 testes aprovados e 5 ignorados, 6 testes de produção, catálogo de 60
casos atualizado, TypeScript, lint e compilação aprovados. As capturas de
computador e telemóvel estão em
[`reference/multistorey-v2`](reference/multistorey-v2/README.md).
O contrato obrigatório para novas cenas é
[`MULTI_STOREY_ARCHITECTURE.md`](MULTI_STOREY_ARCHITECTURE.md).
Os resultados históricos abaixo conservam as datas e o âmbito das revisões anteriores.

Atualização de 08/09/2026: a revisão Astra posterior está descrita em
[`ASTRA_POLISH_REPORT.md`](ASTRA_POLISH_REPORT.md), com 376 testes aprovados,
nova composição de dois pisos, interação mais legível e imagens `astra-`.
O registo abaixo conserva os resultados históricos da ronda Sol.

Data: 07/09/2026

Ramo: `sol/isometric-system-hardening`

Referência de recuperação: `30be0c7e195b93389413e4eee7c79b6556f2f499`

## Âmbito

Esta ronda verificou o sistema isométrico, os casos de referência, a autoria de
dois pisos, a jogabilidade em computador e em ecrã tátil, a documentação de
produção e o catálogo completo de 60 casos. O conjunto de imagens usado na
revisão está indexado em [`reference/README.md`](reference/README.md).

## Portas técnicas

- Na suite integral final, 351 testes passaram e 5 foram ignorados.
- A cobertura atingiu 91,02 % nas instruções, 84,09 % nos ramos, 91,17 % nas
  funções e 95,63 % nas linhas.
- A análise estática terminou sem erros nem avisos.
- A compilação de produção terminou sem avisos; o fragmento assíncrono do
  renderizador mede 607,21 kB e 153,94 kB comprimido.
- A pré-validação aprovou os 60 casos, todas as cenas, todos os pisos e todos os
  recursos referenciados.
- A auditoria das 531 dependências não encontrou vulnerabilidades conhecidas.
- O relatório determinístico do catálogo não encontrou erros graves. Conserva
  20 avisos editoriais conhecidos em 19 casos: 3 pistas diretas sobre a divisão
  do assassino, 15 redundâncias e 2 sinais de dificuldade.

## Percurso de jogo

O caso «Midnight Delivery» foi jogado num navegador real. A ronda confirmou:

- bloqueio da acusação enquanto faltavam pessoas no tabuleiro;
- localização visual de uma pista;
- duas linhas de orientação ao passar o ponteiro sobre uma célula;
- colocação, levantamento e persistência de peças após recarregar a página;
- marca manual, anulação e repetição;
- deteção de conflitos de linha e coluna;
- limpeza do tabuleiro após confirmação;
- três sugestões, esgotamento do contador e colocação manual final;
- acusação correta e apresentação de «Caso encerrado».

Uma segunda resolução, sem sugestões, gravou a conclusão, o total de 1 em 60 e
o melhor tempo de 01:44. Estes dados permaneceram após recarregar a aplicação.
De seguida, o catálogo abriu «The Empty Chair» com um tabuleiro novo e 0 de 4
pessoas colocadas.

Num contexto tátil de 390 × 844 píxeis, a seleção e colocação por toque
funcionaram sem deslocamento horizontal. Uma acusação errada foi rejeitada com
uma explicação de pista concreta, sem criar falsos conflitos.

## Dois pisos

O caso «The Wrong Coat» confirmou a troca entre rés-do-chão e piso superior,
as vistas fantasma e explodida, 64 alvos ativos apenas no piso selecionado e a
aplicação transversal das regras de linha e coluna. O navegador também
confirmou a escada, o respetivo vão e a composição móvel.

A revisão visual detetou inicialmente as arestas das 64 células no piso
acompanhante. A correção passou a fundir células adjacentes com a mesma cota em
lajes contínuas. Os testes preservam mudanças reais de altura e o vão da escada.

## Revisão visual

- «Midnight Delivery»: quatro divisões distintas, vãos estruturais, entrada e
  percurso de jogo legíveis.
- «Empty Chair»: a soleira liga o interior ao jardim sem esconder a fronteira
  lógica; vegetação e vedação mantêm a leitura do lote.
- «Last Nightcap»: sala de refeições e cozinha distinguem-se por arquitetura e
  mobiliário, sem depender do quadriculado.
- «The Wrong Coat»: ambos os pisos mantêm a relação espacial em todas as vistas;
  o piso acompanhante já não revela a grelha permanente.

## Limitações conhecidas

Os pedidos externos de tipos de letra e retratos foram bloqueados no ambiente
de ensaio. As alternativas locais funcionaram, por isso esta restrição não
alterou a geometria, a interação nem as conclusões visuais. Os 20 avisos do
catálogo são matéria editorial mensurável, não erros do solucionador, do esquema
ou do renderizador.
