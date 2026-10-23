# Isometric scene system — the recipe

This is the authoring contract for every dollhouse scene in Alibi/Murdoku. It exists so that a scene can be built by a capable agent **without improvising any foundational rule**. If a rule here is not enough to decide something, the answer is "ask", not "tune a number until it looks close".

Companion documents: `ADR-0001-3d-scene-renderer.md` (why 3D), `ROOT_CAUSE_REPORT.md` (what went wrong before), `SCENE_MIGRATION_PLAN.md` (how to roll this out), `MULTI_STOREY_ARCHITECTURE.md` (current multi-storey contract), `TWO_STOREY_FEASIBILITY.md` (historical decision), `KENNEY_PACK_SURVEY.md` (asset evidence), and `OPUS_PRODUCTION_MANUAL.md` (mandatory production gate).

> Contrato V2 de vários pisos: `makeFrame` usa 32° em cenas de um piso e
> `makeStoreyFrame` usa 42° em vistas de vários pisos. O mesmo `SceneFrame`
> alimenta projeção, câmara e validação. As cenas atuais declaram
> `storeyFootprint`, `stairwellBounds` contínuo com máximos exclusivos e
> `circulation`. Consulte o contrato em
> [`MULTI_STOREY_ARCHITECTURE.md`](MULTI_STOREY_ARCHITECTURE.md) e as APIs em
> [`schema.ts`](../src/scene3d/schema.ts), [`resolve.ts`](../src/scene3d/resolve.ts),
> [`units.ts`](../src/scene3d/units.ts), [`circulationGeometry.ts`](../src/scene3d/circulationGeometry.ts),
> [`storeyConnection.ts`](../src/scene3d/storeyConnection.ts),
> [`validate.ts`](../src/scene3d/validate.ts), [`renderer.ts`](../src/scene3d/renderer.ts)
> e [`explodedConnection.ts`](../src/scene3d/explodedConnection.ts).

Golden master: **Midnight Delivery** (`src/scene3d/scenes/midnight-delivery.ts`). When in doubt, do what it does. Reference renders: `docs/scenes/midnight-delivery-*.png`.

---

## 0. Two topologies, one contract

| | Puzzle topology | Architectural topology |
| --- | --- | --- |
| Lives in | `src/data/cases/*.ts`, `src/core/*` | `src/scene3d/scenes/*.ts` |
| Owns | N×N cells, rooms, furniture list, clues, solution | shell, walls, doors, windows, floor materials, visual furniture, décor |
| May change when authoring a scene | **never** | freely |

The only bridge is `logic: 'type@row,col'` on a visual object. It says "this thing on screen is the puzzle's `bed` at (0,0)". The validator enforces that every logical furnishing is represented, by a model allowed to represent that type, touching the logical cells. Nothing else about the puzzle is visible to the scene.

A Murdoku row is allowed to cross several rooms. Rooms in the puzzle are rectangles of cells; the house is not obliged to draw a wall on any cell edge, and must not draw a wall on every one.

---

## 1. Units and camera (fixed; do not change per scene)

- World units are **Kenney units**: one `floorFull` tile is 1×1, a `wall` is 1.29 tall, every model's feet are at y = 0 in the file.
- One Murdoku cell = `CELL = 0.8` units. A 6×6 board is 4.8 units on a side.
- Axes: `x` grows with **column** (screen right-down), `z` grows with **row** (screen left-down), `y` is up.
- Camera: orthographic, azimuth 45°, elevation 32°, from the +x/+z corner. It never moves. `units.ts` is the single source of the projection and the renderer's camera is built from it, so DOM overlays and pixels agree.
- Facing: `S` = toward the camera (+z), `N` = toward the back (−z), `E` = +x, `W` = −x. A model's *front* is its +z side at rot 0; `against` picks the facing for you.

Authoring coordinates are **cell units** (0…N). Convert in your head: 1 cell = 0.8 Kenney units. Kenney sizes (from `catalog.generated.ts`): double bed 0.96 × 1.13, sofa 0.98 × 0.41, kitchen cabinet 0.43 × 0.45, desk 0.73 × 0.39, fridge 0.43 wide × 0.92 tall.

---

## 2. Scene schema (`src/scene3d/schema.ts`)

