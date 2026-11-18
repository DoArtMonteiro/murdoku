# Acabamentos arquitetónicos residenciais V4

Início: 17/09/2026. Conclusão: 21/09/2026. Estado: READY, após revisão visual Astra.
Origem local e remota verificada após `git fetch origin`:
`astra/multistorey-residential-design-v3`,
`1e78316f024c60bac98239ed0104c1f44b4d43bf`.
Árvore de trabalho limpa na partida. Trabalho isolado em
`astra/residential-architectural-polish-v4`; o ramo V3 permanece intacto.

## Diagnóstico antes de alterar código

As imagens V3 mostram separação lateral entre os aros e as paredes no quarto,
na casa de banho e no escritório. O resolvedor recorta a largura declarada
do vão, mas insere sempre o mesmo modelo rígido `doorwayOpen`. As quatro portas
superiores declaram uma célula, equivalente a 0,8 unidades. O aro catalogado
mede cerca de 0,486 unidades de largura. Isto deixa cerca de 0,157 unidades
de espaço lateral em cada lado. A largura explícita substitui `DOOR_GAP`;
alterar apenas essa constante não corrigiria as portas V3.

Mesmo sem largura explícita, `DOOR_GAP` acrescenta 0,02 à largura exterior
do modelo. Existe, portanto, uma folga de montagem que não recebe acabamento.
As janelas já têm membros procedimentais que cobrem a junta; as divisórias
com porta não têm esses membros. A medição direta das malhas determinará
a secção do aro, a profundidade e a sobreposição necessária. Não há motivo
para deslocar o centro das portas ou mover mobiliário.

A hierarquia atual tem envelope posterior de 1,29, recorte exterior de 0,12,
divisória `full` de 1,29, `low` de 0,6 e `half` de 0,35. As guardas usam
`half` com tratamento aberto. O quarto a este e o banho a norte/nordeste
usam `full`; todas as entradas, o escritório e a leitura usam `low`.
O nome `low` descreve uma altura, mas não distingue a intenção de recorte
de uma verdadeira divisória baixa. A aparência de cubículo no escritório
é visível e não se resolve subindo as guardas.

Há ainda uma restrição física a considerar: o intervalo entre pisos é 1,34,
composto por parede de 1,29 e laje de 0,05. Subir indiscriminadamente paredes
completas para além dessa cota faria-as atravessar a laje do piso seguinte.
A comparação visual deve preservar essa relação, a escada e a leitura do
envelope. Serão comparadas a referência e duas intensidades de apresentação,
antes da escolha final da hierarquia.

## Âmbito da autorização de sistema

O pedido V4 autoriza expressamente uma correção reutilizável do encontro
entre porta e parede e a separação semântica das alturas. Esta autorização
cobre esquema, resolução, desenho e testes estritamente necessários a esses
contratos. Não autoriza alterações ao caso, à solução, às pistas, ao gerador,
à câmara, às escadas ou aos limiares dos validadores. Qualquer necessidade
adicional será identificada separadamente.

## Medição e decisão do encontro das portas

A leitura dos 48 vértices de `doorwayOpen.glb` confirma largura exterior
0,485999972, altura 1,009531736 e profundidade 0,089099996. As ombreiras e
a travessa têm secção 0,02835. O interior livre mede 0,4293 de largura e
0,981181736 de altura. Há apenas um aro retangular, sem guarnição que cubra
a parede. O recentramento do carregador está correto; a rotação de 90°
conserva as mesmas folgas. A causa é incompatibilidade de largura e ausência
de acabamento, não um erro de origem ou de orientação.

| Porta superior | Eixo | Vão estrutural | Aro V3 | Folga por lado |
| --- | --- | --- | --- | --- |
| Quarto | x | 0,8 | 0,486 | 0,157 |
| Escritório | x | 0,8 | 0,486 | 0,157 |
| Casa de banho | z | 0,8 | 0,486 | 0,157 |
| Leitura | x | 0,8 | 0,486 | 0,157 |

Decisão Astra: resolver as portas interiores por membros procedimentais
de secção medida, adaptados ao vão estrutural declarado. Não esticar o GLB
nem disfarçar 0,157 de vazio com uma guarnição desproporcionada. Conservar
centros, larguras dos vãos e altura útil do aro. A folga de montagem mantém
0,01 por lado; a guarnição cobre-a e sobrepõe a parede em meia secção de
ombreira, 0,014175. Projeta-se 0,01 para fora de cada face da parede,
conforme o acabamento de janela existente. Não haverá travessa no pavimento.

A guarnição encosta diretamente à face da parede. Deixa meia secção do aro
visível junto à passagem, em vez de alinhar duas faces na mesma posição.
A interseção de 0,00455 em profundidade fica dentro do acabamento de madeira;
não há guarnições suspensas, nem peças da própria guarnição sobrepostas.
As folgas laterais recebem enchimentos até à travessa, incluindo a zona
visível pelo topo das paredes recortadas.

