# Auditoria visual final do catálogo

Data: 11/10/2026. Estado: **pronta para a aprovação do responsável.**

O catálogo tem 60 casos com cenas 3D escritas à mão, num total de 90 pisos. A auditoria confirmou que nenhuma correção alterou o culpado, a vítima, as pistas, a solução, as divisões lógicas ou as peças `logic` de qualquer caso. Esta auditoria substitui a auditoria visual do PR #1, de 05/10/2026.

Registo completo das constatações: [`FINAL_VISUAL_AUDIT_FINDINGS.md`](FINAL_VISUAL_AUDIT_FINDINGS.md). Critérios e estado do redesenho de habitabilidade: [`HABITABILITY_REDESIGN.md`](HABITABILITY_REDESIGN.md).

## Âmbito e método

O critério de aceitação de cada piso é uma pergunta: «Isto lê-se como um edifício plausível e habitado?». As cenas foram julgadas com a rubrica de 11 pontos de `HABITABILITY_REDESIGN.md`:
- função das divisões;
- casas de banho, cozinhas, quartos, salas de estar e salas de jantar;
- escritórios;
- circulação;
- zonamento;
- divisões grandes;
- semântica do puzzle.

Houve duas revisões independentes em contexto limpo, sobre os 60 casos:
- **Claude Opus:** 11 lotes, de OP1 a OP11.
- **Claude Sonnet:** 11 lotes, de SN1 a SN11.

O GPT-6.1 Sol High não estava disponível, e por isso o Claude Sonnet substituiu-o como segundo revisor. Os revisores não tiveram acesso a pareceres anteriores, à lista de cenas alteradas nem às constatações um do outro. A reconciliação só começou depois de terminadas as duas revisões.

Depois das correções, houve uma re-revisão independente com o Claude Opus em contexto limpo:
- **RR1 a RR5:** os 26 casos corrigidos;
- **RR6:** os 4 casos da segunda passagem.

Cada constatação indica:
- o caso;
- o piso e a vista, pelo nome da imagem;
- a severidade (BLOCKER, MAJOR, MINOR ou POLISH);
- a prova visual, com a região em píxeis;
- a explicação;
- a correção recomendada.

Os revisores verificaram também os pontos pedidos:
- a proximidade entre o fogão e a banheira no hard-12, e o corredor de serviço;
- a correção do quarto e do corredor no master-5;
- as conversões do hard-3 e do hard-5;
- as divisões assinaladas por pouca mobília;
- as exceções de visibilidade das células da solução;
- as divisões grandes vazias.

## Cobertura e provas

A captura foi feita em Chromium, a 1 600 × 1 200 no computador e a 390 × 844 no telemóvel, por toque, sobre o estado final do código. O manifesto automático exige estes três elementos em cada imagem da solução:
- todas as pessoas colocadas;
- acusação aceite;
- nenhum erro de captura.

| Vista | Capturas |
| --- | ---: |
| Computador, normal | 60 |
| Computador, solução | 60 |
| Computador, piso superior | 30 |
| Computador, panorama explodido | 30 |
| Computador, orientação de pistas | 12 |
| Telemóvel, normal | 60 |
| Telemóvel, solução | 60 |
| Telemóvel, piso superior | 30 |
| **Total** | **342** |

- **Resultado do manifesto:** 342 ficheiros válidos, 60 casos, 90 pisos cobertos, 0 lacunas.
- **Aceitação das soluções:** os 60 casos têm a solução aceite no computador e no telemóvel.
- **Nova captura após as correções:** os 26 casos corrigidos foram capturados de novo, e 4 deles uma segunda vez depois da segunda passagem. O manifesto voltou a ser validado.
- **Imagens anteriores:** as capturas `__after` anteriores ao redesenho serviram apenas de comparação. Não contam como prova final.

## Resultados das revisões

| Revisão | Casos | BLOCKER | MAJOR | MINOR | POLISH | Veredictos |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Opus (OP1–OP11) | 60 | 0 | 22 | 182 | 0 | 57 com constatações, 3 «FAIL» |
| Sonnet (SN1–SN11) | 60 | 0 | 19 | 124 | 0 | 4 «PASS», 55 com constatações, 1 «FAIL» |
| Re-revisão Opus (RR1–RR6) | 26 (30 revisões) | 0 | 15 | 95 | 0 | Ver a secção de reconciliação |