```ts
{
  puzzleId: 'very-easy-1', floor: 0,
  entry:  { wall: 'west' | 'north', at: <cell> },            // the front door
  shell:  { features: [{ wall: 'north'|'west', at, kind: 'window'|'door' }] },
  floors: [{ id, cells: [col0,row0,col1,row1], material: 'wood'|'grass'|'tile'|'stone'|'dirt',
             kind?: 'interior'|'exterior'|'courtyard' }],
  walls:  [{ id, from: [x,z], to: [x,z], height?: 'low'|'cutaway'|'room-cutaway'|'half'|'full',
             openings?: [{ at, width?, kind: 'door'|'open' }], freeEnds?: ['from'|'to'] }],
  furniture: [{ id, model, logic?, facing?,
                at?: [x,z] | against?: { wall, at, side?, gap? } | on?: { parent, offset?, surface? },
                yaw? }],
  rugs: [{ id, model, at, facing? }],
  stairs: { model: 'stairsOpen', at: [x,z], facing: 'E' }, // ground floor only; direction of climb
  stairwell: [col0,row0,col1,row1], // upper floor only; inclusive cells without slab
}
```

What the schema deliberately **cannot** express: per-object scale, pixel offsets, lifts, arbitrary y, a wall without two endpoints, a prop without a parent. If you want one of those you have misdiagnosed the problem — go back to the rule that applies.

### 2.1 Placement modes

| Mode | Use for | Result |
| --- | --- | --- |
| `against: { wall, at, side? }` | anything that belongs to a wall: beds, sofas, desks, counters, consoles, bookcases | back face touches the finished wall face (plus `gap` and the model's `rearGap`); facing is set away from the wall |
| `on: { parent, surface?, offset? }` | lamps, laptops, microwaves, TVs, books, small plants | feet at the parent's measured surface height; footprint must stay on the parent |
| `at: [x, z]` | free-standing pieces: coffee table, dining table, chairs, floor lamp, plant, parcel | centre of footprint at that point |

`side` is required for interior walls (`N/S` for x-axis walls, `E/W` for z-axis walls). The shell walls are `'north' | 'west' | 'south' | 'east'`.

---

## 3. The house before the furniture

### 3.1 Shell and cutaway (one rule, never varied)

- North and west shell walls: full height (1.29), carry windows and the front door.
- South and east shell walls: cut to a 0.12 plinth. The floor slab edge is the visible base.
- Corners meet: the resolver extends closed wall ends by half a thickness. Never author corner pieces.
- Every interior shell segment ends at a corner or at a window/door feature; the validator checks continuity. An explicitly authored exterior zone removes the shell along its exposed grid edges.

### 3.2 Partitions

A V4 distingue o recorte voltado para a câmara (`cutaway`, 0,6) do recorte
lateral de uma divisão (`room-cutaway`, altura definida em
`ROOM_PARTITION_HEIGHT`). A classe histórica `low` conserva 0,6 para as cenas
existentes. `full` usa `FULL_PARTITION_HEIGHT`, correspondente aos 1,29 do
envelope. As guardas continuam a usar `half` com tratamento `railing`; a sua
altura não acompanha as divisórias. A escolha e a comparação visual estão
registadas no [relatório V4](RESIDENTIAL_POLISH_V4.md).

- Default `'low'` (0.6): a Sims-style cut-down wall. Reads as a wall, hides nothing at standee height.
- `'half'` (0.35): a pony wall / breakfast bar. **The only wall furniture may back onto from the camera side** (its west or north face), because anything behind a 0.6 wall on that side is hidden (see §4.4).
- `'full'` (1.29): only where nothing playable is behind it. The validator will tell you if you are wrong.
- Both endpoints must land on the shell or another wall. A deliberate open end (a nib wall, a pony wall stopping at a pass-through) is declared with `freeEnds`. Undeclared free ends are errors — they are the "unexplained posts" of the sprite era.
- Thickness is 0.08 for everything. Do not draw thickness by hand.

### 3.3 Openings

- `door`: o aro interior é construído por membros procedimentais de secção medida no `doorwayOpen.glb`. `width` define o vão estrutural, em células; por omissão, este mede 0,506 unidades. O aro adapta-se ao vão, conserva a secção de 0,02835 e a passagem vertical de 0,98118174. A guarnição nas duas faces cobre a folga de montagem e sobrepõe a parede em 0,014175, com meia secção do aro exposta junto à passagem. O aro mantém a altura completa quando a parede é apresentada em recorte. A entrada exterior conserva a folha Kenney e recebe apenas guarnição. Ver [medições e regras V4](RESIDENTIAL_POLISH_V4.md).
- `open`: a plain pass-through; give it a `width` (1.0–1.3 cells reads as patio doors / a wide opening).
- Keep 0.3+ cells of wall between an opening and a corner or it reads as a jamb-less slot.
- Clearance: 0.45 units on both sides of every opening must be free of solid furniture (validated).
- An opening that would leave a piece shorter than ~0.15 cells at a wall's end is a stub. Extend the opening to the end and declare a `freeEnd` instead (this is exactly the fix applied to Midnight Delivery's pony wall).

