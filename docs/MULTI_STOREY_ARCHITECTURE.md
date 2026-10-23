# Arquitetura residencial de vários pisos

Estado: READY, após validação técnica e visual em 11/09/2026.
Base: `5e03c58ed7ee7c31bc74772254f035f551721b66`.
Ramo: `astra/multistorey-architecture-v2`.

A revisão Astra e a inspeção no navegador autorizaram as correções de sistema
descritas abaixo. Os resultados e limites da aprovação estão no
[`MULTI_STOREY_V2_REPORT.md`](MULTI_STOREY_V2_REPORT.md), com
[provas no navegador](reference/multistorey-v2/README.md).

## Diagnóstico e decisão arquitetónica

The Wrong Coat tem um rés-do-chão integralmente interior, de 8 × 8 células.
A divisão sudeste «Conservatory» é interior, não um jardim exterior. A pegada superior pode coincidir com
a inferior; uma retração artificial prejudicaria o programa e os objetos lógicos.
A regra de não construir sobre jardim está demonstrada numa configuração de
regressão independente, sem inventar exterior no caso existente.

A composição histórica usava o vão lógico inclusivo `[2,0,4,2]`; era esse
retângulo de nove células lógicas que retirava laje, comprimia o quarto e fazia
a escada chegar ao conjunto da secretária, sem um espaço de distribuição
independente. O primeiro estudo físico contínuo `[2.65,0,5,1.15]` foi uma
tentativa posterior de delimitação do lanço e não a origem da contagem das nove
células.
A divisão lógica «Landing» não prova que exista um patamar arquitetónico.

## Planta implementada e aprovada

Coordenadas x/z em unidades de célula, com limites geométricos exclusivos:

- Rés-do-chão: pegada construída `[0,0,8,8]`; conservar divisões e mobiliário.
- Piso superior: `storeyFootprint: { kind: 'full' }`, com o vão retirado da
  laje; quarto a noroeste, estudo a nordeste, casa de banho a sudoeste e
  leitura a sudeste.
- Escada: preservar modelo, posição, subida para este e último degrau em x=5.
- Vão atual: `stairwellBounds: [2.65, 0, 5, 2.6]`. Os limites são contínuos,
  estão em unidades de célula e têm máximos exclusivos. O limite `x = 5`
  encontra a cabeça medida do lanço; `z = 2.6` dá 2,6 unidades de célula de
  profundidade para a descida visível. No piloto, o estudo histórico com
  `z = 1.15` foi insuficiente por ocultar parte do lanço; não é uma predefinição
  a copiar. Cada nova autoria tem de medir a escada e validar a visibilidade.
- Patamar atual: `landing: [5, 0.05, 7.95, 1.1]`, com continuação para o
  corredor este.
- Corredores atuais: `east-corridor: [6.85, 1.1, 7.95, 4.65]` e
  `transverse-hall: [0.05, 3.7, 7.95, 4.65]`. A largura útil é medida entre
  faces acabadas e tem de respeitar o mínimo efetivo de 0,6 unidades do mundo.
- Átrio transversal: a sul do estudo, com acesso ao quarto, estudo, casa de
  banho e leitura. Nenhum destes percursos atravessa um grupo de mobiliário.
- Estudo: a ala compacta fica entre `x = 5.05` e `x = 6.8`; tem entrada
  própria a sul e não é atravessada pelo percurso de chegada.
- Guarda do estudo: `study-west` estende-se de `[5.05, 1.15]` a
  `[5.05, 3.65]`, com `freeEnds: ['from']` no extremo junto ao último degrau;
  essa abertura corresponde ao acesso legítimo da chegada.
- Guardas: `stairwell-west` e `stairwell-south` acompanham os limites oeste e
  sul do vão. A barreira física é contínua, mas a geometria visível usa
  corrimão e montantes, deixando a chegada a este aberta.

```text
Escada → patamar norte → corredor este → átrio transversal
                                          ├─ quarto
                                          ├─ estudo
                                          ├─ casa de banho
                                          └─ leitura
```

O quarto conserva cama apoiada a oeste e mesa de cabeceira; a porta dá para o
átrio. O estudo conserva secretária e cadeira associadas às células lógicas,
mas recebe uma entrada própria a sul. A casa de banho conserva banheira,
lavatório e sanita, com acesso pelo átrio. A leitura agrupa cadeira, estante,
planta e consola no perímetro, mantendo a distribuição livre. As janelas
norte/oeste pertencem ao envelope real; a composição foi inspecionada no navegador.