### Divergências entre revisores

As severidades não foram calculadas pela média. Cada constatação MAJOR foi investigada, venha de um revisor ou dos dois.

- **Em que os revisores concordaram:**
  - very-easy-6: jardim da frente;
  - hard-4: jardim da frente;
  - hard-10: células do Carol e do Tomas;
  - hard-12: fogão encostado à banheira;
  - expert-7, expert-9 e expert-10: separação entre casa de banho e cozinha ou quarto;
  - master-3: banheira junto à cama;
  - master-5: corredor mobilado como sala;
  - master-7: jardim de inverno lido como sala.
- **Assinaladas só por um revisor:**
  - Opus: easy-5, easy-6, medium-6 (estante), hard-2, expert-1, expert-4, expert-5, master-2 (frigorífico), master-4 e master-6.
  - Sonnet: very-easy-8, medium-2, medium-6 (escritório), hard-5, hard-9, expert-2, master-1 e master-2 (sofá).
- **Recorrentes, de severidade menor:**
  - o frigorífico baixo lê-se como forno;
  - o texto de estado no fundo do telemóvel fica cortado;
  - as escadas chegam a divisões sem patamar.

## Reconciliação dos MAJOR

### Primeira ronda (Opus e Sonnet)

| Caso | Constatação | Resolução | Commit |
| --- | --- | --- | --- |
| very-easy-6 | Jardim da frente lido como relvado interior | Zona exterior sem paredes de invólucro; entrada na parede norte | `8524ea6` |
| very-easy-8 | Mesa sextavada inclinada; sala de jantar lida como sala de estar | Mesa retangular assente no tapete | `49c38e4` |
| easy-5 | Arbusto do Alexander confundido com uma planta | Os dois arbustos usam o mesmo modelo visível; sai a tulipa | `49c38e4` |
| easy-6 | Bancada da cozinha sobre a célula do Alexander (R4C5) | Armário decorativo retirado; fogão deslocado dentro da própria célula | `49c38e4` |
| medium-2 | Escritório lido como sala de televisão | Portátil, candeeiro e estante baixa; sai o monitor | `49c38e4` |
| medium-6 | Escritório lido como sala; estante da pista sem leitura | Estante alta virada para a câmara; sai a televisão | `49c38e4` |
| hard-2 | Sala de jantar térrea lida como sala de estar | Sai o conjunto de televisão; mesa comprida e aparador | `59bd97b`, `d3b5d40` |
| hard-4 | Jardim da frente lido como átrio interior com escada | Escada mudada para o corredor nos dois pisos; jardim exterior sobre dois vãos de apoio | `59bd97b` |
| hard-5 | Jardim de inverno e alpendre lidos como salas de jantar | Pavimento claro, canteiros em U e mobiliário de jardim (conversão aprovada a 08/10/2026) | `59bd97b` |
| hard-9 | Pérgula sobre as células da vítima e do culpado | Planta e arbusto fora da linha dos pilares e das vigas | `59bd97b` |
| hard-10 | Planta do Carol (R3C1) sob a escada; cadeira do Tomas (R6C8) atrás dos pilares | Planta deslocada dentro da célula; pilares reposicionados | `b4c1a7e` |
| hard-12 | Fogão encostado à banheira no piso de cima | Bancada em linha na meia parede do corredor, afastada da casa de banho | `8524ea6` |
| expert-1 | Estante da pista do Marco (R7C8) sem leitura | Estante alta virada para a câmara, com troço de parede | `b4c1a7e` |
| expert-2 | Banheira no meio do escritório | Parede de 0,6 entre a banheira e a secretária | `cc90d7d` |
| expert-4 | Sanita encostada à bancada da despensa | Sanita contra a parede da lavandaria; bancada mudada para sul | `cc90d7d` |
| expert-5 | Arbusto da Priya (R6C6) invisível | Arbusto maior num canto da célula; pilares reposicionados | `b4c1a7e` |
| expert-7 | WC aberto para a cozinha | Parede de 0,6 entre a casa de banho e a despensa | `cc90d7d` |
| expert-9 | Frigorífico no relvado; peças sanitárias espalhadas | Cozinha em linha; divisórias de 0,6; sofá afastado da sanita | `1123a4b` |
| expert-10 | Cabeceira da cama encostada ao fogão | Cama contra a parede da galeria; cozinha em L | `1123a4b` |
| master-1 | WC aberto para o patamar | Parede de 0,6 a poente; peças reorganizadas dentro do WC | `1123a4b` |
| master-2 | Frigorífico da pista lido como cubo baixo; sofá no bloco da casa de banho | Frigorífico alto virado a sul; consola no lugar do sofá | `d8a26f9` |
| master-3 | Cama ao lado de uma banheira aberta | Sai a cama decorativa; a banheira passa para dentro da suíte | `d8a26f9` |
| master-4 | Televisão (R5C4) caída no chão | Era um cadeirão baixo, que passou a sofá; televisão de pé virada para o sofá | `b4c1a7e` |
| master-5 | Corredor superior mobilado como sala; peças sanitárias espalhadas | Corredor com banco, consola e candeeiro. Peças sanitárias: não reproduzido, porque a casa de banho já está fechada e tem porta | `d8a26f9` |
| master-6 | Sala de jantar superior lida como sala de estar | Mesa com a cadeira da pista; sai a bancada com lava-loiça; segunda passagem sem sofá | `1993157`, `d3b5d40` |
| master-7 | Jardim de inverno lido como sala | Canteiros, pavimento de pedra e mobiliário de jardim; saem os sofás | `1993157` |

