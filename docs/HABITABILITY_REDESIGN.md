# Redesenho de habitabilidade do catálogo

Registo de progresso durável. Serve para retomar o trabalho depois de uma interrupção sem repetir casos já feitos.

## Critério

Pergunta de aceitação para cada piso: **«Isto lê-se como um edifício plausível e habitado?»** Uma cena válida, jogável e sem colisões não chega, se as divisões não fizerem sentido arquitetónico ou doméstico.

Rubrica partilhada (11 pontos, igual para todos os operadores):

1. **Função da divisão:** cada divisão parece aquilo que diz ser. Não está vazia nem atulhada ao acaso.
2. **Casas de banho:**
   - fechadas, com porta;
   - sanita, lavatório e banheira ou duche encostados às paredes;
   - sem circulação através das peças sanitárias.
3. **Cozinhas:**
   - zona de trabalho coerente, com frigorífico, fogão, lava-loiça e bancadas em linha, em L ou em triângulo;
   - ligação lógica à sala de jantar ou à zona de serviço.
4. **Quartos:**
   - cama com a cabeceira contra uma parede;
   - mesa de cabeceira, se o vocabulário o permitir;
   - circulação à volta da cama;
   - nenhuma cama solta no meio da divisão.
5. **Salas de estar:** os assentos viram-se para um foco (televisão ou tapete). O conjunto lê-se como zona de conversa.
6. **Salas de jantar:**
   - mesa com cadeiras utilizáveis, viradas para a mesa;
   - relação com a cozinha.
7. **Escritórios:**
   - secretária com cadeira, se o vocabulário o permitir;
   - zona de leitura nos escritórios grandes;
   - nunca uma secretária isolada num espaço enorme.
8. **Circulação:**
   - as portas levam a sítios sensatos;
   - nada bloqueia portas nem percursos;
   - nenhum objeto decorativo esconde células do tabuleiro.
9. **Zonamento:**
   - zonas públicas, de serviço e privadas coerentes;
   - acesso plausível às casas de banho.
10. **Divisões grandes:** salas de 16 a 24 células não ficam com 3 a 6 peças soltas.
11. **Semântica do puzzle (obrigatório):**
    - nunca mudar culpado, vítima, pistas, solução, divisões lógicas ou peças `logic`;
    - nunca acrescentar decoração cujo modelo possa representar um tipo do vocabulário de pistas do caso;
    - as exceções ficam documentadas no relatório do caso.

## Controlos por caso

- **Validador de cenas:** 0 erros em todos os pisos. Os avisos `cell-hidden` não aumentam face à base, e nenhuma célula da solução fica escondida.
- **Verificação de semântica:**
  - compara as peças `logic` de cada cena com o commit aprovado `db52ce4` e exige o mesmo conjunto;
  - recusa decoração nova de um tipo presente no vocabulário de pistas do caso.
- **Revisão visual pelo responsável:** imagem da casa sem pessoas e com a solução colocada, julgada pelos 11 pontos.

## Ordem final

Redesenho de habitabilidade → testes, lint, build e validação de produção completos → captura nova dos 60 casos (computador e telemóvel) → revisão independente em contexto limpo (dois revisores) → correções → nova captura das cenas afetadas → segunda revisão final → `FINAL_VISUAL_AUDIT.md` → arquivo e manifesto → Notion → descrição do PR.

As capturas `__after` anteriores a este redesenho são apenas histórico. Não servem de prova final.

## Estado por caso

Legenda:

| Estado | Significado |
| --- | --- |
| feito | Redesenho concluído, sem erros e com a semântica a passar. |
| em curso | Alterações parciais. |
| pendente | Ainda não foi iniciado. |
| commit | Integrado no ramo e publicado. |

| Nível | Caso | Estado | Notas |
| --- | --- | --- | --- |
| Very Easy | very-easy-1 a very-easy-8 | commit | Revisto. Exceções de vocabulário: very-easy-6 e very-easy-8 (`chair`). very-easy-1 e very-easy-2 são referências douradas; as imagens de referência têm de ser refeitas na captura final |
| Easy | easy-1 a easy-10 | commit | Revisto. Exceções de vocabulário: easy-1 sem mesa de pequeno-almoço, easy-10 com banco estofado. easy-1 é referência dourada |
| Medium | medium-1 a medium-12 | commit | Revisto. Exceções de vocabulário (`chair`): mesas de jantar com 1 ou 2 cadeiras em medium-1, 3, 6 e 7; secretárias sem cadeira em medium-1, 2 e 8. medium-12: a televisão do recanto mostra a traseira porque as duas células de televisão são adjacentes |
| Hard | hard-1 | feito | Revisto; a sanita encosta à parede sul, rebaixada pela câmara |
| Hard | hard-2, hard-4, hard-6 | commit | Revistos. hard-4: Office com mesa de trabalho porque `desk` é vocabulário de pista; os duches de hard-4 e hard-6 continuam a esconder as mesmas células de antes |
| Hard | hard-3, hard-5 | commit | Jardim ou pátio convertido em jardim de inverno interior, aprovado pelo responsável a 08/10/2026 (tal como master-4 e master-7). A verificação de colunas do teste `exteriorSupport` passou a usar o hard-6 |
| Hard | hard-7 a hard-12 | commit | Revistos, sem nenhuma nova célula de solução escondida; as zonas exteriores mantêm-se exteriores. Duas casas de banho fechadas em hard-7; cozinha fechada e separada da casa de banho em hard-12 (a confirmar na revisão final). Exceções: secretária do estúdio do hard-10 sem cadeira; bancos estofados no hard-12 (`chair`, `table`, `counter` e `lamp` são vocabulário de pista) |
| Expert | expert-1 a expert-5 | commit | Revisto, sem nenhuma nova célula de solução escondida. Casas de banho fechadas com porta, segunda televisão num recanto próprio, quarto do expert-5 encostado a uma parede. Exceções: o WC do expert-2 é acedido pela casa de banho principal, e há bancos estofados onde `chair` é vocabulário de pista |
| Expert | expert-6 a expert-10 | commit | Revistos, sem nenhuma nova célula de solução escondida. Corredores e galerias evitam quartos de passagem; a casa de banho do expert-7 está fechada. Exceções: as secretárias do expert-9 não têm cadeira (`chair`), a secretária do expert-6 junto à escada funciona como prateleira de escrita, e as peças sanitárias duplicadas vêm do puzzle |
| Master | master-1 a master-8 | commit | Revisto, sem nenhuma nova célula de solução escondida. Casas de banho e WC fechados; corredores evitam quartos de passagem; a escada de master-4 e master-7 foi reposicionada. **Decisão aprovada a 08/10/2026:** em master-4 o alpendre e em master-7 o jardim passaram a zonas interiores (alpendre envidraçado, jardim de inverno) para eliminar as vigas sobre células de pista; as divisões lógicas mantêm-se |

Atualizado em 11/10/2026. Redesenho e auditoria visual final concluídos nos 60 casos (90 pisos); ver `FINAL_VISUAL_AUDIT.md`. Exceção aceite explicitamente pelo responsável a 11/10/2026: casas de banho superiores fechadas por divisórias baixas (0,35/0,6), que na vista em corte se leem como abertas (9 constatações em 8 casos). A constatação do expert-5 (RR6) aguarda decisão.