## SYSTEM ESCALATION: pegada, vão físico e circulação

Limitação concreta: o resolvedor presume pavimento em todo o quadrado lógico;
o único vazio é um retângulo de células inteiras. O validador compara escada e
vão, mas não demonstra apoio entre pisos nem uma chegada ligada a circulação
arquitetónica. O resultado atual é um vão excessivo e uma chegada junto à mesa.

Decisão do orquestrador Astra, após revisão independente: acrescentar uma
pegada explícita por piso, limites físicos fracionários para o vão e metadados
de patamar/circulação. Manter compatibilidade com cenas de um piso e com a
representação histórica, sem permitir declarações contraditórias.

Conservar apenas o sistema atual obrigaria a retirar pavimento útil por causa
da grelha ou a chamar «patamar» a uma área privada. Essa alternativa é rejeitada.
Esta decisão não introduziu balanços estruturais, varandas, terceiro piso ou
gerador de casas. Um jardim ou pátio sem estrutura declarada não suporta um
piso interior superior.

Impacto previsto: esquema, resolução da laje/envelope, consumo da mesma laje
pelo renderizador ativo e fantasma, validação geométrica, testes e documentação.
A composição do piloto é uma unidade própria. A lógica do caso, o solucionador,
o gerador, a projeção, as medidas Kenney e os apoios em superfícies conservam-se.

## SYSTEM ESCALATION aprovada: projeção e leitura da escada

A decisão do orquestrador, após revisão Astra e inspeção no navegador, resolve
uma divergência entre a câmara de um piso e a leitura da escada entre pisos.
`makeFrame` usa a elevação de 32° em cenas de um piso. Em casos de dois pisos,
`makeStoreyFrame` usa 42°, tanto no contexto fantasma como no panorama
explodido, para permitir ver o lanço abaixo da laje ativa. A elevação de 42°
é específica da apresentação de vários pisos; não altera a referência de um
piso.

`SceneFrame.cameraDirection` é a direção partilhada pelo `project` das
sobreposições, pela câmara do `renderer` e pelos raios de visibilidade de
`validateScene`. A interface passa o mesmo `SceneFrame` ao piso ativo antes da
renderização, da validação e do posicionamento dos elementos DOM. Não se cria
uma câmara específica por cena nem se ajusta a posição em píxeis.

No contexto fantasma inferior, e apenas quando o acompanhante está abaixo do
piso ativo, `companionGeometry.ts` mostra através do vão os membros de paredes
reais do piso inferior que intersectam a abertura. A função
`companionWallBoxesThroughStairwell` recorta cada membro aos limites x/z do
`stairwellBounds`, conserva a altura original e prefere `visualPieces` quando
há uma guarda aberta. O recorte só se aplica à geometria real que atravessa a
abertura; não se inventa um poço, uma parede ou um *shaft*. As lajes
acompanhantes são unidas por `companionFloorBoxes`, sem diagonais da grelha
lógica; o contexto não recebe mobiliário, apenas estrutura e a escada.

### Proteção aberta do vão

A inspeção no Chromium revelou uma limitação adicional: mesmo com o vão
fisicamente correto, a meia-parede opaca e a parede norte do estudo ocultam
os últimos degraus na câmara normal. Uma vista elevada de diagnóstico mostra
o lanço, confirmando que não se trata de pavimento indevidamente preenchido.
Retirar a estante decorativa e baixar apenas um troço da parede não resolve
a leitura da chegada.

O orquestrador aprova uma proteção física aberta, com corrimão e montantes,
como abstração reutilizável de guarda. A geometria visual deve mostrar os
intervalos reais entre montantes; a barreira de circulação permanece contínua.
Não se usa transparência nem se permite atravessar uma guarda. A alternativa
de alterar a câmara global prejudicaria as referências de um piso; ampliar
arbitrariamente o vão sacrificaria área útil sem atacar o obstáculo principal.
Esta decisão exige implementação isolada, testes geométricos e nova inspeção
da chegada na câmara normal antes de aprovação.

### Paredes baixas, guardas e células visíveis

Na referência `hard-1`, `bedroom-south`, `bathroom-north` e `study-south`
declaram `height: 'half'` nos troços que enquadram a circulação. Estas paredes
de meia altura preservam a leitura do espaço à altura do peito e, com o
`SceneFrame` de cada vista, mantêm a advertência `cell-hidden` a zero na
composição atual. O resultado é uma propriedade verificada da referência,
não uma licença para baixar paredes arbitrariamente numa cena nova.

