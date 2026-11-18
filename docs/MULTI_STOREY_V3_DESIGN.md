# Projeto residencial do piso superior V3

Início: 11/09/2026. Revisão da composição: 12/09/2026.
Estado: aceite após revisão visual e verificação interativa, em 13/09/2026.
Base: `bb2e8413129e52412d2ad77558025849e2fc1a9c`.
Ramo autorizado: `astra/multistorey-residential-design-v3`.

## Diagnóstico da imagem V2

A inspeção de `reference/multistorey-v2/v2-release-upper-rooms.png` confirma
que a guarda do vão expõe a cama, o escritório parece um cubículo, a casa de
banho tem área excessiva e a planta ocupa a frente utilizável da poltrona.
O percurso descrito nos dados não basta para dar hierarquia residencial à planta.

## Primeira proposta Astra

As coordenadas seguintes são hipóteses de autoria, em células, com máximos
exclusivos. A segunda passagem crítica e a medição física precedem a implementação.

1. **Funções e utilizadores:** quarto de um casal, escritório para trabalho
   individual, casa de banho partilhada, leitura e arrumação doméstica.
2. **Adjacências:** a escada chega a um patamar; um corredor a sul serve o
   átrio transversal; deste partem acessos independentes ao quarto, escritório,
   banho e leitura. Nenhuma divisão privada serve de passagem.
3. **Percurso:** preservar escada e vão `[2.65,0,5,2.6]`; estudar patamar
   `[5,0.05,5.85,1.1]`, corredor `[5.05,1.1,5.85,3.7]` e átrio
   `[0.05,3.7,7.95,4.65]`. Medir larguras entre faces acabadas.
4. **Portas:** usar a abertura com aro `kind: 'door'`. Entrada sul do quarto
   perto de x=1,8; entrada sul do escritório perto de x=6,9; entrada do banho
   a nordeste, por resolver na crítica; entrada norte da leitura perto de x=5,2.
5. **Privacidade:** parede opaca a este do quarto, prolongada até à sua parede
   sul. Paredes norte e este do banho interrompem a vista da chegada para os
   equipamentos. Verificar vários pontos do patamar e os limites completos
   da cama, banheira e sanita, sem assumir uma porta fechada.
6. **Proporções:** estudar quarto `[0,0,2.35,3.35]`, escritório
   `[5.9,0,8,3.65]`, banho `[0,5.2,3.15,8]` e leitura
   `[3.15,4.7,8,8]`. O banho passaria de cerca de 12,9 para 8,8 células².
7. **Banho:** banheira a oeste, sanita a sul e lavatório a norte; centro livre
   para utilização. A entrada não aponta diretamente para os equipamentos.
8. **Quarto:** cabeceira a oeste, acesso aos lados e aos pés da cama, uma mesa
   de cabeceira a norte e janela na fachada norte. Ajustar a cama só depois
   de fixar paredes e folgas; conservar as associações lógicas existentes.
9. **Escritório:** divisão fechada no canto nordeste; janela norte, secretária
   contra a parede oeste, cadeira voltada para a secretária e arrumação baixa.
10. **Leitura e arrumação:** poltrona voltada para o interior do conjunto,
    planta ao lado ou atrás, estante e apoio acessíveis. A faixa recuperada
    junto ao banho recebe arrumação de roupa, se houver profundidade útil.
11. **Áreas abertas:** apenas circulação, aproximações às portas e acesso
    ao mobiliário. Não mobilar o corredor nem preencher folgas com decoração.
12. **Pegada:** conservar a laje existente. Os equipamentos lógicos nos
    extremos sudoeste e sudeste não justificam uma retração artificial.

## Questões para a segunda passagem Astra

- Resolver a inconsistência da primeira proposta entre porta norte e porta
  este do banho, com prova de privacidade e percurso contínuo.
- Confirmar contacto da secretária com a célula lógica na coluna 5.
- Confirmar que a parede oeste do escritório não oculta a chegada da escada.
- Medir folgas da cama e da mesa de cabeceira, sem sacrificar conforto aos testes.
- Alinhar o revestimento do banho com o perímetro arquitetónico.
- Verificar posições jogáveis atrás das paredes completas.