### 3.4 Circulation

- Declare the `entry`. Every room must be walkable from it (validated with a 0.2-unit grid; walls thinner than the grid still block).
- Hallways are entrance halls or galleries, not corridors: open them onto a room (Midnight Delivery's hall flows into the living room; The Last Nightcap's hall is a two-cell gallery with pony walls to the kitchen and garden).

### 3.5 Floors

- O pavimento interior predefinido é de madeira. As zonas `floors` aceitam `wood`, `tile`, `stone`, `grass` e `dirt`.
- Declara a intenção através de `kind`: `interior` conserva pavimento acabado; `exterior` baixa o terreno e remove o envelope no limite exposto; `courtyard` baixa o terreno, mas conserva o envelope. As transições têm fundação e soleiras.
- Sem `kind`, `grass` e `dirt` assumem `exterior`; os restantes materiais assumem `interior`. Não descrevas um pátio apenas pela cor verde: usa `kind: 'courtyard'`.
- Num piso superior, o `stairwell` remove a laje nas células declaradas. Tapetes e mobiliário não podem preencher esse vazio.

---

## 4. Furniture rules

### 4.1 Grounding and support (never a number)

- Floor furniture: `against` or `at`. Feet are at y = 0 because the models are.
- Surface props (`support: 'surface'` in the catalogue) **must** be `on` a parent whose surface `role` is in the prop's `requires` list. Microwave → `counter`; laptop → `desk`/`table`; table lamp → `nightstand`/`table`/`desk`/`counter`/`shelf`/`stand`; TV → `stand`/`table`; books → `shelf`/`desk`/`table`/`nightstand`.
- Surface heights are measured from the meshes (desk 0.38, side table 0.38, bedside cabinet 0.26, TV cabinet 0.31, kitchen counters 0.45, coffee table 0.23, dining table 0.33, bookcaseOpen shelves 0.13/0.37/0.61/0.88).
- Rugs go in `rugs`, lie flat at y = 0.002, have no collision.

### 4.2 Collision and contact

- Physical envelope = the model's bounding box turned to its facing. Envelopes may not intersect walls or each other (4 mm tolerance). Contact with a wall face is exactly what `against` produces; that is allowed and expected.
- Children may overhang a parent by at most 0.03 (the TV on the TV cabinet); larger overhang is an error. Models whose usual child overhangs them carry `rearGap` in the catalogue so `against` leaves room.

### 4.3 Orientation

- Tall objects (> 0.7, or flagged `tall`) must face `S` or `E` — never show their back to the camera — unless the catalogue marks them `symmetric` (floor lamps, plants, coat stands, speakers).
- A tall object `against` the south or east shell (cut-away side) is allowed but reported as a warning: its back faces the camera. Accept only when the logical cell leaves no alternative (Midnight Delivery's fridge at (4,5)); otherwise re-plan.
- Chairs face their table/desk. Sofas face the TV. Counters face into the kitchen. Beds have their head to a wall.
- Furniture is square to the walls. Only models marked `loose` in the catalogue accept `yaw`; this includes selected small props and natural landscaping assets. Do not infer eligibility from the model name.

### 4.4 Visibility

- Every cell must be visible at standee-chest height (0.45) from the camera; the validator warns per cell. In practice this means: **never put décor south-east of a cell centre it does not itself occupy** — the bin behind the desk end and the plant in front of the hall cell were both caught this way.
- Furniture against a partition must be on the wall's **south or east face** unless the wall is `'half'`. The TV cabinet on the west face of a 0.6 wall was invisible; making the wall a pony wall fixed it.
- Small floor props (bins, boxes) stand in front of (south/east of) the furniture they belong to. Behind it, their base is hidden and they read as sitting on top of it.

### 4.5 Composition (visual-quality rules; not machine-checked)

- Living: sofa → coffee table → TV/media on the axis the sofa faces. A rug under the group.
- Kitchen: one continuous run against one wall: cabinet, sink, cabinet+microwave, stove. Fridge at the run's end or in the nearest corner. Dining table with two chairs facing each other.
- Office: desk against a wall, laptop on it, chair facing it, a bin beside (in front of) the desk end, storage against a side wall, a floor lamp behind the chair.
- Bedroom: bed head to the wall, nightstand beside the head with a lamp on it, clear floor at the foot.
- Hall: a console with a lamp, a doormat inside the front door, nothing in door clearances.
- No orphan chair, no prop placed "to fill a cell". Every object has a reason a person would put it there.
- One story cue from the case's flavour text (the unopened parcel beside the victim's cell), never scattered clutter.