As guardas `stairwell-west` e `stairwell-south` usam `treatment: 'railing'`.
`pieces` conserva a barreira contínua para colisões, circulação e acessibilidade;
`visualPieces` contém apenas corrimão e montantes, com intervalos reais para a
leitura visual. A chegada a este permanece aberta. A proteção não pode ser
substituída por mobiliário, opacidade ou uma tolerância de validação.

### Guias do panorama explodido

`explodedConnectionSegments` mantém a escada na altura e na pegada medidas.
As duas primeiras linhas são guias verticais pontilhadas: unem, nos dois lados
da pegada, a cota do topo real do lanço à cota da chegada superior depois da
separação dos pisos. As barras inferior e superior e o perfil lateral seguem
as caixas de visibilidade dos degraus medidos. O perfil não transforma o lanço
num prisma nem alonga cada degrau; para uma escada de canto sem volumes de
degraus medidos, o perfil é omitido.

Os testes deverão rejeitar pavimento superior sem apoio, chegada bloqueada,
vão incompatível, móveis ou tapetes sem laje e circulação declarada descontínua.
As verificações não substituem julgamento residencial: privacidade, proporções,
conforto, leitura das guardas e qualidade do mobiliário exigem imagens reais.

Antes de declarar esta referência pronta: inspecionar ambos os pisos, chegada,
corredor, portas e contactos em 1 440 × 1 100 e 390 × 844; testar contexto
fantasma, panorama explodido e interação; rever os três pilotos de um piso;
executar o controlo completo de produção. O piloto cumpriu esta revisão; cada
nova cena precisa das suas próprias provas, sem herdar automaticamente a aprovação.

## Contrato editorial permanente

### Representação de pegada e circulação

`storeyFootprint` delimita onde existe laje ou terreno nesse piso. Usa
`{ kind: 'full' }` para a extensão lógica completa ou
`{ kind: 'cell-rects', rects: [...] }` para a união de retângulos inclusivos
de células `[colunaInicial, filaInicial, colunaFinal, filaFinal]`.
A omissão conserva o comportamento histórico das cenas de um piso; um novo
par de pisos de produção deve declarar ambas as pegadas.

A pegada de terreno não equivale à pegada construída. Uma célula exterior pode
estar presente no rés-do-chão sem constituir apoio para o piso superior. O
apoio normal exige presença física e classificação interior no piso inferior.
Uma estrutura exterior explicitamente declarada pode suportar uma laje superior
interior sem converter o terreno em pavimento jogável. Retirar uma laje faz-se
pela pegada, nunca pintando-a de relva ou mudando o nome da divisão lógica.

`stairwellBounds` usa limites físicos contínuos `[x0, z0, x1, z1]`, em unidades
de célula e com os limites máximos exclusivos. Na referência atual,
`[2.65, 0, 5, 2.6]` termina exatamente em x=5 e estende-se 2,6 unidades de
célula em z. O estudo histórico `[2.65, 0, 5, 1.15]` foi insuficiente neste
piloto por ocultar parte do lanço; não é a configuração por defeito. Uma nova
cena deve medir o seu lanço e validar a visibilidade antes de escolher o vão.
O antigo `stairwell` usa células inteiras inclusivas e existe apenas por
compatibilidade. Não declares os dois campos na mesma cena.

`circulation` distingue `landing`, `halls` e `roomAccessTargets`. Todos usam
retângulos físicos contínuos. Os corredores e as aproximações às divisões têm
identificadores próprios. As aproximações representam espaço livre junto às
entradas, não a área completa da divisão nem a posição de um móvel.
Declara as larguras entre as faces acabadas; não inclui a espessura das paredes
na largura utilizável. O limiar efetivo para `landing` e `halls` é de 0,6
unidades do mundo, equivalente a 0,75 células com `CELL = 0.8`. A função
`circulationConnectionWidth` e `connectedCirculationRects` usam esse mesmo
limiar para provar que os retângulos formam uma rede ligada à chegada.

A resolução produz fragmentos de pavimento que descontam a pegada ausente e
o vão. `floorPatches` é a fonte da vista ativa e das manchas de interação;
`mergedFloorBoxes`, usado pelo contexto, une os fragmentos sem expor a grelha.
A grelha lógica continua completa: esta geometria não altera as regras do
solucionador nem elimina candidatos silenciosamente. As posições da solução
publicada, contudo, não podem cair sobre um vão ou uma zona sem piso.

### Pegada, terreno e apoio

