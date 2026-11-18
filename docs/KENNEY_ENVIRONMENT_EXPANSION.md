# Roteiro de expansão dos ambientes Kenney

Este roteiro parte dos recursos medidos em `docs/KENNEY_PACK_SURVEY.md` e das capacidades que já existem no código. Não promete temas sem suporte físico e visual.

## Estado atual

O sistema já suporta:

- interiores e exteriores como topologias arquitetónicas diferentes;
- pátios, terreno exterior rebaixado, fundações e soleiras;
- materiais `wood`, `tile`, `stone`, `grass` e `dirt`;
- paredes, portas e janelas com abertura física;
- uma seleção de 21 modelos da Nature Kit, medida e catalogada;
- casas de um ou dois pisos, escadas, patamares e vista fantasma ou explodida;
- composição exterior não alinhada com a grelha nos pilotos The Empty Chair e The Last Nightcap.

## Nível 1 — funciona com o sistema atual

| Família | Pacotes autorizados | Limites |
| --- | --- | --- |
| apartamento ou casa | Furniture Kit | envelope recortado, até dois pisos; sem telhado exterior |
| escritório ou estudo | Furniture Kit | usa secretárias, cadeiras, estantes, candeeiros e superfícies existentes |
| sala de jantar, café ou bar doméstico | Furniture Kit | sem alimentos detalhados; balcões e mesas existentes |
| pátio ou jardim murado | Furniture Kit + subconjunto Nature Kit | relva, pedra, arbustos, árvore, rochas e vedação já catalogados |
| jardim frontal ou exterior parcial | Furniture Kit + subconjunto Nature Kit | zona `exterior`, fundação e soleira; o edifício continua a usar o envelope atual |
| casa de dois pisos | Furniture Kit | uma cena por piso; escada e abertura validadas |

Estas famílias podem ser produzidas por uma `SceneSpec` nova, sem alterar o esquema, o renderizador ou os validadores.

## Nível 2 — extensão pequena e isolada

| Família | Recurso provável | Trabalho obrigatório |
| --- | --- | --- |
| parque ou clareira | Nature Kit | medir e importar mais bancos, troncos, flores e caminhos; caso-piloto totalmente exterior; rever iluminação |
| acampamento | Nature Kit ou Survival Kit | tendas e fogueira; adaptador separado se usar Survival Kit; auditoria de oclusão |
| restaurante, café ou bar | Food Kit | modelos pequenos sempre apoiados em superfícies-pai; catálogo semântico e caso-piloto |
| loja ou supermercado | Mini Market | usar prateleiras e arcas como mobiliário, não as paredes de 1,00; adaptar materiais `colormap` |
| cemitério | Graveyard Kit | paleta e materiais próprios, árvores no perímetro, criptas fora das células jogáveis |
| cabana sazonal | Holiday Kit | escolher uma única escala de envelope e validar neve, telhado e iluminação |

Cada extensão de Nível 2 deve ter um commit de adaptador, testes físicos, um caso-piloto e aprovação visual antes de entrar num lote de conteúdo.

## Nível 3 — trabalho de arquitetura do sistema

| Família | Motivo |
| --- | --- |
| rua ou quarteirão urbano | City Kit (Roads) exige uma segunda grelha modular, passeios, limites de mapa e iluminação exterior |
| exterior suburbano completo | City Kit (Suburban) usa casas em escala de cidade, não interiores jogáveis |
| exterior comercial | City Kit (Commercial) usa edifícios completos e arranha-céus em escala própria |
| armazém ou fábrica | Factory Kit e City Kit (Industrial) exigem uma linguagem estrutural e de circulação nova |
| fachada com telhado, varanda ou escada exterior | Building Kit ou Modular Buildings precisam de um adaptador de envelope; as paredes de 2,40 ou os andares de 0,60 não podem misturar-se diretamente com a parede interior de 1,29 |
| beco retro | Retro Urban Kit usa textura pixelizada incompatível; só avançaria com uma direção visual nova e aprovada |

Um caso de Nível 3 é «SYSTEM ESCALATION». Não pertence a produção normal do Opus.

## Ordem de adoção recomendada

1. parque ou clareira apenas com a Nature Kit já compatível;
2. café/restaurante com um subconjunto pequeno da Food Kit;
3. supermercado com objetos da Mini Market, mantendo a estrutura atual;
4. cemitério como lote temático isolado;
5. só depois estudar um adaptador exterior para Building Kit ou City Kit.

## Regras visuais exteriores

- uma árvore alta fica no perímetro norte/oeste ou precisa de prova de visibilidade;
- caminhos e vedações não devem repetir a grelha célula a célula;
- objetos naturais formam grupos com variação de modelo e rotação permitida;
- a associação lógica continua exata, mesmo quando a composição visual se afasta do centro da célula;
- o terreno mantém alturas discretas e validadas; não se criam elevações manuais;
- cada família precisa de controlo em ambiente isolado, jogo completo, secretária e telemóvel.

## Critério de saída

Uma família passa para o nível suportado apenas quando existe:

- pelo menos um caso jogável;
- todos os modelos medidos e catalogados;
- zero erros físicos;
- jogabilidade completa;
- imagens de referência aprovadas;
- documentação do adaptador e dos seus limites.