O vão superior de 0,8 terá passagem acabada de 0,7233, depois das duas
folgas e duas ombreiras. O vão por omissão de 0,506 conservará a passagem
medida de 0,4293. A entrada exterior conserva a folha Kenney e recebe apenas
a guarnição que cobre a junta. As janelas conservam o sistema atual, que já
sobrepõe os limites do vão em 0,03 de cada lado.

## Ensaios preliminares de altura

Uma simulação da geometria resolvida, sem alterar ficheiros de execução,
comparou as paredes completas V3 de 1,29 com 1,419 (+10 %) e 1,4835 (+15 %).
Ambas as subidas ocultam seis posições à altura das peças de jogo:
`0,1`, `1,1`, `2,1`, `4,0`, `4,1` e `4,2`. Além disso, ultrapassam a cota
de encaixe na laje seguinte. Estes resultados justificam rejeitar uma subida
global, mas não substituem a comparação visual pedida.

No escritório, elevar apenas a parede oeste de 0,6 para 0,66 ou 0,69 não
produziu erros nem posições ocultas na mesma simulação. Convertê-la inteira
para 1,29 oculta três posições junto à chegada. As alternativas visuais irão
distinguir uma divisória de divisão apresentada em recorte de uma meia-parede
real e de um recorte do lado da câmara. A escada, o envelope e as guardas
conservam as cotas existentes.

O ensaio seguinte separou as duas paredes laterais (`office-west` e
`reading-west`) das quatro entradas voltadas para a câmara. Nas laterais,
0,66, 0,69 e 0,8 não ocultam células; 0,9 oculta três posições no corredor
do escritório. Subir também as entradas para 0,66 já oculta cinco posições.
Por isso, a comparação visual será feita apenas nas laterais, através de uma
classe explícita `room-cutaway`. A classe `cutaway` identifica os cortes
voltados para a câmara, que conservam 0,6. `low` mantém compatibilidade com
as cenas existentes. Esta separação não altera os limites das divisões nem
transforma guardas em paredes. A escolha da altura continua dependente das
imagens, não destes ensaios numéricos.

## Revisão visual da correção das portas

Em 20/09/2026, Astra reviu as capturas posteriores à correção, com o mesmo
enquadramento da referência: quarto, casa de banho, escritório, leitura,
piso superior completo, rés-do-chão com contexto superior e as três cenas
de referência. As juntas laterais estão cobertas nos dois eixos. As portas
já terminam nas paredes, em vez de parecerem aros independentes dentro de
vãos maiores. Não se observou alteração da composição das janelas nem das
cenas Midnight Delivery, The Empty Chair e The Last Nightcap.

Nesta fase, a aprovação abrangia apenas o encontro porta/parede. A escolha
das alturas e a aceitação final estão documentadas nas secções seguintes.

Validação deste lote: 19 testes focados aprovados (geometria das portas,
composição dos dois pisos e privacidade), seis controlos de produção aprovados,
TypeScript e análise estática sem erros. O catálogo medido dos 60 casos
permanece atualizado. A auditoria das dependências de produção não encontrou
vulnerabilidades. Os testes das portas leem diretamente os vértices do GLB,
verificam a passagem livre e limitam a interseção às peças de acabamento.

## Escolha visual das alturas

Astra comparou a referência de 0,6 com A (0,66), B (0,69) e C (0,8), no
mesmo enquadramento de 1440 × 1100. A e B ainda apresentam uma parede pouco
expressiva atrás da secretária. C dá continuidade mais convincente ao
escritório e à sala de leitura, sem esconder o mobiliário, a chegada nem o
percurso de distribuição. Foi escolhida C, a menor das opções comparadas que
satisfez essa leitura. O aumento é de 0,2 unidades (33,3 %), limitado às duas
laterais; as tentativas iniciais de 10 % e 15 % foram rejeitadas visualmente.

| Categoria | Paredes | V3 | V4 |
| --- | --- | --- | --- |
| Envelope posterior | Norte e oeste | 1,29 | 1,29 |
| Divisórias completas | `bedroom-east`, `bathroom-north`, `bathroom-east-private` | 1,29 | 1,29 |
| Divisórias laterais em recorte | `office-west`, `reading-west` | 0,6 | 0,8 |
| Recortes interiores voltados para a câmara | Quatro paredes das entradas superiores | 0,6 | 0,6 |
| Meias-paredes | Divisórias `half` do rés-do-chão | 0,35 | 0,35 |
| Guardas | `study-west`, `stairwell-west`, `stairwell-south` | 0,35 | 0,35 |
| Recorte exterior | Sul e este | 0,12 | 0,12 |