### Re-revisão (RR1 a RR6)

Das 15 constatações MAJOR da re-revisão, cinco ficaram resolvidas:

- **hard-2 e master-6, sala de jantar:** corrigidas na segunda passagem (`d3b5d40`). O RR6 confirmou 0 MAJOR em ambos os casos.
- **expert-4, duche no escritório:** o duche foi para o canto da casa de banho, atrás de uma divisória de 0,6 (`d3b5d40`). O RR6 não voltou a assinalar o problema.
- **expert-5, escada à frente do sofá:** saiu o cadeirão que estava entalado (`d3b5d40`).
- **master-6, sanita junto à sala de jantar:** foi levantada uma parede de 0,6 (`d3b5d40`). O RR6 confirmou 0 MAJOR.

### Exceção do sistema: casas de banho em corte

As restantes 10 constatações têm a mesma causa: casas de banho e WC do piso de cima que «não parecem fechados». A causa é do sistema e não das cenas:
- o renderizador corta as paredes interiores a 0,35 ou 0,6 de altura, para que se veja o tabuleiro;
- o validador recusa paredes mais altas sempre que escondem células ou peças.

Estas casas de banho têm paredes divisórias e porta, mas na vista em corte leem-se como abertas.

**Decisão explícita do responsável (11/10/2026).** A pergunta foi feita depois dos lotes RR1 a RR5 e nomeava estes casos: expert-1, 2, 4, 7 e 9; master-1 e 6; hard-4; hard-12. A resposta escolhida foi «Aceitar e documentar (Recomendado)». Esta decisão cobre 9 das 10 constatações, em 8 casos:

| Caso | Constatação aceite | Revisão |
| --- | --- | --- |
| expert-1 | WC do piso de cima entre divisórias baixas, junto à zona de jantar | RR3 |
| expert-2 | Banheira com uma só divisória baixa, virada para o escritório | RR3 |
| expert-4 | Sanita sem divisória face à bancada da despensa (assinalada duas vezes) | RR3, RR6 |
| expert-7 | WC à frente da bancada da despensa, só com parede baixa | RR3 |
| expert-9 | Sanita e duche sem paredes de casa de banho | RR3 |
| master-1 | WC aberto para o patamar da escada | RR4 |
| hard-4 | Fogão do piso de cima junto à sanita | RR2 |
| hard-12 | Sanita e banheira junto à bancada e ao fogão, separadas por meia parede | RR2 |

O master-6 constava da pergunta, mas deixou de precisar da exceção: a parede de 0,6 resolveu a constatação, e o RR6 confirmou 0 MAJOR nesse caso.

**expert-5 (RR6), corrigido localmente a 11/10/2026 (`0294395`).** A geometria foi verificada:
- a casa de banho (colunas 1 a 4, linhas 1 a 3) já estava delimitada pelas paredes norte e poente, por uma divisória a sul com porta e por uma divisória a nascente;
- a divisória a sul, voltada para o estúdio e o patamar, tinha só 0,35 de altura e lia-se como aberta;
- o banco e o guarda-fatos que o revisor viu na mesma faixa estão fora da casa de banho (no estúdio, junto à parede poente, e no quarto);
- a «faixa azul» ao longo da parede poente é o realce de coluna da pista da Lena na vista da solução, e não pavimento.