Os testes aprovados da V2 são a referência técnica inicial: 18 testes de
composição e escadas passaram antes de qualquer alteração da cena.
O solucionador, gerador, esquema, renderizador e validadores estão protegidos.

## Segunda passagem Astra e decisão de protótipo

A crítica independente não aprovou a primeira planta como resultado final.
Uma simulação em memória isolou os volumes e encontrou 18 posições ocultas.
A parede completa do escritório também pode interceptar o raio da câmara
para o último degrau. Essa simulação não incluía a circulação e não foi
apresentada como validação integral.

O estudo seguinte fica autorizado apenas para medição e inspeção:

- Quarto com paredes este em x=2,4 e sul em z=3,4; cama em z=2,05 e mesa de
  cabeceira em z=1,1. A folga física nos pés aproxima-se de 0,71 unidades.
- Escritório com quatro limites e porta sul. A parede oeste usa o recorte
  isométrico normal, com 0,6 unidades, para testar a leitura da escada. A
  secretária fica apoiada a oeste; a cadeira deve alinhar com o posto de trabalho.
- Banho de 3 × 3 células, com revestimento coincidente, entrada norte e três
  equipamentos. Medir ocultações e linhas de visão antes de aceitar as paredes.
- Leitura aberta ao átrio, sem inventar outra divisão fechada. A planta fica
  lateral ao assento. Não prometer um roupeiro numa faixa sem profundidade.
- Guarda este do vão independente da parede do escritório. Preservar a
  proteção junto à cabeça da escada e a sua aproximação física.

Antes da alteração da cena, os três testes novos de privacidade falharam na V2,
como esperado: cama, banheira e sanita têm vistas diretas da chegada. O ensaio
usa vários pontos no patamar, duas alturas e nove alvos por equipamento. Mede
paredes visíveis, incluindo os intervalos das guardas, e não presume portas
fechadas. Este ensaio complementa a inspeção das imagens; não a substitui.

## Planta implementada após medição e inspeção do protótipo

O patamar mede 0,85 × 1,05 células. A circulação desce entre a guarda do vão
e a parede do escritório; no átrio transversal, distribui-se por quatro portas.
Um corredor lateral separado da sala de leitura serve a entrada do banho.
O vão conserva exatamente as dimensões V2; a redução da chegada e o desenho
das paredes retiram-lhe a função indevida de organizar mobiliário disperso.

```text
Escada
  Patamar compacto
    Corredor junto ao escritório
      Átrio transversal
        Porta do quarto
        Porta do escritório
        Porta da sala de leitura
        Corredor lateral e porta do banho
```

| Espaço | Limites x/z | Entrada | Função do espaço livre |
| --- | --- | --- | --- |
| Quarto | `[0,0,2.4,3.4]` | Sul, x=1,65 | Acesso lateral à cama e passagem nos pés |
| Escritório | `[5.9,0,8,3.7]` | Sul, x=6,9 | Entrada, uso da cadeira e acesso à arrumação |
| Banho | `[0,5.4,3.4,8]` | Este, z=6,8 | Lavatório na faixa seca, acesso à banheira e sanita |
| Leitura | `[4.35,4.7,8,8]` | Norte, x=5,2 | Aproximação aos assentos, estante e consola |

A casa de banho passa de 12,87 para 8,84 células², uma redução de 31,3 %.
A banheira fica junto à janela oeste; o lavatório apoia-se na parede norte e
a sanita na parede sul. O mosaico ocupa a zona húmida; a faixa seca do
lavatório conserva madeira. A porta este fica fora das linhas de visão da
chegada. As duas hipóteses de porta norte foram rejeitadas após medição.

O quarto tem uma parede completa entre a cama e a escada. A parede sul usa
o recorte isométrico com uma porta real. A cabeceira encosta a oeste e a mesa
de cabeceira fica a norte; a passagem nos pés tem cerca de 0,71 unidades físicas.
O escritório passa a ocupar o canto nordeste, com janela própria. Secretária
e cadeira partilham o eixo z=2,05; a estante baixa fica no perímetro norte.

A sala de leitura foi delimitada depois de a imagem do primeiro protótipo
mostrar que um assento isolado ainda deixava uma área indefinida. Um sofá e
uma poltrona enfrentam-se através da mesa baixa. O tapete pertence a esse
conjunto. A planta fica atrás e ao lado da poltrona, sem ocupar a aproximação.
Estante e consola conservam as associações lógicas existentes.