`storeyFootprint` define a presença física de cada célula. `{ kind: 'full' }`
preenche a extensão lógica; `{ kind: 'cell-rects', rects: [...] }` usa
retângulos inclusivos `[colunaInicial, filaInicial, colunaFinal, filaFinal]`.
Uma zona `floors` classificada como `interior` é pavimento acabado; `exterior`
é terreno rebaixado; `courtyard` é terreno rebaixado dentro do envelope.
Relva ou terra sem `kind` assumem `exterior`.

Uma pegada de terreno no rés-do-chão não é, por si só, apoio construído.
`validateUpperSupport` aceita uma célula superior interior quando o piso
inferior contém pavimento interior contínuo, ou quando um dos elementos
declarados em `exteriorSupportBays` cobre a célula e tem uma cadeia de apoio
válida até ao terreno. A estrutura exterior não acrescenta células a
`floorPresent`, não altera
`zoneKind` nem cria acessos de navegação.

`exteriorSupportBays` declara no piso térreo retângulos inclusivos de células
exteriores ou de pátio. Cada lado pode abranger no máximo três células. Cada
elemento tem de assentar em terreno existente, sem se sobrepor a outro, e
corresponder exatamente a uma laje interior superior completa. Os elementos
que se tocam apenas por um vértice mantêm pilares independentes. Vãos de escada,
áreas interiores inferiores, lajes superiores exteriores e estruturas órfãs
são rejeitados. Células superiores fora do apoio interior ou dos módulos
declarados continuam a falhar, pelo que balanços sem apoio permanecem inválidos.
O resolvedor deriva colunas até ao terreno, vigas perimetrais e barrotes sob a
laje. O validador rejeita interseções com mobiliário e escadas. A omissão do
campo mantém o comportamento anterior das cenas que já têm apoio válido.

`tests/fixtures/multistoreyGarden.ts` continua a demonstrar uma retração
superior sobre jardim sem estrutura de apoio. `hard-1` não tem jardim: a casa
tem 8 × 8 células e o `Conservatory` ocupa apenas o quadrante sudeste,
classificado como interior. A referência usa pegada completa nos dois pisos.

Cada fronteira entre uma célula interior presente e uma célula sem laje ou
classificada como exterior precisa de uma `WallSpec` que cubra o segmento
correspondente. `validateScene` aplica esta guarda nos dois eixos e nas duas
orientações da fronteira através de `zone-boundary-unwalled`. A parede pode ser
um recorte de meia altura, com `height: 'half'`, desde que exista como fachada
real; uma retração não pode ficar aberta por ser tratada como jardim. A regra
mede a inexistência de laje e o tipo da zona, não o nome da divisão nem a cor
do pavimento.

### Uma casa, dois pisos

Desenha os dois pisos em conjunto antes de mobilar. Identifica primeiro o
edifício real no rés-do-chão e todos os jardins, caminhos e pátios. A pegada
superior só pode ocupar área apoiada: construção interior inferior ou estrutura
exterior declarada. Uma retração retira parte da pegada; não se representa como
um jardim suspenso nem como um material de pavimento diferente. Não existem
balanços implicitamente autorizados.

O vão pertence ao volume do edifício, mas não contém laje. Pavimento interior,
terreno exterior e ausência de piso são conceitos diferentes. Um relvado
inferior não recebe teto, paredes ou móveis superiores por ocupar células da
grelha. Quando uma estrutura declarada suporta uma laje sobre o relvado,
colunas e vigas tornam o caminho de carga visível sem criar piso interior no
terreno. Janelas só pertencem a segmentos reais do envelope desse piso.

### Escada, patamar e circulação

Reserva o lanço medido, a aproximação inferior, a chegada superior e o percurso
até às divisões antes de colocar móveis. O patamar tem de permitir sair em
frente e escolher um percurso utilizável. Não pode ser apenas uma célula livre
no interior de um quarto ou entre uma secretária e a sua cadeira.

Num piso com várias divisões, um átrio, corredor ou galeria deve servir as
entradas. Declara espaços de circulação livres, com larguras medidas entre
faces acabadas; não uses uma linha abstrata que atravessa paredes ou móveis.
Cada entrada precisa de aproximação útil dos dois lados. A casa de banho não
pode funcionar como passagem obrigatória para chegar ao quarto.

As dimensões de circulação deste projeto servem a coerência da miniatura.
Não constituem certificação de acessibilidade ou cumprimento de normas de
construção de edifícios reais.

### Vão e proteção