A divisória a sul passou para a altura normal (0,6), com a porta mantida. O validador não dá erros nem avisos novos, e a semântica passa. Na vista sem pessoas, a casa de banho lê-se como divisão fechada.

Na vista da solução, o realce de coluna e o esbatimento das paredes à frente das pessoas são comportamentos da interface e do renderizador. Ficam fora deste caso. Este caso não entra na exceção.

Estas exceções ficam documentadas para uma eventual melhoria futura do renderizador. Uma correção de fundo exige alterar o renderizador ou o validador, por exemplo com paredes de casa de banho mais altas e tolerância nas linhas de visão. Fica registada como «SYSTEM ESCALATION».

**Resultado:** 0 BLOCKER e 0 MAJOR por resolver, fora das 9 constatações aceites explicitamente.

## MINOR e POLISH

- **MINOR:** as 401 constatações estão registadas uma a uma em [`FINAL_VISUAL_AUDIT_FINDINGS.md`](FINAL_VISUAL_AUDIT_FINDINGS.md). Ficam aceites sem correção obrigatória. As mais baratas foram corrigidas durante a reconciliação, por exemplo o aparador sobre a célula do Viraj no easy-6 e o relógio do Oscar no expert-5.
- **POLISH:** nenhuma constatação foi classificada assim.

Temas recorrentes nas MINOR:
- Peças com aspeto ambíguo:
  - o frigorífico baixo lê-se como forno;
  - algumas mesas de trabalho parecem móveis de televisão;
  - algumas sanitas são pouco nítidas.
- Escadas que chegam a divisões sem patamar próprio.
- Divisões funcionais com mobília escassa, sem chegarem a parecer abandonadas.
- O texto de estado no fundo do ecrã do telemóvel fica cortado em vários casos (ver a secção seguinte).
- Peças que o vocabulário de pistas proíbe como decoração. Quando `chair`, `table`, `plant` ou `lamp` são vocabulário de pista, não se acrescentam peças desse tipo; daí mesas com uma só cadeira, bancos estofados e secretárias sem cadeira.

Trocar o frigorífico baixo pelo alto em todo o catálogo foi testado e revertido. Os frigoríficos encostados às paredes nascente e norte ficariam de costas para a câmara, o que viola a regra `tall-back-exposed` em 33 casos. Por isso, o frigorífico só passou a alto onde pode ficar virado a sul ou a nascente, como no master-2.

### Telemóvel: legibilidade e usabilidade

Das 401 MINOR, 17 referem o telemóvel.

1. **Texto de estado cortado: corrigido (`33b00fc`).**
   - **Problema:** na faixa «Continuity / Sequence» (`src/components/CaseProgressStrip.tsx`), a 390 px, a mensagem «All people placed — review the account before accusing.» ficava cortada em «All people placed — review the a…». Foi assinalado em 12 casos (very-easy-7, very-easy-8, easy-1 a easy-4, medium-7, hard-1, hard-2, hard-4, expert-5 e expert-8), mas o componente é o mesmo em todo o catálogo.
   - **Correção:** a instrução passa a quebrar linha em vez de ser truncada. O contador «N / N placed» fica numa só linha, alinhado ao topo no telemóvel e centrado a partir de `sm`.
   - **Medição em Chromium, caso easy-1 resolvido:**

     | Largura | Linhas da instrução | Excesso horizontal | Contador | Transbordo da página |
     | --- | ---: | ---: | --- | ---: |
     | 390 px | 2 | 0 | 1 linha | 0 |
     | 360 px | 2 | 0 | 1 linha | 0 |
     | 320 px | 3 | 0 | 1 linha | 0 |
     | 1 600 px | 1 | 0 | 1 linha | 0 |

   - **Computador:** a geometria fica idêntica. A faixa mantém 121 px de altura, e o tabuleiro fica na mesma posição.
   - **Acessibilidade:** o texto completo está no DOM e é lido pelos leitores de ecrã. O contraste do texto é de 5,99:1 sobre o papel (AA). O contador mantém `aria-live="polite"`.
   - **Testes:** `tests/CaseProgressStrip.test.tsx` cobre o texto completo, a ausência de truncagem, o contador numa linha e a mensagem «Next suggested».
   - **Na lista horizontal de pessoas:** o cartão seguinte continua cortado à direita. É o indício normal de deslocamento horizontal, e por isso fica como está.