---

## 5. Lighting and shadows (fixed in `renderer.ts`)

- One hemisphere fill (sky `#fff8ec`, ground `#9c8266`, 1.6) and one warm key light (`#ffe2b8`, 2.2) from upper-left-front. Shadows come from the key light's shadow map: contact shadows under every object, cast shadows falling right and back.
- No per-object shadow settings exist. If an object looks airborne, its placement is wrong, not its shadow.
- Kenney materials are unlit in the files; they are rebuilt as Lambert with +15% saturation so the palette matches Kenney's own sample renders. Window glass is opaque midnight blue (the case plays at night, and translucent glass would show the page behind the house).

---

## 6. Interaction layer (`IsoBoard.tsx`)

- Em repouso, antes de selecionar uma célula, não se desenha uma grelha permanente.
- A célula ativa tem contorno duplo, escuro e claro, legível sobre o mobiliário. A seleção persiste quando o ponteiro sai; o foco de teclado permite deslocação pelas setas e colocação com Enter ou espaço.
- As faixas de linha e coluna mantêm-se no pavimento. As indicações de colocação só aparecem com uma pessoa selecionada e respeitam ocupação e exclusões entre pisos. Ao mover uma pessoa, a sua posição atual não deve bloquear a própria linha ou coluna.
- A pessoa colocada conserva um contorno nos pés. O conflito acrescenta vermelho, tracejado, símbolo e texto; não depende apenas de cor.
- O estado textual identifica célula, divisão, ocupação, conflito ou disponibilidade da linha e coluna. Disponibilidade não é garantia de solução correta.
- A localização de pistas usa realce creme/âmbar sobre os alvos, apenas quando pedida. Selecionar uma pessoa não revela automaticamente a resposta da pista.
- O contexto do outro piso nunca recebe interação. Verifica seleção, troca de piso, ajuda e conflitos na vista de jogo e no panorama explodido.

---

## 7. Validation (`validate.ts`) — machine-checkable invariants

Errors (must be zero to ship):

| Code | Meaning |
| --- | --- |
| `unresolved` | schema misuse: missing parent, wrong surface role, non-axis wall, opening off its wall, a rug in `furniture` |
| `wall-penetration` | envelope intersects a wall piece |
| `furniture-overlap` | two solid envelopes intersect |
| `outside-floor` | envelope leaves the slab |
| `unsupported-prop` / `prop-overhang` | surface prop without a parent / hanging off it |
| `door-blocked` | solid furniture inside an opening's clearance |
| `wall-free-end` | partition end in open floor without `freeEnds` |
| `room-unreachable` | a room the entry cannot walk to |
| `object-hidden` | a floor object hidden behind a wall from the camera |
| `tall-back-exposed` | tall, non-symmetric object facing N/W (error), or against the cut shell (warning) |
| `logic-missing` / `logic-unknown` / `logic-type` / `logic-displaced` | the puzzle contract |

Warnings (a human decides): `cell-hidden`, `tall-back-exposed` on the cut shell, `no-entry`.

Na advertência `cell-hidden`, as três escadas retas usam onze volumes conservadores medidos nos GLB, em vez de um bloco com a altura total do lanço. Isto evita falsas ocultações junto aos degraus baixos. Os testes provam que os volumes incluem os triângulos reais e preservam a ocultação no topo. Colisões, acessibilidade, vão e patamares continuam a usar a caixa de limites completa. Esta exceção pertence ao sistema (`stairVisibility.ts`), não à autoria; não ajustes volumes por caso.

The dev build prints the report to the console on every scene build; `tests/IsoBoard.test.tsx` runs it for every authored scene and also proves each rule fires on a deliberately broken spec.

## 8. Visual-quality checks (a human, or an agent with a browser)