O contorno do vão acompanha o volume do lanço e deixa a cabeça encontrar a
laje. Inspeciona os degraus reais, não apenas a caixa do modelo. Não há tapetes,
móveis, apoios de móveis ou soluções válidas sobre o vazio.

Protege todas as margens expostas que não sejam a própria chegada, com paredes
ou guardas coerentes. O recorte isométrico pode baixar a altura visível dessas
paredes, mas não pode apagar a intenção de proteção. Uma abertura escura sem
degraus reconhecíveis ou sem margens deliberadas falha a revisão visual.

### Divisões e mobiliário

Cada divisão deve possuir função, entrada e um conjunto de móveis relacionado:
cama com cabeceira e acesso lateral; secretária com cadeira; casa de banho com
equipamento e privacidade; leitura com assento e apoio. Relaciona esses grupos
com paredes e janelas. O espaço vazio serve circulação ou acesso; não se preenche
com cadeiras órfãs nem se deixa sem propósito por conveniência da grelha.

Os objetos pequenos apoiam-se em superfícies-pai declaradas. Os móveis mantêm
escala Kenney e contacto real com o pavimento. Uma pista não justifica colocar
um móvel no vão, na porta ou no patamar. Se não for possível conservar a
associação lógica e uma composição física válida, regista a incompatibilidade;
não alteres a pista, a solução ou as tolerâncias para a esconder.

### Separação da lógica

Linhas, colunas, pistas, solução e regiões lógicas continuam no modelo Murdoku.
Os nomes das divisões não definem circulação. «Study» pode conter parte de uma
galeria arquitetónica, mas isso não autoriza a chegada a atravessar o conjunto
de trabalho. A associação visual dos objetos lógicos mantém contacto com as
células correspondentes, conforme o contrato do validador.

### Regras objetivas e revisão editorial

`validateScene` e `validateStoreyPair` tratam de regras objetivas: pegada e
apoio entre pisos, fronteiras com fachada, cobertura do vão, contacto do lanço
com a laje, piso e obstáculos nas aproximações, largura e ligação da
circulação, colisões, paredes, visibilidade por raios e associação lógica dos
objetos. Os erros têm de ser zero. A advertência `cell-hidden` é uma indicação
para revisão; na referência atual, as paredes de meia altura acima deixam-na a
zero.

A revisão editorial decide se a chegada se lê como parte da casa, se as guardas
parecem seguras, se os grupos de mobiliário têm função, se a privacidade e as
portas fazem sentido e se a vista mantém hierarquia em secretária e telemóvel.
Passar nos testes não substitui essa decisão nem concede aprovação visual.

### Revisão obrigatória no navegador

Antes de aceitar o caso, guarda vistas completas e pormenores sem recortar o
encontro que está em avaliação. Confirma: lanço inferior, chegada, patamar,
vão, guardas, corredor, cada porta, grupos de mobiliário e relação entre
pegadas. Repete com contexto fantasma, panorama explodido e interação ativa.
Usa aproximadamente 1 440 × 1 100 e 390 × 844 píxeis.

Testa seleção, colocação, conflito local e entre pisos, localização de pistas,
ajuda, troca de piso, teclado, desfazer/refazer e conclusão do caso. Depois de
uma alteração estrutural, abre também Midnight Delivery, The Empty Chair e
The Last Nightcap. Testes aprovados não são aprovação visual.

### Erros que obrigam a rejeição

- Dois quadrados completos sobrepostos sem decisão de pegada.
- Piso interior superior sobre terreno exterior sem apoio estrutural explícito e válido.
- Escada que termina no conjunto de cama ou secretária.
- Patamar sem distribuição ou com passagem apertada e sem função residencial.
- Vão coberto por laje, tapete ou mobiliário.
- Abertura que parece geometria em falta e não uma escada deliberada.
- Divisões isoladas sem percurso humano entre elas.
- Móveis dispersos para preencher coordenadas de pistas.
- Janela sem parede exterior ou sobre uma zona sem piso superior.
- Validação afrouxada para aprovar uma composição impossível.

### Escalada futura

Uma necessidade de balanço, varanda ou apoio que não caiba em
`exteriorSupportBays`, bem como um novo sistema de escadas, exige «SYSTEM
ESCALATION»: descreve a limitação, mostra a falha concreta, compara alternativas
no sistema existente e propõe a menor abstração reutilizável.
Não cries indicadores específicos de um caso. A presente missão autoriza a
alteração descrita acima; essa autorização não se transfere automaticamente
para futuros lotes de produção.