2. **Pessoas «cortadas» no fundo do tabuleiro (não reproduzido na aplicação).**
   - Casos assinalados: hard-1, hard-2, expert-5 e expert-8.
   - Causa: o recorte de revisão do telemóvel mostra só os primeiros 860 px da captura. Nos casos de dois pisos, o tabuleiro desce abaixo desse limite.
   - Verificação: na captura completa do hard-1, o tabuleiro e as pessoas aparecem inteiros.

3. **Pérgula sobre metade do tabuleiro no telemóvel (master-4, RR5).** É a mesma questão de oclusão já tratada no master-4. A célula da solução lê-se.

## Semântica e visibilidade

- **Semântica:** o verificador de semântica passou nos 60 casos. Compara, com o commit aprovado `db52ce4`:
  - o conjunto das peças `logic`;
  - a decoração nova, face ao vocabulário de pistas.
- **Validador:** 0 erros nos 90 pisos.
- **Avisos `cell-hidden`:** nenhuma correção escondeu uma célula nova da solução.
  - O hard-4 tem 6 avisos novos no rés-do-chão, mas nenhum é de células da solução. Vêm da escada no corredor e dos pilares do jardim.
- **Células da solução escondidas:** desceram de 5 para 3. Todas são anteriores ao redesenho, e a revisão confirmou que se leem.

| Caso | Célula | Situação |
| --- | --- | --- |
| expert-1 | (3,5), Lena | Lê-se, e a planta também (OP8, RR3) |
| hard-10 | (2,0), Carol | Lê-se, e a planta também, confirmado com ampliação (RR2) |
| master-4 | (4,7), Viraj | Lê-se, atrás de um pilar (SN10, OP10, RR5) |

As células do expert-5 (5,5) e do hard-10 (5,7) deixaram de estar escondidas.

- **Avisos de pouca mobília:** os revisores confirmaram que nenhuma divisão assinalada parece abandonada. O hard-12 e o expert-1, 3 e 5 têm corredores mobilados, e no expert-6 e expert-9 o jardim tem pouca mobília mas está em uso.
- **Divisões grandes vazias:** não houve nenhuma constatação MAJOR.

## Métricas antes e depois

As heurísticas automáticas comparam a base anterior ao redesenho (v5) com o estado final. São indicadores grosseiros e não substituem a revisão visual.

| Heurística | Antes (v5) | Depois |
| --- | ---: | ---: |
| Pisos com algum alerta de programa | 85 de 90 | 67 de 90 |
| Divisão com pouca mobília (`SPARSE`) | 167 | 33 |
| Cadeira solta, sem mesa nem secretária (`CHAIR-ORPHAN`) | 41 | 5 |
| Sala sem assento (`LIVING-NOSEAT`) | 29 | 27 |
| Sala de jantar com poucas cadeiras (`DINING-FEWCHAIRS`) | 7 | 6 |
| Sala de jantar sem mesa (`DINING-NOTABLE`) | 1 | 0 |
| Quarto sem mesa de cabeceira (`BED-NONIGHTSTAND`) | 9 | 8 |
| Casa de banho sem lavatório (`BATH-NOSINK`) | 1 | 0 |
| Escritório sem secretária (`STUDY-NODESK`) | 2 | 1 |
| Secretária sem cadeira (`DESK-NOCHAIR`) | 15 | 21 |
| Sofá sem foco (`SOFA-NOFOCUS`) | 11 | 23 |
| Quarto aberto (`BEDROOM-OPEN`) | 15 | 19 |
| Casa de banho aberta (`BATH-OPEN`) | 6 | 8 |
| Mais de uma televisão por piso (`DUP-TV`) | 14 | 18 |
| Função de divisão duvidosa (`FUNC`) | 6 | 10 |

### Limites das heurísticas

- **Contagem por zona lógica:** contam peças por zona lógica do puzzle, e não por divisão construída. Por isso, quando uma parede não segue o limite de uma zona, `BEDROOM-OPEN`, `BATH-OPEN` e `FUNC` disparam sem haver defeito.
- **Banquetas e cozinhas com mesa:** um banco estofado conta como «sofá sem foco», e uma mesa de pequeno-almoço sem cadeira conta como «secretária sem cadeira». Estas peças aumentaram com o redesenho, porque `chair` é vocabulário de pista em muitos casos.
- **`DUP-TV`:** conta modelos que podem representar `tv`, incluindo aparadores de televisão usados como aparador.
- **Uso da métrica:** nenhuma heurística decide sozinha. Quem decide é a revisão visual. Foi assim que se encontrou e corrigiu o desencontro entre o quarto e o corredor no master-5.