As áreas abertas são distribuição e aproximação: mudança de direção depois
do lanço, átrio diante do quarto e escritório, corredor do banho e acesso aos
assentos. A laje integral mantém-se; não foram retiradas células nem adicionados
modelos ao catálogo. O rés-do-chão e a lógica do caso permanecem intactos.

## Limite observado nas portas completas

A projeção dos lintéis no teste de circulação pode tratar uma porta livre
como obstáculo. Não foi alterado qualquer validador. O troço da entrada do
banho usa o recorte baixo existente e mantém o aro da porta; os painéis norte
e nordeste continuam completos e garantem a privacidade medida. No quarto,
o recorte sul também conserva a porta e a parede este opaca.

Este registo não autoriza uma correção do sistema. Uma futura necessidade de
representar todas estas entradas com lintel estrutural completo exige uma
«SYSTEM ESCALATION» própria, com prova e autorização.

Os 21 testes focados e os seis controlos de produção passaram na composição
final, incluindo zero posições ocultas nas vistas reais dos dois pisos. Os
testes novos amostram privacidade em 18 posições/alturas da chegada, com nove
alvos na cama e dez em cada equipamento sanitário. Não constituem prova
contínua de todas as linhas de visão possíveis nem aprovação visual automática.

## Verificação final de código, 12/09/2026

A bateria completa passou: 38 ficheiros, 426 testes aprovados e cinco ignorados.
A cobertura configurada no projeto passou os quatro limiares de 80 %:
91,02 % de instruções, 84,09 % de ramos, 91,17 % de funções e 95,63 % de linhas.
Estas métricas abrangem os quatro ficheiros configurados no Vitest, não todo
o motor da cena. Também passaram a compilação, a análise estática, os seis
controlos de produção e a verificação das medições dos 60 casos. A auditoria
das dependências de produção não encontrou vulnerabilidades.

O teste geral de cenas passou a usar a câmara real dos pisos nas duas vistas,
«ghost» e «exploded». Antes, aplicava a câmara dos casos de um piso a todos
os casos. Mantém as exigências de zero erros e zero posições ocultas, agora
nas duas composições efetivamente usadas pela aplicação. Não houve alterações
ao renderizador, aos validadores ou às regras do jogo. Uma revisão independente
Astra confirmou esta correção do teste e não encontrou problemas acionáveis.

## Aceitação visual final

As [treze vistas obrigatórias](reference/multistorey-v3/README.md) foram
inspecionadas individualmente. A aceitação resulta dessa revisão e dos
percursos e composições observados, além da validação técnica.

| Critério | Resultado e fundamento |
| --- | --- |
| A escada chega à circulação | Sim: patamar livre e corredor dedicado |
| O percurso identifica-se sem explicação | Sim: continuidade do pavimento entre paredes e portas |
| Várias divisões partem do percurso | Sim: quarto, escritório, leitura e corredor do banho |
| O quarto é privado | Sim: parede este completa e porta sul |
| A cama fica protegida da chegada | Sim: a parede este interrompe a vista |
| A casa de banho tem dimensão adequada | Sim: 8,84 células², menos 31,3 % |
| A composição sanitária é plausível | Sim: banheira, lavatório e sanita com aproximação livre |
| O escritório tem uma definição deliberada | Sim: divisão com porta, janela e posto de trabalho alinhado |
| Cada conjunto de mobiliário tem uma função | Sim: dormir, trabalhar, higiene, leitura e arrumação |
| A poltrona é utilizável | Sim: frente livre, voltada para a mesa e o sofá |
| As plantas deixam o mobiliário e a circulação livres | Sim: planta atrás e ao lado da poltrona |
| As áreas restantes têm um propósito | Sim: circulação e aproximação ao mobiliário |
| O piso é habitável na leitura residencial da cena | Sim: funções separadas, acessos próprios e privacidade |
| O desenho tem a intenção do rés-do-chão | Sim: divisões e conjuntos completos, sem mobiliário disperso no patamar |

O caso foi concluído no computador e repetido em dimensões móveis. As três
cenas de referência também foram inspecionadas. O registo de imagens distingue
as capturas de arquitetura, a verificação do jogo e as cenas de referência.
