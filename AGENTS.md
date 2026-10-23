# Instruções permanentes de produção

Antes de criar ou modificar um caso Murdoku ou uma cena 3D, lê `docs/OPUS_PRODUCTION_MANUAL.md` na íntegra.

- Nunca trabalhes diretamente em `main`, no ramo protegido de referência dourada ou em `checkpoint/fable-5.1-interrupted-2026-09-02`.
- Cria cada lote de produção a partir do SHA de referência aprovado, num ramo novo `opus/*`.
- Não alteres o solucionador, o gerador, o esquema, o renderizador ou os validadores para fazer passar um caso de produção.
- Se um caso exigir uma alteração fundamental do sistema, para e regista uma «SYSTEM ESCALATION».
- Para cada unidade lógica: executa a validação relevante, revê a diferença, cria um commit descritivo e publica-o apenas no ramo autorizado.
- Não adiciones pacotes Kenney completos. Mantém apenas os modelos medidos e usados por cenas implementadas.