O intervalo entre pisos mantém 1,34. Não se subiram as paredes completas
para além da cota da laje, nem se alteraram as escadas. A V4 melhora a
apresentação das divisórias que antes partilhavam a classe genérica `low`;
não aumenta a altura física de todo o edifício. As portas mantêm as cotas
medidas e o acabamento escolhido no lote anterior. Os encontros em L entre
laterais mais altas e entradas recortadas são transições deliberadas do
modelo aberto, sem mudar os extremos das paredes.

## Verificação da implementação final

Código final: `7675d24ccb7ac09be7ffcafc34fda4836a51e5ea`, publicado no ramo
V4. A revisão técnica independente não encontrou defeitos materiais no
resolvedor ou no desenho das portas. Detetou uma dimensão incorreta no teste
de The Last Nightcap: passou a usar 7 × 7, a exigir ausência de problemas e
a verificar todas as janelas declaradas. O código da cena não precisou de
alterações.

| Verificação | Resultado |
| --- | --- |
| Bateria completa, 21/09/2026 | 40 ficheiros; 441 testes aprovados, cinco ignorados |
| Produção, incluindo TypeScript, 21/09/2026 | Seis controlos aprovados, catálogo completo de 60 casos |
| Compilação para produção da mesma implementação | Aprovada, incluindo geração PWA |
| Análise estática da implementação final | Aprovada |
| Catálogo medido | Relatório atualizado, 60 casos |
| Auditoria das dependências de produção, 21/09/2026 | Zero vulnerabilidades |
| Cobertura de `doorGeometry.ts` | Instruções: 95 %; ramos: 83,33 %; funções: 100 %; linhas: 98,27 % |
| Diferença em `src/core` e `src/data` face à V3 | Nenhuma |

A cobertura indicada é apenas a do novo módulo de portas, não uma medição
global do projeto. Foram acrescentados dez testes de portas e cinco da
hierarquia de paredes. Nenhum validador ou limiar foi alterado.

## Aceitação visual final

Em 21/09/2026, Astra inspecionou diretamente as imagens finais, incluindo
os recortes das divisões, o patamar, os dois modos de contexto entre pisos,
a vista explodida, o telemóvel e os quatro estados de jogo. A aceitação
resulta dessa revisão dos píxeis, em conjunto com as comparações V3/V4.

| Critério | Decisão visual |
| --- | --- |
| Portas | Aros integrados nas paredes, juntas cobertas e ausência de folgas laterais visíveis nos eixos X e Z |
| Paredes | Laterais do escritório e da leitura mais convincentes; recortes voltados para a câmara continuam a permitir ler o interior |
| Construção | Encontros e terminações coerentes; transições de altura correspondem aos recortes deliberados |
| Piso superior | Patamar e corredor legíveis, acesso livre às divisões, privacidade do quarto e da casa de banho preservada |
| Escritório e leitura | Escritório reconhecível como divisão; secretária, cadeira e conjunto de leitura utilizáveis, sem plantas a bloquear acessos |
| Escada e contexto | Guarda, abertura e chegada preservadas; os pisos continuam a pertencer à mesma casa |
| Regressões | Midnight Delivery, The Empty Chair e The Last Nightcap conservam a composição e a integração das janelas |

As capturas usam Chromium, DPR 1, área de conteúdo de 1 440 × 1 100 no
computador e 390 × 844 no telemóvel, sem redimensionar as imagens. O
[índice de provas](reference/residential-polish-v4/README.md) liga as 24
vistas pedidas, as comparações de altura e os recortes adicionais.

Os estados de jogo foram produzidos por interação real: seleção de uma
célula livre, colocação de Jonas na linha 4/coluna 7 e colocação de Clara
na linha 4/coluna 8 para criar um conflito. As duas colocações foram
desfeitas e confirmou-se o regresso a 0/5 pessoas colocadas.

Não foram identificadas imperfeições visuais impeditivas. Mantém-se a
convenção deliberada de casa aberta: nas paredes recortadas, os aros completos
podem ultrapassar o topo visível da parede. As guarnições retangulares simples
acompanham a linguagem Kenney. As paredes completas de 1,29 não foram
elevadas; o ganho visual vem das duas divisórias laterais em recorte de 0,8.

Decisão final: **READY**. A planta V3, o mobiliário, a escada, a área construída
e a lógica do puzzle foram preservados. Não houve integração noutros ramos.

## Histórico publicado

- `c21adf7`: diagnóstico V4 e referência visual V3.
- `ca36044`: integração dos acabamentos medidos das portas com as paredes.
- `7675d24`: separação dos recortes e reforço visual das divisórias laterais.
- O commit que contém esta aceitação acrescenta apenas documentação e imagens.