Machine checks cannot judge beauty. Before a scene ships, look at native-resolution crops of:

1. the whole house, environment only (`?env=1&case=<id>`),
2. every shell corner and the front plinth,
3. every doorway and pass-through,
4. every wall junction,
5. each room's furniture group,
6. the entry,
7. the interaction states (hover, armed, placed, conflict, clue),
8. mobile width (390 px).

Use `?diag=1` to see the physical model (blue wall pieces, orange openings, green furniture, pink surface props) over the render. Use `?elev=` / `?pw=` only to *study* a problem; the shipped constants are in `units.ts`.

Reject if anything floats, intersects, ends nowhere, shows its back, blocks a door, or reads as a grid.

---

## 9. Anti-patterns from this project, and the rule that replaces each

| Don't | Do |
| --- | --- |
| "move the counter −0.15 until it looks close to the wall" | `against: { wall: 'kitchen-back', side: 'S', at: 3.35 }` |
| "lift the microwave 20 px" | `on: { parent: 'counter-2' }` |
| "scale the side table 0.58 so it fits" | choose a model whose real size fits (`cabinetBedDrawerTable`, `sideTable`); there is no scale |
| "green footprint doesn't cross the wall centre-line" | envelopes are boxes; walls have thickness; contact is allowed, penetration is not |
| "add a bigger blob shadow so it looks grounded" | it is grounded because its feet are at y = 0; fix the placement, not the shadow |
| "cut the north wall into three spans with a low link" | shell walls are continuous; openings are features |
| "wall from (0.02, 2.58) span 2.04" | walls run between two named points on the plan and end on something |
| "put the TV cabinet against the west face of the kitchen wall" | camera-side faces of low walls are blind spots; use a pony wall or the S/E face |
| "chairDesk in the kitchen, tableCoffee for dining" | choose by room role: `chair` + `table` for dining, `chairDesk` + `desk` for the office |
| "the fridge looks fine from behind" | it is a known compromise: warn, look, and only accept when the logical cell forces it |
| "tests pin span = 2.36, height = 82" | tests assert invariants (zero errors, every logic represented, closed shell) |

---

## 10. Known limits

- A Furniture Kit não fornece um relógio nem um teto. `radio`/`speaker` representam relógios segundo a convenção do catálogo; documenta essa substituição na cena. O catálogo integrado já inclui arbustos `plant_bush*` medidos, por isso não é necessário substituir toda a vegetação por plantas em vaso.
- Tall furniture whose logical cell is on the south/east edge must either face S/E free-standing or back onto the cut shell (warning). There is no third option without changing the puzzle, which is forbidden.
- Windows are night-blue by material override; a daytime case would need a different glass rule (one constant in `renderer.ts`).
- Two-storey cases render one scene per floor and require matched stairs/stairwell geometry. The active floor is accompanied by a non-interactive structural ghost of the other floor; an exploded overview is optional. See `TWO_STOREY_FEASIBILITY.md` and the `hard-1` reference case.

## 11. Aceitação arquitetónica de dois pisos

Consulta a secção 6.8 de `OPUS_PRODUCTION_MANUAL.md` antes de desenhar os móveis. Reserva primeiro escada, vão, chegada e circulação. `facing` designa a direção de subida e a posição `at` designa o centro da pegada física, não o primeiro degrau.

A cabeça do lanço deve tocar na aresta da laje, sem intervalo horizontal nem laje sobre a chegada. Usa o comprimento medido do modelo dividido por `CELL` para definir esse contacto. A coincidência de células e os testes de acessibilidade não substituem a inspeção dos degraus reais.

Guarda os lados expostos do vão, abre a chegada para uma galeria utilizável e mantém o percurso até às portas. A galeria pode pertencer a uma divisão lógica diferente de «Landing»; essa separação não autoriza circulação ambígua. Rejeita tapetes sobre o vazio, mobiliário no acesso e áreas superiores sem função. Confirma a relação escada–laje na vista à altura real e na vista explodida; a segunda é um auxiliar, não uma correção da primeira.

No contexto fantasma, desenham-se arestas arquitetónicas sem diagonais da triangulação. A escada do contexto mantém leitura sólida à altura real e fica oculta pela laje ativa; no panorama explodido, surge translúcida. Estas são regras do renderizador, não parâmetros de autoria por cena. Qualquer limitação que exija alterar projeção, geometria resolvida ou validação exige «SYSTEM ESCALATION», com prova e autorização próprias.