## Validação final

Validação sobre a cabeça `0294395`, com os testes temporários fora do conjunto de testes:

| Controlo | Resultado |
| --- | --- |
| `npm test` | 44 ficheiros; 557 aprovados, 5 ignorados, 562 no total |
| `npm run lint` | Aprovado |
| Verificador de semântica | 60 de 60 casos |
| Validador de cenas | 90 pisos, 0 erros, 0 erros entre pisos |
| `npm run build` | Aprovado |
| `npm run validate:production` | 7/7 |
| `npm run verify` | 64/64 |
| `node scripts/measure-puzzles.mjs --check` | 60 casos, relatório atual |
| `npm run report:puzzles` | 60 casos |

O teste `exteriorSupport` verifica que os pilares entram nas linhas de visão. Passou a usar a célula (4,4) do hard-10, porque os pilares reposicionados deixaram de esconder a célula (5,7) (`2ba0920`). As referências de linhas de visão revistas foram atualizadas em `e038685` e `d3b5d40`.

## Implementação

- **Caminho de publicação canónico:** a Vercel. A demonstração pública está em `murdoku-seven.vercel.app` e a pré-visualização deste ramo foi construída sem erros.
- **Cloudflare:** a verificação **Workers Builds: murdoku** falha em todos os commits deste PR e também na cabeça do PR #1. O repositório não tem configuração da Cloudflare nem do Wrangler, e o resultado da verificação não inclui o registo de erro. Este bloqueio é separado da auditoria e continua por diagnosticar: sem o registo do painel da Cloudflare, não pode ser declarado resolvido. Uma pré-visualização da Vercel pronta não prova que a Cloudflare está saudável.

## Arquivo

### Arquivo original (prova histórica, imutável)

- **Ficheiro:** `Murdoku_Final_Visual_Audit_4dc05e1.zip`, com 360 MB.
- **Conteúdo:** as 342 capturas, `manifest.csv`, `manifest.json`, `SHA256SUMS` e `LEIA-ME.md`.
- **SHA-256:** `8e9646de0f29ad856b0527e54897289fbfb0192e9f2462aabbd7b88e4f28ef58`.
- **Correspondência com `4dc05e1`:** verificada.
  - Em cada caso, o último commit que alterou as cenas é anterior à captura.
  - Nenhum commit alterou código ou recursos de renderização fora das cenas desde a primeira captura.
  - As 342 somas conferem.

### Suplemento (HEAD `0294395`)

- **Ficheiro:** `Murdoku_Final_Visual_Audit_0294395_supplement.zip`, com 149 MB.
- **SHA-256:** `dbf66bcb9538c449e95acc15e5ec9b5427a8dfc36f449f8e51b7c0aa5e074cd4`.
- **Capturas novas:** 154.
  - As 150 vistas de telemóvel dos 60 casos, por causa da correção da instrução de estado.
  - As 4 vistas de computador do expert-5, por causa da divisória da casa de banho.
- **Vistas não recapturadas:** as restantes 188 capturas são idênticas, byte a byte, às do arquivo original.
- **Manifesto:** descreve as 342 capturas do conjunto final. A coluna `supplement_status` distingue «recaptured» e «unchanged».
- **Verificação:** o original extraído com o suplemento por cima confere 342/342 com o `SHA256SUMS` do suplemento.

### Onde estão guardados

- **Entregues ao responsável a 11/10/2026:** os dois ZIP, divididos em partes de 28 MiB, com as somas das partes e as instruções de reconstituição (`RECONSTITUIR.txt` e `RECONSTITUIR-SUPLEMENTO.txt`). O envio direto tem um limite de 30 MiB por ficheiro.
- **Google Drive:** nenhum conector estava disponível na sessão de trabalho, por isso a cópia no Drive fica a cargo do responsável.
- **Repositório:** nenhum dos arquivos está no repositório.
- **Verificação depois de guardar:** reconstituir cada ZIP e confirmar as somas SHA-256 acima.
